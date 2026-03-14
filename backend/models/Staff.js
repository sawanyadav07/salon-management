const mongoose = require('mongoose');

const staffSchema = new mongoose.Schema({
  name:        { type: String, required: true },
  phone:       { type: String, required: true },
  email:       { type: String },
  role:        { type: String, required: true }, // e.g. Hair Stylist, Makeup Artist
  specialties: [{ type: String }],
  salary:      { type: Number },
  joinDate:    { type: Date, default: Date.now },
  isActive:    { type: Boolean, default: true },
  workingDays: [{
    type: String,
    enum: ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday']
  }],
  workingHours: {
    start: { type: String, default: '09:00' },
    end:   { type: String, default: '18:00' }
  }
}, { timestamps: true });

module.exports = mongoose.model('Staff', staffSchema);
