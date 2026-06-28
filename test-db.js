// Load env variables manually from .env.local
const fs = require('fs');
const path = require('path');

const envPath = path.resolve(__dirname, '.env.local');
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8');
  content.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const parts = trimmed.split('=');
      const key = parts[0].trim();
      const value = parts.slice(1).join('=').trim();
      process.env[key] = value;
    }
  });
}

const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI;
console.log('Testing connection to URI:', uri ? uri.replace(/:([^@]+)@/, ':****@') : 'undefined');

if (!uri) {
  console.error('No MONGODB_URI found in .env.local!');
  process.exit(1);
}

const client = new MongoClient(uri);

async function run() {
  try {
    console.log('Connecting to database...');
    await client.connect();
    console.log('Successfully connected!');
    const db = client.db('Finflow');
    const collections = await db.listCollections().toArray();
    console.log('Collections in Finflow database:', collections.map(c => c.name));
  } catch (err) {
    console.error('Connection failed with error:');
    console.error(err);
  } finally {
    await client.close();
  }
}

run();
