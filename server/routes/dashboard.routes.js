const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const { adminAuth } = require('../middleware/auth');

// @route   GET /api/dashboard/stats
// @desc    Get dashboard statistics
// @access  Private/Admin
router.get('/stats', adminAuth, async (req, res) => {
  try {
    // Date ranges
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const thisMonthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    // Total stats
    const totalOrders = await Order.countDocuments();
    const totalProducts = await Product.countDocuments({ isActive: true });
    const totalUsers = await User.countDocuments({ role: 'customer' });
    
    // Revenue stats
    const revenueStats = await Order.aggregate([
      { $match: { 'paymentInfo.status': 'completed' } },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$totalPrice' },
          avgOrderValue: { $avg: '$totalPrice' }
        }
      }
    ]);

    // Today's orders
    const todayOrders = await Order.countDocuments({
      createdAt: { $gte: today }
    });

    // Today's revenue
    const todayRevenue = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: today },
          'paymentInfo.status': 'completed'
        }
      },
      { $group: { _id: null, total: { $sum: '$totalPrice' } } }
    ]);

    // This month revenue
    const thisMonthRevenue = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: thisMonth, $lte: thisMonthEnd },
          'paymentInfo.status': 'completed'
        }
      },
      { $group: { _id: null, total: { $sum: '$totalPrice' } } }
    ]);

    // Last month revenue
    const lastMonthRevenue = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: lastMonth, $lt: thisMonth },
          'paymentInfo.status': 'completed'
        }
      },
      { $group: { _id: null, total: { $sum: '$totalPrice' } } }
    ]);

    // Orders by status
    const ordersByStatus = await Order.aggregate([
      { $group: { _id: '$orderStatus', count: { $sum: 1 } } }
    ]);

    // Recent orders
    const recentOrders = await Order.find()
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .limit(5);

    // Low stock products
    const lowStockProducts = await Product.find({ stock: { $lt: 10 }, isActive: true })
      .sort({ stock: 1 })
      .limit(5);

    res.json({
      overview: {
        totalOrders,
        totalProducts,
        totalUsers,
        totalRevenue: revenueStats[0]?.totalRevenue || 0,
        avgOrderValue: Math.round(revenueStats[0]?.avgOrderValue || 0),
        todayOrders,
        todayRevenue: todayRevenue[0]?.total || 0,
        thisMonthRevenue: thisMonthRevenue[0]?.total || 0,
        lastMonthRevenue: lastMonthRevenue[0]?.total || 0
      },
      ordersByStatus: ordersByStatus.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      recentOrders,
      lowStockProducts
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/dashboard/sales-chart
// @desc    Get sales data for charts
// @access  Private/Admin
router.get('/sales-chart', adminAuth, async (req, res) => {
  try {
    const { period = 'monthly' } = req.query;
    
    let groupBy;
    let dateFormat;
    
    if (period === 'daily') {
      groupBy = { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } };
    } else if (period === 'weekly') {
      groupBy = { $week: '$createdAt' };
    } else {
      groupBy = { $dateToString: { format: '%Y-%m', date: '$createdAt' } };
    }

    const salesData = await Order.aggregate([
      { $match: { 'paymentInfo.status': 'completed' } },
      {
        $group: {
          _id: groupBy,
          sales: { $sum: '$totalPrice' },
          orders: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } },
      { $limit: 12 }
    ]);

    res.json(salesData);
  } catch (error) {
    console.error('Sales chart error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/dashboard/top-products
// @desc    Get top selling products
// @access  Private/Admin
router.get('/top-products', adminAuth, async (req, res) => {
  try {
    const topProducts = await Order.aggregate([
      { $match: { 'paymentInfo.status': 'completed' } },
      { $unwind: '$orderItems' },
      {
        $group: {
          _id: '$orderItems.product',
          totalSold: { $sum: '$orderItems.quantity' },
          revenue: { $sum: { $multiply: ['$orderItems.price', '$orderItems.quantity'] } }
        }
      },
      { $sort: { totalSold: -1 } },
      { $limit: 10 }
    ]);

    // Populate product details
    const populatedProducts = await Product.populate(topProducts, {
      path: '_id',
      select: 'name images price'
    });

    res.json(populatedProducts);
  } catch (error) {
    console.error('Top products error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
