const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const Category = require('../models/Category');
const { auth, adminAuth } = require('../middleware/auth');

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/categories/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'category-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Helper to build full image URL
const buildImageUrl = (imagePath, req) => {
  if (!imagePath) return null;
  if (imagePath.startsWith('http')) return imagePath; // Already a full URL
  // Prepend server origin to relative paths
  const protocol = req.protocol || 'http';
  const host = req.get('host');
  return `${protocol}://${host}${imagePath}`;
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
    res.status(500).json({ message: 'Server error', error: error.message });
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
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/categories
// @desc    Create a new category
// @access  Private/Admin
router.post('/', adminAuth, upload.single('image'), async (req, res) => {
  try {
    const { name, description, slug, parent, order, isActive } = req.body;
    
    const categoryData = {
      name,
      description,
      slug: slug || name.toLowerCase().replace(/\s+/g, '-'),
      parent: parent || null,
      order: Number(order) || 0,
      isActive: isActive === 'true' || isActive === true // Handle both string and boolean
    };

    if (req.file) {
      categoryData.image = `/uploads/categories/${req.file.filename}`;
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
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   PUT /api/categories/:id
// @desc    Update a category
// @access  Private/Admin
router.put('/:id', adminAuth, upload.single('image'), async (req, res) => {
  try {
    const { name, description, slug, parent, order, isActive } = req.body;
    
    // First, get the existing category to preserve image if not updating it
    const existingCategory = await Category.findById(req.params.id);
    if (!existingCategory) {
      return res.status(404).json({ message: 'Category not found' });
    }
    
    const categoryData = {
      name,
      description,
      slug,
      parent: parent || null,
      order: Number(order),
      isActive: isActive === 'true' // Convert string to boolean
    };

    // Only update image if a new one is provided
    if (req.file) {
      categoryData.image = `/uploads/categories/${req.file.filename}`;
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
    res.status(500).json({ message: 'Server error', error: error.message });
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
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
