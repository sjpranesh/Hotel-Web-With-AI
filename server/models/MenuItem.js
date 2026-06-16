const mongoose = require('mongoose');

const MenuItemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  category: { type: String, required: true },
  categoryType: { type: String, enum: ['DRINK', 'FAST', 'MAIN'], default: 'MAIN' },
  imageUrl: { type: String, required: true },
  isAvailable: { type: Boolean, default: true },
  preparationTime: { type: Number, default: 10 } // in minutes, for smart queue
}, { timestamps: true });

module.exports = mongoose.model('MenuItem', MenuItemSchema);
