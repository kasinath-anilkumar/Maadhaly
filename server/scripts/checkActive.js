require('dotenv').config();
const mongoose = require('mongoose');

const baseUri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB_NAME || 'saree-store';

const resolveMongoUri = (uri) => {
  if (!uri) return uri;
  const [rawBase, rawQuery] = uri.split('?');
  const base = rawBase.endsWith('/') ? rawBase.slice(0, -1) : rawBase;
  const parts = base.split('/');
  const hasExplicitDb = parts.length > 3 && parts[3];
  if (hasExplicitDb) return uri;
  const withDb = `${base}/${dbName}`;
  return rawQuery ? `${withDb}?${rawQuery}` : withDb;
};

const atlasUri = resolveMongoUri(baseUri);

(async () => {
  try {
    await mongoose.connect(atlasUri, { serverSelectionTimeoutMS: 8000 });
    console.log('✓ Connected');

    const Product = require('../models/Product');
    const all = await Product.find({}, { name: 1, isActive: 1, isFeatured: 1 });
    
    console.log('\nAll products:');
    all.forEach((p, i) => {
      console.log(`${i+1}. ${p.name || 'NO NAME'}`);
      console.log(`   isActive: ${p.isActive}`);
      console.log(`   isFeatured: ${p.isFeatured}`);
    });
    
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
})();
