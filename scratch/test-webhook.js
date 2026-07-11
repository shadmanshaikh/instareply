const crypto = require('crypto');
require('dotenv').config();

const PORT = 3000;
const WEBHOOK_URL = `http://localhost:${PORT}/api/webhook`;
const APP_SECRET = process.env.META_APP_SECRET;

if (!APP_SECRET) {
  console.error('Error: META_APP_SECRET is not defined in your environment variables.');
  process.exit(1);
}

// Generate unique message ID so it doesn't get skipped by the deduplication step
const uniqueMessageId = `mid.test_${Date.now()}_${Math.floor(Math.random() * 10000)}`;

const mockPayload = {
  object: "instagram",
  entry: [
    {
      id: "instagram_business_account_id",
      time: Date.now(),
      messaging: [
        {
          sender: { id: "1234567890" }, // Mock User Instagram-scoped ID (IGSID)
          recipient: { id: "instagram_business_account_id" },
          timestamp: Date.now(),
          message: {
            mid: uniqueMessageId,
            text: "Hello! This is a test query to verify the AI assistant."
          }
        }
      ]
    }
  ]
};

const payloadString = JSON.stringify(mockPayload);

// Generate signature using HMAC SHA-256 and the App Secret
const signature =
  'sha256=' +
  crypto.createHmac('sha256', APP_SECRET).update(payloadString).digest('hex');

console.log('Sending mock Meta webhook POST payload:');
console.log(JSON.stringify(mockPayload, null, 2));
console.log(`Computed signature (x-hub-signature-256): ${signature}`);

async function runTest() {
  try {
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-hub-signature-256': signature
      },
      body: payloadString
    });

    const bodyText = await response.text();
    console.log('\n--- Webhook Response ---');
    console.log(`Status Code: ${response.status} ${response.statusText}`);
    console.log(`Response Body: ${bodyText}`);
    console.log('------------------------');

    if (response.status === 200) {
      console.log('\n✅ Local signature check passed successfully!');
      console.log('Now checking database configuration to verify insertion...');
    } else {
      console.log('\n❌ Webhook test failed.');
    }
  } catch (error) {
    console.error('Error sending test webhook request:', error);
  }
}

runTest();
