const express = require('express');
const router = express.Router();
const Category = require('../models/Category');

// Get all categories for user menu
router.get('/', async (req, res) => {
  try {
    const categories = await Category.find().sort({ order: 1 });
    res.json(categories);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
