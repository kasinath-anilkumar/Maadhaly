const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const atlasUrl = process.env.MONGODB_URI;

async function findDatabase() {
  try {
    console.log('Connecting to Atlas...');
    const conn = await mongoose.connect(atlasUrl);
    console.log('Connected!');
    
    // Try default database (no explicit db name in URL)
    const client = mongoose.connection.getClient();
    const adminDb = client.db('admin');
    const dbList = await adminDb.admin().listDatabases();
    
    console.log('Databases in cluster:');
    dbList.databases.forEach(db => console.log('  -', db.name));
    
    // Search for products in each database
    console.log('\nSearching for products...');
    for (const database of dbList.databases) {
      const db = client.db(database.name);
      const count = await db.collection('products').countDocuments();
      if (count > 0) {
        console.log(`✓ Found ${count} products in database: ${database.name}`);
      }
    }
    
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

findDatabase();
