const express = require('express');
const router = express.Router();
const MenuItem = require('../models/MenuItem');

// Get all available items for customer
router.get('/', async (req, res) => {
  try {
    const items = await MenuItem.find({ isAvailable: true });
    res.json(items);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Admin routes for menu are in admin.js

module.exports = router;
