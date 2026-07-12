require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('DATABASE_URL is not set in environment variables');
  process.exit(1);
}

const pool = new Pool({
  connectionString,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Checking database bot settings...');
  const settings = await prisma.botSettings.findFirst({
    where: { id: 'default' }
  });

  if (settings) {
    console.log(`Current model in DB: ${settings.model}`);
    if (settings.model === 'google/gemini-2.0-flash-001') {
      console.log('Updating model to google/gemini-2.5-flash...');
      await prisma.botSettings.update({
        where: { id: 'default' },
        data: { model: 'google/gemini-2.5-flash' }
      });
      console.log('✅ Model updated successfully in database!');
    } else {
      console.log('Model in database does not need updating.');
    }
  } else {
    console.log('No settings record found. It will be created on the next webhook call.');
  }
}

main()
  .catch((e) => {
    console.error('Error updating model:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
