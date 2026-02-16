const express = require('express');
const router = express.Router();
const multer = require('multer');
const Product = require('../models/Product');
const Order = require('../models/Order');
const { auth, adminAuth } = require('../middleware/auth');
const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');

const cloudinaryEnabled = Boolean(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
);

if (cloudinaryEnabled) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
  console.log('Cloudinary is configured for product uploads');
} else {
  console.warn('Cloudinary is not configured. Product image uploads are disabled until CLOUDINARY_* env vars are set.');
}

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG and WebP are allowed.'), false);
  }
};

const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter,
  limits: { fileSize: 15 * 1024 * 1024 } // 15MB limit
});
const MAX_PRODUCT_IMAGES = 20;

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

const handleDbError = (res, error) => {
  if (error?.name === 'CastError') {
    return res.status(400).json({ message: 'Invalid resource id' });
  }
  if (error?.name === 'ValidationError') {
    return res.status(400).json({ message: error.message });
  }
  if (error?.code === 11000) {
    return res.status(409).json({ message: 'Duplicate value for a unique field' });
  }
  return res.status(500).json({ message: 'Server error', error: error?.message });
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

const normalizeIncomingImages = (images) => {
  if (!Array.isArray(images)) return [];

  return images
    .map((img) => {
      if (typeof img === 'string') {
        return { url: img, public_id: null };
      }
      if (img && typeof img === 'object') {
        if (typeof img.url === 'string' && img.url.trim()) {
          return { url: img.url, public_id: img.public_id || null };
        }
        if (typeof img.secure_url === 'string' && img.secure_url.trim()) {
          return { url: img.secure_url, public_id: img.public_id || null };
        }
      }
      return null;
    })
    .filter(Boolean);
};

const toFiniteNumber = (value) => {
  if (value === undefined || value === null || value === '') return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
};

const calculatePricing = (priceValue, originalPriceValue) => {
  const price = toFiniteNumber(priceValue);
  const originalPrice = toFiniteNumber(originalPriceValue);

  if (price === null || price < 0) return null;

  if (originalPrice !== null && originalPrice > price) {
    const discount = Math.round(((originalPrice - price) / originalPrice) * 100);
    return { price, originalPrice, discount };
  }

  return { price, originalPrice: undefined, discount: 0 };
};

const applyPricingToResponse = (productObj) => {
  const pricing = calculatePricing(productObj.price, productObj.originalPrice);
  if (!pricing) return productObj;

  productObj.price = pricing.price;
  productObj.discount = pricing.discount;
  if (pricing.originalPrice !== undefined) {
    productObj.originalPrice = pricing.originalPrice;
  } else {
    delete productObj.originalPrice;
  }

  return productObj;
};

const recalculateRatings = (product) => {
  product.ratings.count = product.reviews.length;
  product.ratings.average =
    product.reviews.length > 0
      ? product.reviews.reduce((sum, review) => sum + Number(review.rating || 0), 0) /
        product.reviews.length
      : 0;
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
      return applyPricingToResponse(obj);
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
    return handleDbError(res, error);
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
      return applyPricingToResponse(obj);
    });
    res.json(productsPlain);
  } catch (error) {
    console.error('Get featured products error:', error);
    return handleDbError(res, error);
  }
});

// @route   GET /api/products/reviews/admin
// @desc    Get all product reviews (Admin)
// @access  Private/Admin
router.get('/reviews/admin', adminAuth, async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '', verified = '' } = req.query;
    const pageNumber = Math.max(1, Number(page) || 1);
    const limitNumber = Math.max(1, Math.min(100, Number(limit) || 20));
    const searchQuery = String(search || '').trim();
    const products = await Product.find(
      { 'reviews.0': { $exists: true } },
      { name: 1, reviews: 1 }
    )
      .populate('reviews.user', 'name email')
      .lean();

    let flattened = [];
    for (const product of products) {
      for (const review of product.reviews || []) {
        flattened.push({
          reviewId: review._id,
          productId: product._id,
          productName: product.name,
          rating: review.rating,
          title: review.title,
          comment: review.comment,
          verifiedPurchase: Boolean(review.verifiedPurchase),
          createdAt: review.createdAt,
          user: review.user
            ? {
                _id: review.user._id,
                name: review.user.name,
                email: review.user.email,
              }
            : null,
        });
      }
    }

    if (verified === 'true' || verified === 'false') {
      const shouldBeVerified = verified === 'true';
      flattened = flattened.filter((review) => Boolean(review.verifiedPurchase) === shouldBeVerified);
    }

    if (searchQuery) {
      const needle = searchQuery.toLowerCase();
      flattened = flattened.filter((review) => {
        const haystacks = [
          review.productName,
          review.comment,
          review.title,
          review.user?.name,
          review.user?.email,
        ];
        return haystacks.some((value) => String(value || '').toLowerCase().includes(needle));
      });
    }

    flattened.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const total = flattened.length;
    const skip = (pageNumber - 1) * limitNumber;
    const reviews = flattened.slice(skip, skip + limitNumber);

    res.json({
      reviews,
      pagination: {
        page: pageNumber,
        limit: limitNumber,
        total,
        pages: Math.ceil(total / limitNumber),
      },
    });
  } catch (error) {
    console.error('Get admin reviews error:', error);
    return handleDbError(res, error);
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
    res.json(applyPricingToResponse(prodObj));
  } catch (error) {
    console.error('Get product error:', error);
    return handleDbError(res, error);
  }
});

