const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const Product = require('../models/Product');
const { auth, adminAuth } = require('../middleware/auth');
const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');

// Configure cloudinary if env vars provided
let cloudinaryEnabled = false;
if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
  cloudinaryEnabled = true;
  console.log('✓ Cloudinary is configured');
} else {
  console.warn('⚠ Cloudinary not configured. Using local file storage for product images.');
}

// Configure multer for image uploads. Use memory storage when uploading to Cloudinary, disk storage otherwise.
const storage = cloudinaryEnabled
  ? multer.memoryStorage()
  : multer.diskStorage({
      destination: (req, file, cb) => {
        cb(null, 'uploads/products/');
      },
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'product-' + uniqueSuffix + path.extname(file.originalname));
      }
    });

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG and WebP are allowed.'), false);
  }
};

const upload = multer({ 
  storage,
  fileFilter,
  limits: { fileSize: 15 * 1024 * 1024 } // 15MB limit
});

// Helper to upload buffer to Cloudinary
const uploadBufferToCloudinary = (buffer, folder = 'saree-store/products') => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream({ folder }, (error, result) => {
      if (error) return reject(error);
      resolve({ url: result.secure_url, public_id: result.public_id });
    });
    streamifier.createReadStream(buffer).pipe(uploadStream);
  });
};

// Helper to build full image URL for local files
const buildImageUrl = (imagePath, req) => {
  if (!imagePath) return null;
  if (imagePath.startsWith('http')) return imagePath; // Already a full URL
  // Prepend server origin to relative paths
  const protocol = req.protocol || 'http';
  const host = req.get('host');
  return `${protocol}://${host}${imagePath}`;
};

// Normalize image payloads from mixed legacy formats (string/object/null)
const normalizeProductImages = (images, req) => {
  if (!Array.isArray(images)) return [];

  return images
    .map((img) => {
      if (typeof img === 'string') return img;
      if (img && typeof img === 'object') {
        if (typeof img.url === 'string') return img.url;
        if (typeof img.secure_url === 'string') return img.secure_url;
      }
      return null;
    })
    .filter((url) => typeof url === 'string' && url.length > 0)
    .map((url) => buildImageUrl(url, req));
};

