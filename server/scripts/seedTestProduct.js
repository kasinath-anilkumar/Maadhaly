const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Product = require('../models/Product');
const Category = require('../models/Category');

dotenv.config();

const seedTestProduct = async () => {
  try {
    const envUri = process.env.MONGODB_URI;
    const fallback = 'mongodb://localhost:27017/saree-store';
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
    
    let connected = false;
    let usedUri = '';

    // Try Atlas first
    if (envUri) {
      try {
        const atlasUri = resolveMongoUri(envUri);
        await mongoose.connect(atlasUri, { serverSelectionTimeoutMS: 5000 });
        console.log('✓ Connected to Atlas MongoDB');
        usedUri = atlasUri;
        connected = true;
      } catch (atlasErr) {
        console.log('⚠ Atlas connection failed, trying local...');
      }
    }

    // Fall back to local
    if (!connected) {
      await mongoose.connect(fallback);
      console.log('✓ Connected to local MongoDB');
      usedUri = fallback;
      connected = true;
    }

    console.log('Using database:', usedUri.includes('mongodb+srv') ? 'Atlas' : 'Local');

    // Create or get a category
    let category = await Category.findOne({ name: 'Test Category' });
    if (!category) {
      category = await Category.create({
        name: 'Test Category',
        slug: 'test-category',
        description: 'Test category for products'
      });
      console.log('Created test category with ID:', category._id);
    } else {
      console.log('Found existing test category with ID:', category._id);
    }

    // Check if test product already exists
    const existing = await Product.findOne({ sku: 'TEST-SAR-001' });
    if (existing) {
      console.log('Test product already exists, deleting old one...');
      const del = await Product.deleteOne({ sku: 'TEST-SAR-001' });
      console.log('Deleted:', del.deletedCount);
    }

    // Create test product with valid public image URLs
    console.log('Creating test product...');
    const product = await Product.create({
      name: 'Test Saree',
      description: 'This is a test saree product to verify Cloudinary image display',
      price: 2999,
      originalPrice: 3999,
      stock: 10,
      category: category._id,
      fabric: 'Silk',
      color: 'Red',
      images: [
        {
          url: 'https://images.pexels.com/photos/1536619/pexels-photo-1536619.jpeg?auto=compress&cs=tinysrgb&w=400',
          public_id: 'saree-store/products/test-saree-1'
        }
      ],
      sku: 'TEST-SAR-001',
      work: 'Embroidery',
      occasion: ['Wedding', 'Party'],
      isFeatured: true,
      isActive: true
    });

    console.log('✓ Test product created:', product.name);
    console.log('✓ Product ID:', product._id);
    console.log('✓ Is Active:', product.isActive);
    console.log('✓ Images:', product.images);
    
    // Verify it was saved
    const verify = await Product.findById(product._id);
    if (verify) {
      console.log('✓ Product verified in database');
    } else {
      console.log('✗ WARNING: Product not found after save!');
    }
    
    process.exit(0);
  } catch (err) {
    console.error('✗ Error seeding test product:', err.message);
    console.error('Stack:', err.stack);
    process.exit(1);
  }
};

seedTestProduct();