// @route   POST /api/products
// @desc    Create a new product
// @access  Private/Admin
router.post('/', adminAuth, upload.array('images', MAX_PRODUCT_IMAGES), async (req, res) => {
  try {
    if (Array.isArray(req.files) && req.files.length > 0 && !cloudinaryEnabled) {
      return res.status(503).json({ message: 'Product image upload is unavailable: Cloudinary is not configured.' });
    }

    const productData = JSON.parse(req.body.data || '{}');
    const pricing = calculatePricing(productData.price, productData.originalPrice);
    if (!pricing) {
      return res.status(400).json({ message: 'Please enter a valid offer price' });
    }
    productData.price = pricing.price;
    productData.originalPrice = pricing.originalPrice;
    productData.discount = pricing.discount;
    
    // Add image paths (Cloudinary only)
    if (req.files && req.files.length > 0) {
      const uploadPromises = req.files.map((file) => uploadBufferToCloudinary(file.buffer));
      const uploads = await Promise.all(uploadPromises);
      productData.images = uploads; // array of { url, public_id }
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
    return handleDbError(res, error);
  }
});

// @route   PUT /api/products/:id
// @desc    Update a product
// @access  Private/Admin
router.put('/:id', adminAuth, upload.array('images', MAX_PRODUCT_IMAGES), async (req, res) => {
  try {
    if (Array.isArray(req.files) && req.files.length > 0 && !cloudinaryEnabled) {
      return res.status(503).json({ message: 'Product image upload is unavailable: Cloudinary is not configured.' });
    }

    const productData = JSON.parse(req.body.data || '{}');
    const existingProduct = await Product.findById(req.params.id);
    if (!existingProduct) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const hasPriceField = Object.prototype.hasOwnProperty.call(productData, 'price');
    const hasOriginalPriceField = Object.prototype.hasOwnProperty.call(productData, 'originalPrice');
    const pricing = calculatePricing(
      hasPriceField ? productData.price : existingProduct.price,
      hasOriginalPriceField ? productData.originalPrice : existingProduct.originalPrice
    );

    if (!pricing) {
      return res.status(400).json({ message: 'Please enter a valid offer price' });
    }
    productData.price = pricing.price;
    productData.originalPrice = pricing.originalPrice;
    productData.discount = pricing.discount;
    
    // Add new image paths if uploaded
    if (req.files && req.files.length > 0) {
      const uploadPromises = req.files.map((file) => uploadBufferToCloudinary(file.buffer));
      const newUploads = await Promise.all(uploadPromises);

      // Normalize keepImages: allow array of URLs or objects
      const keep = normalizeIncomingImages(productData.keepImages);

      if (keep.length > 0) {
        productData.images = [...keep, ...newUploads];
      } else {
        productData.images = newUploads;
      }
    } else if (Array.isArray(productData.keepImages)) {
      productData.images = normalizeIncomingImages(productData.keepImages);
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
    return handleDbError(res, error);
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
    return handleDbError(res, error);
  }
});

// @route   POST /api/products/:id/review
// @desc    Add a review to product
// @access  Private
router.post('/:id/review', auth, async (req, res) => {
  try {
    const { rating, comment, title } = req.body;
    const numericRating = Number(rating);
    const safeComment = String(comment || '').trim();
    const safeTitle = String(title || '').trim();

    if (!Number.isFinite(numericRating) || numericRating < 1 || numericRating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }
    if (!safeComment) {
      return res.status(400).json({ message: 'Review comment is required' });
    }

    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const hasPurchased = await Order.exists({
      user: req.user.id,
      orderStatus: { $nin: ['cancelled', 'returned'] },
      'orderItems.product': product._id,
    });

    // Update existing review if present, otherwise add new one.
    const existingReview = product.reviews.find(
      (r) => r.user.toString() === req.user.id
    );

    if (existingReview) {
      existingReview.rating = numericRating;
      existingReview.comment = safeComment;
      existingReview.title = safeTitle;
      existingReview.verifiedPurchase = Boolean(hasPurchased);
      existingReview.updatedAt = new Date();
    } else {
      product.reviews.push({
        user: req.user.id,
        title: safeTitle,
        rating: numericRating,
        comment: safeComment,
        verifiedPurchase: Boolean(hasPurchased),
      });
    }

    recalculateRatings(product);

    await product.save();
    await product.populate('reviews.user', 'name');

    res.status(200).json({
      message: existingReview ? 'Review updated successfully' : 'Review added successfully',
      reviews: product.reviews,
      ratings: product.ratings,
    });
  } catch (error) {
    console.error('Add review error:', error);
    return handleDbError(res, error);
  }
});

// @route   DELETE /api/products/:id/review/:reviewId
// @desc    Delete a review from product (Admin)
// @access  Private/Admin
router.delete('/:id/review/:reviewId', adminAuth, async (req, res) => {
  try {
    const { id, reviewId } = req.params;
    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const review = product.reviews.id(reviewId);
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    review.deleteOne();
    recalculateRatings(product);
    await product.save();

    res.json({ message: 'Review deleted successfully', ratings: product.ratings });
  } catch (error) {
    console.error('Delete review error:', error);
    return handleDbError(res, error);
  }
});

module.exports = router;