// @route   GET /api/products
// @desc    Get all products with filters
// @access  Public
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 12,
      sort = '-createdAt',
      category,
      minPrice,
      maxPrice,
      color,
      fabric,
      occasion,
      work,
      search,
      featured,
      isActive = 'true'
    } = req.query;

    const query = {};

    // Filters
    if (category) query.category = category;
    if (color) query.color = { $regex: color, $options: 'i' };
    if (fabric) query.fabric = { $regex: fabric, $options: 'i' };
    if (occasion) query.occasion = { $in: occasion.split(',') };
    if (work) query.work = work;
    if (featured) query.isFeatured = featured === 'true';
    if (isActive !== 'all') query.isActive = String(isActive) === 'true';

    // Price range
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    // Search
    if (search) {
      query.$text = { $search: search };
    }

    const skip = (Number(page) - 1) * Number(limit);

    const products = await Product.find(query)
      .populate('category', 'name slug')
      .sort(sort)
      .skip(skip)
      .limit(Number(limit));

    const total = await Product.countDocuments(query);

    // Normalize images to URLs for API responses
    const productsPlain = products.map((p) => {
      const obj = p.toObject ? p.toObject() : p;
      obj.images = normalizeProductImages(obj.images, req);
      return obj;
    });

    res.json({
      products: productsPlain,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/products/featured
// @desc    Get featured products
// @access  Public
router.get('/featured', async (req, res) => {
  try {
    const products = await Product.find({ isFeatured: true, isActive: true })
      .populate('category', 'name slug')
      .limit(8);
    // Normalize images to URLs for API responses
    const productsPlain = products.map((p) => {
      const obj = p.toObject ? p.toObject() : p;
      obj.images = normalizeProductImages(obj.images, req);
      return obj;
    });
    res.json(productsPlain);
  } catch (error) {
    console.error('Get featured products error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/products/:id
// @desc    Get single product
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('category', 'name slug')
      .populate('reviews.user', 'name');

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Normalize images to URLs for API responses
    const prodObj = product.toObject ? product.toObject() : product;
    prodObj.images = normalizeProductImages(prodObj.images, req);
    res.json(prodObj);
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/products
// @desc    Create a new product
// @access  Private/Admin
router.post('/', adminAuth, upload.array('images', 5), async (req, res) => {
  try {
    const productData = JSON.parse(req.body.data || '{}');
    
    // Add image paths (upload to Cloudinary or local storage)
    if (req.files && req.files.length > 0) {
      if (cloudinaryEnabled) {
        // Upload to Cloudinary
        const uploadPromises = req.files.map((file) => uploadBufferToCloudinary(file.buffer));
        const uploads = await Promise.all(uploadPromises);
        productData.images = uploads; // array of { url, public_id }
      } else {
        // Store locally
        productData.images = req.files.map((file) => ({
          url: `/uploads/products/${file.filename}`,
          public_id: null
        }));
      }
    }

    // Generate SKU if not provided
    if (!productData.sku) {
      productData.sku = 'SAR-' + Date.now();
    }

    // Ensure isActive defaults to true if not provided
    if (productData.isActive === undefined) {
      productData.isActive = true;
    }

    const product = await Product.create(productData);
    await product.populate('category');

    // Normalize response: build full URLs and convert images to URLs
    const prodObj = product.toObject ? product.toObject() : product;
    prodObj.images = normalizeProductImages(prodObj.images, req);

    res.status(201).json({
      message: 'Product created successfully',
      product: prodObj
    });
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   PUT /api/products/:id
// @desc    Update a product
// @access  Private/Admin
router.put('/:id', adminAuth, upload.array('images', 5), async (req, res) => {
  try {
    const productData = JSON.parse(req.body.data || '{}');
    
    // Add new image paths if uploaded
    if (req.files && req.files.length > 0) {
      if (cloudinaryEnabled) {
        // Upload to Cloudinary
        const uploadPromises = req.files.map((file) => uploadBufferToCloudinary(file.buffer));
        const newUploads = await Promise.all(uploadPromises);

        // Normalize keepImages: allow array of URLs or objects
        const keep = Array.isArray(productData.keepImages) ? productData.keepImages.map((k) => {
          if (typeof k === 'string') return { url: k, public_id: null };
          if (k && typeof k === 'object') return { url: k.url || k, public_id: k.public_id || null };
          return null;
        }).filter(Boolean) : [];

        if (keep.length > 0) {
          productData.images = [...keep, ...newUploads];
        } else {
          productData.images = newUploads;
        }
      } else {
        // Store locally
        const newUploads = req.files.map((file) => ({
          url: `/uploads/products/${file.filename}`,
          public_id: null
        }));

        // Normalize keepImages: allow array of URLs or objects
        const keep = Array.isArray(productData.keepImages) ? productData.keepImages.map((k) => {
          if (typeof k === 'string') return { url: k, public_id: null };
          if (k && typeof k === 'object') return { url: k.url || k, public_id: k.public_id || null };
          return null;
        }).filter(Boolean) : [];

        if (keep.length > 0) {
          productData.images = [...keep, ...newUploads];
        } else {
          productData.images = newUploads;
        }
      }
    }

    delete productData.keepImages;

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      productData,
      { new: true }
    ).populate('category');

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Normalize response: build full URLs and convert images to URLs
    const prodObj = product.toObject ? product.toObject() : product;
    prodObj.images = normalizeProductImages(prodObj.images, req);

    res.json({
      message: 'Product updated successfully',
      product: prodObj
    });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   DELETE /api/products/:id
// @desc    Delete a product (permanent delete)
// @access  Private/Admin
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/products/:id/review
// @desc    Add a review to product
// @access  Private
router.post('/:id/review', auth, async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Check if user already reviewed
    const alreadyReviewed = product.reviews.find(
      r => r.user.toString() === req.user.id
    );

    if (alreadyReviewed) {
      return res.status(400).json({ message: 'You have already reviewed this product' });
    }

    product.reviews.push({
      user: req.user.id,
      rating,
      comment
    });

    // Update average rating
    product.ratings.count = product.reviews.length;
    product.ratings.average = product.reviews.reduce((acc, item) => item.rating + acc, 0) / product.reviews.length;

    await product.save();

    res.status(201).json({ message: 'Review added successfully' });
  } catch (error) {
    console.error('Add review error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
