const mongoose = require('mongoose');

const WaiterRequestSchema = new mongoose.Schema({
  tableNumber: { type: Number, required: true },
  requestType: { type: String, required: true },
  message: { type: String },
  status: { type: String, enum: ['Pending', 'Completed'], default: 'Pending' },
  requestedAt: { type: Date, default: Date.now },
  completedAt: { type: Date }
});

module.exports = mongoose.model('WaiterRequest', WaiterRequestSchema);
