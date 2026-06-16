const mongoose = require('mongoose');

const TableSessionSchema = new mongoose.Schema({
  sessionId: { type: String, required: true, unique: true },
  tableNumber: { type: Number, required: true },
  paymentMode: { type: String, enum: ['Cash', 'Online'], default: 'Cash' },
  orders: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Order' }],
  runningTotal: { type: Number, default: 0 },
  sessionStatus: { type: String, enum: ['Active', 'Closed'], default: 'Active' },
  settlementStatus: { type: String, enum: ['Pending', 'Paid'], default: 'Pending' },
  billRequested: { type: Boolean, default: false },
  startedAt: { type: Date, default: Date.now },
  closedAt: { type: Date },
}, { timestamps: true });

module.exports = mongoose.model('TableSession', TableSessionSchema);
