// Seed script for adding sample products
// Run with: node seed/products.js

const mongoose = require('mongoose');
const Product = require('../models/Product');
const Category = require('../models/Category');
require('dotenv').config();

const sampleProducts = [
  {
    name: 'Red Banarasi Silk Saree with Gold Zari',
    description: 'A stunning red Banarasi silk saree featuring intricate gold zari work. Perfect for weddings and special occasions.',
    price: 15999,
    originalPrice: 19999,
    discount: 20,
    fabric: 'Pure Silk',
    color: 'Red',
    occasion: ['Wedding', 'Festive'],
    work: 'Banarasi',
    stock: 15,
    isActive: true,
    isFeatured: true,
    images: ['https://images.unsplash.com/photo-1610030469973-723884d47b9f?w=600'],
  },
  {
    name: 'Royal Blue Kanjeevaram Silk Saree',
    description: 'Traditional Kanjeevaram silk saree in royal blue with golden temple border. A timeless classic.',
    price: 18999,
    originalPrice: 22999,
    discount: 17,
    fabric: 'Pure Silk',
    color: 'Royal Blue',
    occasion: ['Wedding', 'Traditional'],
    work: 'Kanjeevaram',
    stock: 10,
    isActive: true,
    isFeatured: true,
    images: ['https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=600'],
  },
  {
    name: 'Green Chanderi Cotton Silk Saree',
    description: 'Lightweight Chanderi saree in beautiful green shade with subtle sheen. Perfect for summer occasions.',
    price: 4999,
    originalPrice: 5999,
    discount: 17,
    fabric: 'Cotton Silk',
    color: 'Green',
    occasion: ['Casual', 'Party'],
    work: 'Chikankari',
    stock: 25,
    isActive: true,
    isFeatured: false,
    images: ['https://images.unsplash.com/photo-1603189343302-e603f7add05a?w=600'],
  },
  {
    name: 'Pink Bandhani Cotton Saree',
    description: 'Traditional Bandhani tie-dye saree in vibrant pink. Handcrafted by artisans from Gujarat.',
    price: 3499,
    originalPrice: 4499,
    discount: 22,
    fabric: 'Cotton',
    color: 'Pink',
    occasion: ['Festive', 'Casual'],
    work: 'Bandhani',
    stock: 30,
    isActive: true,
    isFeatured: true,
    images: ['https://images.unsplash.com/photo-1583391733955-919084911c23?w=600'],
  },
  {
    name: 'White Linen Saree with Floral Print',
    description: 'Elegant white linen saree with delicate floral print. Perfect for office wear and casual outings.',
    price: 2999,
    originalPrice: 3999,
    discount: 25,
    fabric: 'Linen',
    color: 'White',
    occasion: ['Casual', 'Formal'],
    work: 'Printed',
    stock: 40,
    isActive: true,
    isFeatured: false,
    images: ['https://images.unsplash.com/photo-1594631252845-29fc4cc8cde9?w=600'],
  },
  {
    name: 'Designer Georgette Saree with Sequin Work',
    description: 'Contemporary designer saree in georgette fabric with beautiful sequin work. Perfect for parties.',
    price: 7999,
    originalPrice: 9999,
    discount: 20,
    fabric: 'Georgette',
    color: 'Black',
    occasion: ['Party', 'Formal'],
    work: 'Embroidery',
    stock: 20,
    isActive: true,
    isFeatured: true,
    images: ['https://images.unsplash.com/photo-1610194352361-4c81a6a8967e?w=600'],
  },
  {
    name: 'Bridal Red Saree with Heavy Embroidery',
    description: 'Stunning bridal saree with heavy embroidery and stone work. Make your special day memorable.',
    price: 25999,
    originalPrice: 32999,
    discount: 21,
    fabric: 'Silk',
    color: 'Red',
    occasion: ['Wedding'],
    work: 'Zardozi',
    stock: 8,
    isActive: true,
    isFeatured: true,
    images: ['https://images.unsplash.com/photo-1594633313593-bab3825d0caf?w=600'],
  },
  {
    name: 'Yellow Cotton Saree with Block Print',
    description: 'Bright yellow cotton saree with traditional block print. Comfortable for daily wear.',
    price: 1999,
    originalPrice: 2499,
    discount: 20,
    fabric: 'Cotton',
    color: 'Yellow',
    occasion: ['Casual', 'Festive'],
    work: 'Printed',
    stock: 50,
    isActive: true,
    isFeatured: false,
    images: ['https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=600'],
  },
];

async function seedProducts() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/saree-store');
    console.log('Connected to MongoDB');

    // Get categories
    const categories = await Category.find({});
    if (categories.length === 0) {
      console.log('No categories found. Please run categories.js first.');
      process.exit(1);
    }

    // Map categories by slug for easy lookup
    const categoryMap = {};
    categories.forEach(cat => {
      categoryMap[cat.slug] = cat._id;
    });

    // Assign categories to products
    const productsWithCategories = sampleProducts.map((product, index) => {
      let categoryId;
      
      // Assign category based on product type
      if (product.work === 'Banarasi') {
        categoryId = categoryMap['banarasi-silk'];
      } else if (product.work === 'Kanjeevaram') {
        categoryId = categoryMap['kanjeevaram'];
      } else if (product.fabric === 'Cotton' || product.fabric === 'Cotton Silk') {
        categoryId = categoryMap['cotton-sarees'];
      } else if (product.work === 'Bandhani') {
        categoryId = categoryMap['bandhani'];
      } else if (product.fabric === 'Linen') {
        categoryId = categoryMap['linen-sarees'];
      } else if (product.occasion.includes('Wedding') && product.price > 20000) {
        categoryId = categoryMap['wedding-collection'];
      } else {
        categoryId = categoryMap['designer-sarees'];
      }

      return {
        ...product,
        category: categoryId,
        sku: `SAR-${Date.now()}-${index}`,
      };
    });

    // Clear existing products
    await Product.deleteMany({});
    console.log('Cleared existing products');

    // Insert new products
    const result = await Product.insertMany(productsWithCategories);
    console.log(`Successfully added ${result.length} products:`);
    result.forEach(prod => console.log(`  - ${prod.name} (₹${prod.price})`));

    console.log('\nProducts seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding products:', error);
    process.exit(1);
  }
}

seedProducts();
