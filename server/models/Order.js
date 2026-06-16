const mongoose = require('mongoose');

const OrderItemSchema = new mongoose.Schema({
  menuItem: { type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem', required: true },
  name: { type: String, required: true },
  quantity: { type: Number, required: true, min: 1 },
  price: { type: Number, required: true },
});

const OrderSchema = new mongoose.Schema({
  orderId: { type: String, required: true, unique: true },
  tableNumber: { type: Number, required: true },
  items: [OrderItemSchema],
  totalAmount: { type: Number, required: true },
  paymentStatus: { type: String, enum: ['Pending', 'Paid', 'Failed', 'PendingSettlement'], default: 'Pending' },
  paymentMethod: { type: String, enum: ['UPI', 'Card', 'Cash', 'Mock'], default: 'Mock' },
  orderStatus: { type: String, enum: ['Paid', 'Preparing', 'Ready', 'Delivered'], default: 'Paid' },
  tokenNumber: { type: String },
  sessionId: { type: String },
  predictedTime: { type: Number, default: 0 }, // in minutes
  priorityScore: { type: Number, default: 0 }, // For smart queue
  startedAt: { type: Date },
  completedAt: { type: Date },
  deliveredAt: { type: Date },
}, { timestamps: true });

module.exports = mongoose.model('Order', OrderSchema);
