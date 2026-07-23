const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const MenuItem = require('../models/MenuItem');
const { getIo } = require('../socket');
const authMiddleware = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');
const TableSession = require('../models/TableSession');

// Create new order (called after successful payment)
router.post('/', async (req, res) => {
  try {
    const { tableNumber, items, totalAmount, transactionId, paymentMethod } = req.body;

    // Calculate priority score (Smart Queue Logic)
    // Base score is timestamp. We subtract points for smaller/faster orders to boost priority slightly
    // but not so much that it overtakes very old orders.
    
    let totalPredictedTime = 0;
    const itemsWithPrep = await Promise.all(items.map(async (item) => {
      const menuDbItem = await MenuItem.findById(item.menuItem);
      
      let basePrepTime = 10; // Default
      if (menuDbItem) {
        if (menuDbItem.categoryType === 'DRINK') basePrepTime = 2;
        else if (menuDbItem.categoryType === 'FAST') basePrepTime = 5;
        else if (menuDbItem.categoryType === 'MAIN') basePrepTime = 10;
      }

      totalPredictedTime += basePrepTime * item.quantity;
      return item;
    }));

    const priorityScore = (totalPredictedTime * 0.6) + (0 * 0.4); // waitingTime is 0 at creation

    const token = Math.floor(1000 + Math.random() * 9000).toString(); // 4-digit token

    // Table Session Logic for Cash
    let activeSession = null;
    if (paymentMethod === 'Cash') {
      activeSession = await TableSession.findOne({ tableNumber, sessionStatus: 'Active' });
      if (!activeSession) {
        activeSession = new TableSession({
          sessionId: `SESS-${uuidv4().slice(0, 6).toUpperCase()}`,
          tableNumber,
          paymentMode: 'Cash'
        });
      }
    }

    const order = new Order({
      orderId: `ORD-${uuidv4().slice(0, 6).toUpperCase()}`,
      tableNumber,
      items,
      totalAmount,
      paymentMethod: paymentMethod || 'Mock',
      paymentStatus: paymentMethod === 'Cash' ? 'PendingSettlement' : 'Paid',
      orderStatus: 'Paid',
      tokenNumber: token,
      sessionId: activeSession ? activeSession.sessionId : null,
      predictedTime: totalPredictedTime,
      priorityScore
    });

    await order.save();

    if (activeSession) {
      activeSession.orders.push(order._id);
      activeSession.runningTotal += totalAmount;
      await activeSession.save();
    }

    // Alert Kitchen immediately
    const io = getIo();
    io.to('kitchen').emit('new_order', order);
    io.to(`table_${tableNumber}`).emit('order_confirmed', order);

    if (activeSession) {
      io.to(`table_${tableNumber}`).emit('session_updated', activeSession);
      io.to('admin').emit('session_updated', activeSession);
    }

    res.status(201).json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get active queue for kitchen (sorted by smart priority)
router.get('/kitchen/queue', authMiddleware(['kitchen', 'admin']), async (req, res) => {
  try {
    const activeOrders = await Order.find({ orderStatus: { $ne: 'Delivered' } });
    
    // Dynamically recalculate priorityScore based on current waitingTime
    const now = Date.now();
    const recalculatedOrders = activeOrders.map(order => {
      const waitingTime = (now - new Date(order.createdAt).getTime()) / 60000; // in minutes
      const priorityScore = (order.predictedTime * 0.6) + (waitingTime * 0.4);
      
      // Update the object for sorting (not necessarily in DB every time, but here)
      const orderObj = order.toObject();
      orderObj.waitingTime = waitingTime;
      orderObj.priorityScore = priorityScore;
      return orderObj;
    });

    // Sorting logic: priorityScore ASC, fallback to createdAt
    recalculatedOrders.sort((a, b) => {
      if (a.priorityScore !== b.priorityScore) {
        return a.priorityScore - b.priorityScore;
      }
      return new Date(a.createdAt) - new Date(b.createdAt);
    });
    
    res.json(recalculatedOrders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get specific order
router.get('/:id', async (req, res) => {
  try {
    const order = await Order.findOne({ orderId: req.params.id });
    if (!order) return res.status(404).json({ message: 'Order not found' });
    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update order status (Kitchen/Admin)
router.put('/:id/status', authMiddleware(['kitchen', 'admin']), async (req, res) => {
  try {
    const { status } = req.body;
    const updateData = { orderStatus: status };
    if (status === 'Preparing') {
      updateData.startedAt = new Date();
    }
    if (status === 'Ready' || status === 'Delivered') {
      updateData.completedAt = new Date();
    }
    if (status === 'Delivered') {
      const existingOrder = await Order.findOne({ orderId: req.params.id });
      // In Pay at End mode, we allow delivery before final payment.
      // But we check if it's an immediate cash payment (from previous requirement)
      if (existingOrder.paymentMethod === 'Cash' && existingOrder.paymentStatus === 'Pending') {
        return res.status(400).json({ message: 'Payment must be confirmed before delivery' });
      }
      updateData.deliveredAt = new Date();
    }

    const order = await Order.findOneAndUpdate(
      { orderId: req.params.id },
      updateData,
      { new: true }
    );

    if (!order) return res.status(404).json({ message: 'Order not found' });

    // Notify clients
    const io = getIo();
    io.to('kitchen').emit('order_updated', order);
    io.to(`table_${order.tableNumber}`).emit('order_status_changed', order);

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
// Get table history for today (Admin only)
router.get('/table-history/:tableNumber', authMiddleware(['admin']), async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const history = await Order.find({
      tableNumber: req.params.tableNumber,
      createdAt: { $gte: today }
    }).sort({ createdAt: -1 });

    res.json(history);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// --- New Table Session Routes ---

// Get active session for a table
router.get('/table-session/:tableNumber', async (req, res) => {
  try {
    const session = await TableSession.findOne({ 
      tableNumber: req.params.tableNumber, 
      sessionStatus: 'Active' 
    }).populate('orders');
    res.json(session);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Request final bill
router.post('/session/:sessionId/request-bill', async (req, res) => {
  try {
    const session = await TableSession.findOneAndUpdate(
      { sessionId: req.params.sessionId },
      { billRequested: true },
      { new: true }
    );
    if (!session) return res.status(404).json({ message: 'Session not found' });

    const io = getIo();
    io.to('admin').emit('bill_requested', session);
    io.to(`table_${session.tableNumber}`).emit('session_updated', session);

    res.json(session);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Confirm final payment (Admin)
router.post('/session/:sessionId/confirm-payment', authMiddleware(['admin']), async (req, res) => {
  try {
    const session = await TableSession.findOneAndUpdate(
      { sessionId: req.params.sessionId },
      { 
        sessionStatus: 'Closed', 
        settlementStatus: 'Paid',
        closedAt: new Date()
      },
      { new: true }
    );
    if (!session) return res.status(404).json({ message: 'Session not found' });

    // Mark all related orders as Paid
    await Order.updateMany(
      { sessionId: session.sessionId },
      { paymentStatus: 'Paid' }
    );

    const io = getIo();
    io.to('admin').emit('session_closed', session);
    io.to(`table_${session.tableNumber}`).emit('session_closed', session);
    // Notify kitchen to remove the "Running Bill" labels if needed
    io.to('kitchen').emit('session_closed', session);

    res.json(session);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all active sessions for admin
router.get('/admin/active-sessions', authMiddleware(['admin']), async (req, res) => {
  try {
    const sessions = await TableSession.find({ sessionStatus: 'Active' }).populate('orders');
    res.json(sessions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
