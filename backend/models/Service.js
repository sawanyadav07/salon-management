const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
  name:        { type: String, required: true },
  category:    { type: String, enum: ['hair', 'skin', 'nails', 'makeup', 'spa', 'other'], required: true },
  price:       { type: Number, required: true },
  duration:    { type: Number, required: true }, // in minutes
  description: { type: String },
  isActive:    { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Service', serviceSchema);
