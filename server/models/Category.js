const mongoose = require('mongoose');

const CategorySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  imageUrl: { type: String, required: true },
  order: { type: Number, default: 0 } // For sorting
}, { timestamps: true });

module.exports = mongoose.model('Category', CategorySchema);
