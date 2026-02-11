const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/saree-store';

const name = process.env.ADMIN_NAME || 'Admin User';
const email = process.env.ADMIN_EMAIL || 'admin@example.com';
const password = process.env.ADMIN_PASSWORD || 'Admin@123';

const createAdmin = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    const existing = await User.findOne({ email });
    if (existing) {
      console.log('Admin user already exists:', existing.email);
      process.exit(0);
    }

    const admin = await User.create({
      name,
      email,
      password,
      phone: '0000000000',
      role: 'admin'
    });

    console.log('Admin user created:', admin.email);
    process.exit(0);
  } catch (err) {
    console.error('Error creating admin user', err);
    process.exit(1);
  }
};

createAdmin();
