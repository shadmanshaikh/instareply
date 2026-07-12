require('dotenv').config();

const ACCESS_TOKEN = process.env.INSTAGRAM_PAGE_ACCESS_TOKEN;
const APP_ID = process.env.META_APP_ID;
const GRAPH_API_BASE = 'https://graph.instagram.com/v25.0';

async function diagnose() {
  console.log('=== Instagram Webhook Diagnostic ===\n');

  // 1. Check token validity
  console.log('1️⃣  Checking access token...');
  try {
    const meRes = await fetch(`${GRAPH_API_BASE}/me?fields=id,name,username&access_token=${ACCESS_TOKEN}`);
    const meData = await meRes.json();
    if (meData.error) {
      console.error('   ❌ Token is INVALID:', meData.error.message);
      return;
    }
    console.log('   ✅ Token is valid');
    console.log('   Account ID:', meData.id);
    console.log('   Username:', meData.username || 'N/A');
    console.log('   Name:', meData.name || 'N/A');
  } catch (err) {
    console.error('   ❌ Error checking token:', err.message);
    return;
  }

  // 2. Debug token to check permissions
  console.log('\n2️⃣  Checking token permissions...');
  try {
    const debugRes = await fetch(`https://graph.facebook.com/debug_token?input_token=${ACCESS_TOKEN}&access_token=${ACCESS_TOKEN}`);
    const debugData = await debugRes.json();
    if (debugData.data) {
      console.log('   App ID:', debugData.data.app_id);
      console.log('   Type:', debugData.data.type);
      console.log('   Is Valid:', debugData.data.is_valid);
      console.log('   Expires:', debugData.data.expires_at === 0 ? 'Never' : new Date(debugData.data.expires_at * 1000).toISOString());
      console.log('   Scopes:', debugData.data.scopes?.join(', ') || 'N/A');
      console.log('   Granular Scopes:', debugData.data.granular_scopes?.map(s => s.scope).join(', ') || 'N/A');
    } else {
      console.log('   Could not debug token:', JSON.stringify(debugData));
    }
  } catch (err) {
    console.error('   ❌ Error debugging token:', err.message);
  }

  // 3. Check app subscriptions
  console.log('\n3️⃣  Checking app-level webhook subscriptions...');
  try {
    const subRes = await fetch(`https://graph.facebook.com/v25.0/${APP_ID}/subscriptions?access_token=${ACCESS_TOKEN}`);
    const subData = await subRes.json();
    if (subData.error) {
      console.log('   ⚠️  Cannot check app subscriptions (may need app-level token):', subData.error.message);
    } else if (subData.data && subData.data.length > 0) {
      subData.data.forEach(sub => {
        console.log(`   📌 Object: ${sub.object}`);
        console.log(`      Callback URL: ${sub.callback_url}`);
        console.log(`      Fields: ${sub.fields?.map(f => f.name).join(', ')}`);
        console.log(`      Active: ${sub.active}`);
      });
    } else {
      console.log('   ⚠️  No app-level webhook subscriptions found!');
      console.log('   → You need to configure webhooks in the Meta Developer Portal');
    }
  } catch (err) {
    console.error('   ❌ Error checking subscriptions:', err.message);
  }

  // 4. Check page-level subscribed apps
  console.log('\n4️⃣  Checking page-level subscribed apps...');
  try {
    const meRes = await fetch(`${GRAPH_API_BASE}/me?fields=id&access_token=${ACCESS_TOKEN}`);
    const meData = await meRes.json();
    const pageId = meData.id;

    const subAppsRes = await fetch(`${GRAPH_API_BASE}/${pageId}/subscribed_apps?access_token=${ACCESS_TOKEN}`);
    const subAppsData = await subAppsRes.json();
    if (subAppsData.error) {
      console.log('   ⚠️  Cannot check page subscriptions:', subAppsData.error.message);
    } else if (subAppsData.data && subAppsData.data.length > 0) {
      subAppsData.data.forEach(app => {
        console.log(`   📌 App: ${app.name || app.id}`);
        console.log(`      Subscribed Fields: ${app.subscribed_fields?.join(', ')}`);
      });
    } else {
      console.log('   ⚠️  No page-level app subscriptions found!');
    }
  } catch (err) {
    console.error('   ❌ Error checking page subscriptions:', err.message);
  }

  // 5. Test sending a simple GET to the webhook
  console.log('\n5️⃣  Summary & Next Steps:');
  console.log('   Make sure in the Meta Developer Portal:');
  console.log('   a) Go to your App → Webhooks');
  console.log('   b) Select "Instagram" from the dropdown');
  console.log('   c) Subscribe to the "messages" field');
  console.log('   d) Callback URL: https://instareply-ten.vercel.app/api/webhook');
  console.log('   e) Verify Token: ' + process.env.WEBHOOK_VERIFY_TOKEN);
  console.log('   f) Click the "Test" button next to "messages" to send a test event');
}

diagnose();
