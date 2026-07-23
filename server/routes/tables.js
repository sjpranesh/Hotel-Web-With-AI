const express = require('express');
const router = express.Router();
const QRCode = require('qrcode');
const WaiterRequest = require('../models/WaiterRequest');
const { getIo } = require('../socket');
const authMiddleware = require('../middleware/auth');

// Generate QR code for a table
router.get('/generate/:tableNumber', async (req, res) => {
  try {
    const { tableNumber } = req.params;
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const url = `${clientUrl}/menu?table=${tableNumber}`;
    
    const qrCodeImage = await QRCode.toDataURL(url);
    res.json({ tableNumber, qrCodeImage, url });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Request waiter assistance
router.post('/waiter-call', async (req, res) => {
  try {
    const { tableNumber, requestType, message } = req.body;
    const waiterRequest = new WaiterRequest({
      tableNumber,
      requestType,
      message
    });
    await waiterRequest.save();

    const io = getIo();
    io.to('kitchen').emit('waiter_called', waiterRequest);
    io.to('admin').emit('waiter_called', waiterRequest);

    res.status(201).json(waiterRequest);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get active waiter calls
router.get('/waiter-calls/active', authMiddleware(['admin', 'kitchen']), async (req, res) => {
  try {
    const requests = await WaiterRequest.find({ status: 'Pending' }).sort({ requestedAt: 1 });
    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update waiter call status
router.put('/waiter-call/:id/status', authMiddleware(['admin', 'kitchen']), async (req, res) => {
  try {
    const { status } = req.body;
    const request = await WaiterRequest.findByIdAndUpdate(
      req.params.id,
      { status, completedAt: status === 'Completed' ? new Date() : null },
      { new: true }
    );
    if (!request) return res.status(404).json({ message: 'Request not found' });
    
    const io = getIo();
    io.to('kitchen').emit('waiter_call_updated', request);
    io.to('admin').emit('waiter_call_updated', request);
    io.to(`table_${request.tableNumber}`).emit('waiter_call_completed', request);

    res.json(request);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
