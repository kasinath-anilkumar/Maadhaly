const express = require('express');
const router = express.Router();
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');
const Category = require('../models/Category');
const { auth, adminAuth } = require('../middleware/auth');

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
} else {
  console.warn('Cloudinary is not configured. Category image uploads are disabled until CLOUDINARY_* env vars are set.');
}

const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Helper to upload buffer to Cloudinary
const uploadBufferToCloudinary = (buffer, folder = 'saree-store/categories') => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream({ folder }, (error, result) => {
      if (error) return reject(error);
      resolve({ url: result.secure_url, public_id: result.public_id });
    });
    streamifier.createReadStream(buffer).pipe(uploadStream);
  });
};

const toSlug = (value = '') =>
  String(value)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

// Helper to build full image URL
const buildImageUrl = (imagePath, req) => {
  if (!imagePath) return null;
  if (typeof imagePath === 'object' && imagePath.url) {
    imagePath = imagePath.url;
  }
  const rawPath = String(imagePath).trim();
  if (!rawPath) return null;
  const normalizedPath = rawPath.replace(/\\/g, '/');
  if (normalizedPath.startsWith('http')) return normalizedPath; // Already a full URL
  // Prepend server origin to relative paths
  const protocol = req.protocol || 'http';
  const host = req.get('host');
  const pathWithSlash = normalizedPath.startsWith('/') ? normalizedPath : `/${normalizedPath}`;
  return `${protocol}://${host}${pathWithSlash}`;
};

const handleDbError = (res, error) => {
  if (error?.name === 'CastError') {
    return res.status(400).json({ message: 'Invalid category id' });
  }
  if (error?.name === 'ValidationError') {
    return res.status(400).json({ message: error.message });
  }
  if (error?.code === 11000) {
    return res.status(409).json({ message: 'Category name or slug already exists' });
  }
  return res.status(500).json({ message: 'Server error', error: error?.message });
};

// @route   GET /api/categories
// @desc    Get all categories
// @access  Public
router.get('/', async (req, res) => {
  try {
    const categories = await Category.find()
      .sort({ order: 1 })
      .populate('parent', 'name slug');
    
    // Build full image URLs
    const categoriesWithImages = categories.map((cat) => {
      const obj = cat.toObject ? cat.toObject() : cat;
      if (obj.image) {
        obj.image = buildImageUrl(obj.image, req);
      }
      return obj;
    });
    
    res.json(categoriesWithImages);
  } catch (error) {
    console.error('Get categories error:', error);
    return handleDbError(res, error);
  }
});

// @route   GET /api/categories/:id
// @desc    Get single category
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const category = await Category.findById(req.params.id).populate('parent', 'name slug');
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }
    
    // Build full image URL
    const obj = category.toObject ? category.toObject() : category;
    if (obj.image) {
      obj.image = buildImageUrl(obj.image, req);
    }
    
    res.json(obj);
  } catch (error) {
    console.error('Get category error:', error);
    return handleDbError(res, error);
  }
});

// @route   POST /api/categories
// @desc    Create a new category
// @access  Private/Admin
router.post('/', adminAuth, upload.single('image'), async (req, res) => {
  try {
    if (req.file && !cloudinaryEnabled) {
      return res.status(503).json({ message: 'Category image upload is unavailable: Cloudinary is not configured.' });
    }

    const { name, description, slug, parent, order, isActive } = req.body;
    const trimmedName = String(name || '').trim();
    if (!trimmedName) {
      return res.status(400).json({ message: 'Category name is required' });
    }

    const finalSlug = toSlug(slug || trimmedName);
    if (!finalSlug) {
      return res.status(400).json({ message: 'Invalid category slug' });
    }

    const duplicate = await Category.findOne({
      $or: [{ name: trimmedName }, { slug: finalSlug }]
    });
    if (duplicate) {
      return res.status(409).json({ message: 'Category name or slug already exists' });
    }

    const categoryData = {
      name: trimmedName,
      description,
      slug: finalSlug,
      parent: parent || null,
      order: Number(order) || 0,
      isActive: isActive === 'true' || isActive === true // Handle both string and boolean
    };

    if (req.file) {
      const uploadResult = await uploadBufferToCloudinary(req.file.buffer);
      categoryData.image = uploadResult.url;
    }

    const category = await Category.create(categoryData);
    
    // Build full image URL in response
    const obj = category.toObject ? category.toObject() : category;
    if (obj.image) {
      obj.image = buildImageUrl(obj.image, req);
    }
    
    res.status(201).json({
      message: 'Category created successfully',
      category: obj
    });
  } catch (error) {
    console.error('Create category error:', error);
    return handleDbError(res, error);
  }
});

// @route   PUT /api/categories/:id
// @desc    Update a category
// @access  Private/Admin
router.put('/:id', adminAuth, upload.single('image'), async (req, res) => {
  try {
    if (req.file && !cloudinaryEnabled) {
      return res.status(503).json({ message: 'Category image upload is unavailable: Cloudinary is not configured.' });
    }

    const { name, description, slug, parent, order, isActive } = req.body;
    const trimmedName = String(name || '').trim();
    if (!trimmedName) {
      return res.status(400).json({ message: 'Category name is required' });
    }
    const finalSlug = toSlug(slug || trimmedName);
    if (!finalSlug) {
      return res.status(400).json({ message: 'Invalid category slug' });
    }
    
    // First, get the existing category to preserve image if not updating it
    const existingCategory = await Category.findById(req.params.id);
    if (!existingCategory) {
      return res.status(404).json({ message: 'Category not found' });
    }

    const duplicate = await Category.findOne({
      _id: { $ne: req.params.id },
      $or: [{ name: trimmedName }, { slug: finalSlug }]
    });
    if (duplicate) {
      return res.status(409).json({ message: 'Category name or slug already exists' });
    }
    
    const categoryData = {
      name: trimmedName,
      description,
      slug: finalSlug,
      parent: parent || null,
      order: Number(order),
      isActive: isActive === 'true' || isActive === true // Convert string/boolean to boolean
    };

    // Only update image if a new one is provided
    if (req.file) {
      const uploadResult = await uploadBufferToCloudinary(req.file.buffer);
      categoryData.image = uploadResult.url;
    } else {
      // Preserve existing image
      categoryData.image = existingCategory.image;
    }

    const category = await Category.findByIdAndUpdate(
      req.params.id,
      categoryData,
      { new: true }
    );

    // Build full image URL in response
    const obj = category.toObject ? category.toObject() : category;
    if (obj.image) {
      obj.image = buildImageUrl(obj.image, req);
    }

    res.json({
      message: 'Category updated successfully',
      category: obj
    });
  } catch (error) {
    console.error('Update category error:', error);
    return handleDbError(res, error);
  }
});

// @route   DELETE /api/categories/:id
// @desc    Delete a category (permanent delete)
// @access  Private/Admin
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    const category = await Category.findByIdAndDelete(req.params.id);

    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Delete category error:', error);
    return handleDbError(res, error);
  }
});

module.exports = router;
