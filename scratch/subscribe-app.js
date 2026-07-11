const crypto = require('crypto');
require('dotenv').config();

const ACCESS_TOKEN = process.env.INSTAGRAM_PAGE_ACCESS_TOKEN;

if (!ACCESS_TOKEN || ACCESS_TOKEN === 'your_page_access_token') {
  console.error('Error: INSTAGRAM_PAGE_ACCESS_TOKEN is not configured in your .env file.');
  process.exit(1);
}

const GRAPH_API_BASE = 'https://graph.facebook.com/v21.0';

async function subscribeApp() {
  try {
    // 1. Fetch current Page details to get Page ID
    console.log('Fetching Facebook Page details...');
    const pageRes = await fetch(`${GRAPH_API_BASE}/me?access_token=${ACCESS_TOKEN}`);
    const pageData = await pageRes.json();

    if (!pageRes.ok) {
      console.error('Failed to fetch Page details:', pageData);
      process.exit(1);
    }

    const pageId = pageData.id;
    const pageName = pageData.name;
    console.log(`Successfully identified Page: ${pageName} (ID: ${pageId})`);

    // 2. Subscribe the App to the Page's messages field
    console.log(`Subscribing app to messages webhook for page ${pageId}...`);
    const subRes = await fetch(`${GRAPH_API_BASE}/${pageId}/subscribed_apps?access_token=${ACCESS_TOKEN}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        subscribed_fields: ['messages']
      })
    });

    const subData = await subRes.json();

    if (subRes.ok && subData.success) {
      console.log('\n✅ Successfully subscribed your App to the Page messages webhook!');
      console.log('Meta will now start routing DMs to your callback URL.');
    } else {
      console.error('\n❌ Failed to subscribe:', subData);
    }
  } catch (error) {
    console.error('Error during app subscription script execution:', error);
  }
}

subscribeApp();
