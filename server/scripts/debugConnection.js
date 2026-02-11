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
console.log('Base URI:', baseUri);
console.log('Resolved URI:', atlasUri);

(async () => {
  try {
    await mongoose.connect(atlasUri, { serverSelectionTimeoutMS: 8000 });
    console.log('✓ Connected successfully');

    const Product = require('../models/Product');
    const count = await Product.countDocuments();
    console.log('Product count:', count);
    
    const all = await Product.find({}, { name: 1 });
    console.log('First 5 products:', all.slice(0, 5));
    
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
})();
