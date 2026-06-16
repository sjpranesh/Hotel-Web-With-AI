const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const MenuItem = require('../models/MenuItem');
const Order = require('../models/Order');
const Category = require('../models/Category');

// All Admin routes require admin role by default
// But some allow kitchen staff
router.use(authMiddleware(['admin', 'kitchen']));

// Middleware to restrict some routes to admin ONLY
const adminOnly = authMiddleware(['admin']);


// Menu API
// Menu API
router.get('/menu', async (req, res) => {
  try {
    const items = await MenuItem.find();
    res.json(items);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/menu', adminOnly, async (req, res) => {


  try {
    const item = new MenuItem(req.body);
    await item.save();
    res.status(201).json(item);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.put('/menu/:id', async (req, res) => {
  try {
    const item = await MenuItem.findByIdAndUpdate(req.params.id, req.body, { new: true });
    req.io.emit('menu_updated', item);
    res.json(item);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Specific toggle for availability (for kitchen/admin)
router.patch('/menu/:id/toggle-availability', async (req, res) => {
  try {
    const item = await MenuItem.findById(req.params.id);
    if (!item) return res.status(404).json({ message: 'Item not found' });
    
    item.isAvailable = !item.isAvailable;
    await item.save();
    
    req.io.emit('menu_updated', item);
    res.json(item);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});


router.delete('/menu/:id', adminOnly, async (req, res) => {

  try {
    await MenuItem.findByIdAndDelete(req.params.id);
    res.json({ message: 'Item deleted' });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Category API
// Category API
router.post('/categories', adminOnly, async (req, res) => {

  try {
    const category = new Category(req.body);
    await category.save();
    res.status(201).json(category);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.put('/categories/:id', adminOnly, async (req, res) => {

  try {
    const category = await Category.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(category);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.delete('/categories/:id', adminOnly, async (req, res) => {

  try {
    await Category.findByIdAndDelete(req.params.id);
    res.json({ message: 'Category deleted' });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Analytics & Dashboard API
router.get('/analytics', async (req, res) => {
  try {
    const totalOrders = await Order.countDocuments();
    
    // Aggregation for total revenue
    const revenueStats = await Order.aggregate([
      { $match: { paymentStatus: 'Completed' } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);
    const totalRevenue = revenueStats[0]?.total || 0;

    // Highest selling items
    const popularItems = await Order.aggregate([
      { $unwind: '$items' },
      { $group: { _id: '$items.name', count: { $sum: '$items.quantity' } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);

    // Average preparation time logic
    const preparedOrders = await Order.find({ 
      startedAt: { $exists: true }, 
      completedAt: { $exists: true } 
    });
    
    let totalPrepTime = 0;
    let delayedCount = 0;
    const delayedOrders = [];

    preparedOrders.forEach(order => {
      const actualPrepTime = (new Date(order.completedAt) - new Date(order.startedAt)) / 60000;
      totalPrepTime += actualPrepTime;
      
      if (actualPrepTime > order.predictedTime) {
        delayedCount++;
        delayedOrders.push({
          orderId: order.orderId,
          predicted: order.predictedTime,
          actual: Math.round(actualPrepTime),
          delay: Math.round(actualPrepTime - order.predictedTime)
        });
      }
    });

    const avgPrepTime = preparedOrders.length > 0 ? (totalPrepTime / preparedOrders.length).toFixed(1) : 0;

    // Peak hours analysis
    const peakHours = await Order.aggregate([
      {
        $group: {
          _id: { $hour: "$createdAt" },
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);

    res.json({
      totalOrders,
      totalRevenue,
      popularItems,
      avgPrepTime,
      delayedCount,
      delayedOrders: delayedOrders.sort((a, b) => b.delay - a.delay).slice(0, 5),
      peakHours
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
