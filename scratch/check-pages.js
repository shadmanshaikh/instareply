require('dotenv').config();

const ACCESS_TOKEN = process.env.INSTAGRAM_PAGE_ACCESS_TOKEN;

async function checkPages() {
  console.log('=== Checking Facebook Pages and Instagram Accounts ===');
  
  // 1. Try to fetch /me/accounts on graph.facebook.com (Page Access Token check)
  try {
    console.log('\nQuerying graph.facebook.com/v25.0/me/accounts...');
    const res = await fetch(`https://graph.facebook.com/v25.0/me/accounts?access_token=${ACCESS_TOKEN}`);
    const data = await res.json();
    if (data.error) {
      console.log('❌ Error on facebook.com/me/accounts:', data.error.message);
    } else {
      console.log('✅ Connected Facebook Pages:', JSON.stringify(data, null, 2));
    }
  } catch (err) {
    console.error('Error:', err.message);
  }

  // 2. Try to fetch /me on graph.facebook.com
  try {
    console.log('\nQuerying graph.facebook.com/v25.0/me...');
    const res = await fetch(`https://graph.facebook.com/v25.0/me?access_token=${ACCESS_TOKEN}`);
    const data = await res.json();
    if (data.error) {
      console.log('❌ Error on facebook.com/me:', data.error.message);
    } else {
      console.log('✅ Facebook User/Page info:', JSON.stringify(data, null, 2));
    }
  } catch (err) {
    console.error('Error:', err.message);
  }
}

checkPages();
