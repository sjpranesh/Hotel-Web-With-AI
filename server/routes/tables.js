const express = require('express');
const router = express.Router();
const QRCode = require('qrcode');

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

module.exports = router;
