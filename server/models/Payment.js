const mongoose = require('mongoose');

const PaymentSchema = new mongoose.Schema({
  orderId: { type: String, required: true },
  transactionId: { type: String, required: true, unique: true },
  amount: { type: Number, required: true },
  method: { type: String, enum: ['UPI', 'Card', 'Mock', 'Cash'], default: 'Mock' },
  status: { type: String, enum: ['Success', 'Failed'], required: true },
}, { timestamps: true });

module.exports = mongoose.model('Payment', PaymentSchema);
