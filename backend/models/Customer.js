const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  name:    { type: String, required: true },
  phone:   { type: String, required: true, unique: true },
  email:   { type: String },
  gender:  { type: String, enum: ['male', 'female', 'other'] },
  dob:     { type: Date },
  address: { type: String },
  notes:   { type: String },
  totalVisits:  { type: Number, default: 0 },
  totalSpent:   { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('Customer', customerSchema);
