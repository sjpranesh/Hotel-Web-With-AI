const express = require('express');
const router = express.Router();
const Payment = require('../models/Payment');
const { v4: uuidv4 } = require('uuid');

// Mock Payment Flow
router.post('/process', async (req, res) => {
  try {
    const { orderId, amount, method } = req.body;

    // Simulate 1 second payment processing delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    const transactionId = `TXN-${uuidv4().slice(0, 8).toUpperCase()}`;

    // Record the mock payment
    const payment = new Payment({
      orderId, // Temp ID before actual order is created
      transactionId,
      amount,
      method: method || 'Mock',
      status: 'Success'
    });

    await payment.save();

    res.json({
      success: true,
      transactionId,
      message: 'Payment Successful'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
