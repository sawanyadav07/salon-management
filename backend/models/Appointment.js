const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  staff:    { type: mongoose.Schema.Types.ObjectId, ref: 'Staff', required: true },
  services: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Service' }],
  date:     { type: Date, required: true },
  timeSlot: { type: String, required: true }, // e.g. "10:30"
  status:   { type: String, enum: ['scheduled', 'confirmed', 'in-progress', 'completed', 'cancelled'], default: 'scheduled' },
  totalAmount: { type: Number, default: 0 },
  discount:    { type: Number, default: 0 },
  finalAmount: { type: Number, default: 0 },
  paymentStatus: { type: String, enum: ['pending', 'paid', 'partial'], default: 'pending' },
  paymentMethod: { type: String, enum: ['cash', 'card', 'upi', 'other'] },
  notes:    { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Appointment', appointmentSchema);
