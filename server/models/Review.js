const mongoose = require('mongoose');

const ReviewSchema = new mongoose.Schema({
  tableNumber: { type: Number },
  sessionId: { type: String },
  foodQuality: { type: Number, min: 1, max: 5 },
  taste: { type: Number, min: 1, max: 5 },
  service: { type: Number, min: 1, max: 5 },
  cleanliness: { type: Number, min: 1, max: 5 },
  ambience: { type: Number, min: 1, max: 5 },
  overall: { type: Number, min: 1, max: 5, required: true },
  comment: { type: String },
  imageUrl: { type: String },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Review', ReviewSchema);
