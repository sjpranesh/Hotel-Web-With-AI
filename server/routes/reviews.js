const express = require('express');
const router = express.Router();
const Review = require('../models/Review');
const authMiddleware = require('../middleware/auth');
const { getIo } = require('../socket');

// Submit a new review
router.post('/', async (req, res) => {
  try {
    const review = new Review(req.body);
    await review.save();
    
    const io = getIo();
    io.to('admin').emit('new_review', review);
    
    res.status(201).json(review);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Admin get all reviews
router.get('/', authMiddleware(['admin']), async (req, res) => {
  try {
    const reviews = await Review.find().sort({ createdAt: -1 });
    res.json(reviews);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Admin delete review
router.delete('/:id', authMiddleware(['admin']), async (req, res) => {
  try {
    await Review.findByIdAndDelete(req.params.id);
    res.json({ message: 'Review deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
