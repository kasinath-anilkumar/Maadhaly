// Seed script for adding sample categories
// Run with: node seed/categories.js

const mongoose = require('mongoose');
const Category = require('../models/Category');
require('dotenv').config();

const categories = [
  {
    name: 'Banarasi Silk',
    description: 'Exquisite handwoven silk sarees from Varanasi, known for their gold and silver zari work.',
    slug: 'banarasi-silk',
    order: 1,
    isActive: true,
  },
  {
    name: 'Kanjeevaram',
    description: 'Traditional silk sarees from Kanchipuram, Tamil Nadu, famous for their vibrant colors and temple borders.',
    slug: 'kanjeevaram',
    order: 2,
    isActive: true,
  },
  {
    name: 'Chanderi',
    description: 'Lightweight and sheer sarees from Madhya Pradesh with a glossy transparency.',
    slug: 'chanderi',
    order: 3,
    isActive: true,
  },
  {
    name: 'Bandhani',
    description: 'Tie-dye sarees from Gujarat and Rajasthan featuring intricate patterns.',
    slug: 'bandhani',
    order: 4,
    isActive: true,
  },
  {
    name: 'Cotton Sarees',
    description: 'Comfortable and breathable cotton sarees perfect for daily wear.',
    slug: 'cotton-sarees',
    order: 5,
    isActive: true,
  },
  {
    name: 'Linen Sarees',
    description: 'Elegant and lightweight linen sarees for a sophisticated look.',
    slug: 'linen-sarees',
    order: 6,
    isActive: true,
  },
  {
    name: 'Designer Sarees',
    description: 'Contemporary designer sarees with modern patterns and embellishments.',
    slug: 'designer-sarees',
    order: 7,
    isActive: true,
  },
  {
    name: 'Wedding Collection',
    description: 'Bridal sarees and wedding special collection for your special day.',
    slug: 'wedding-collection',
    order: 8,
    isActive: true,
  },
];

async function seedCategories() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/saree-store');
    console.log('Connected to MongoDB');

    // Clear existing categories
    await Category.deleteMany({});
    console.log('Cleared existing categories');

    // Insert new categories
    const result = await Category.insertMany(categories);
    console.log(`Successfully added ${result.length} categories:`);
    result.forEach(cat => console.log(`  - ${cat.name} (${cat.slug})`));

    console.log('\nCategories seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding categories:', error);
    process.exit(1);
  }
}

seedCategories();
