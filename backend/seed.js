const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User     = require('./models/User');
const Customer = require('./models/Customer');
const Service  = require('./models/Service');
const Staff    = require('./models/Staff');

mongoose.connect(process.env.MONGO_URI).then(async () => {
  console.log('Connected to MongoDB...');

  // Clear existing
  await Promise.all([User.deleteMany(), Customer.deleteMany(), Service.deleteMany(), Staff.deleteMany()]);

  // Admin user
  await User.create({ name: 'Admin', email: 'admin@salon.com', password: 'admin123', role: 'admin' });
  console.log('✅ Admin user created: admin@salon.com / admin123');

  // Services
  await Service.insertMany([
    { name: 'Haircut (Women)', category: 'hair', price: 400, duration: 45, description: 'Trim, shape & style' },
    { name: 'Haircut (Men)', category: 'hair', price: 200, duration: 30, description: 'Classic cut & style' },
    { name: 'Hair Coloring', category: 'hair', price: 1500, duration: 120, description: 'Full hair color treatment' },
    { name: 'Balayage', category: 'hair', price: 3000, duration: 180, description: 'Natural-looking highlights' },
    { name: 'Keratin Treatment', category: 'hair', price: 4000, duration: 180, description: 'Smoothing & frizz control' },
    { name: 'Facial (Basic)', category: 'skin', price: 600, duration: 60, description: 'Cleansing & moisturizing' },
    { name: 'Facial (Premium)', category: 'skin', price: 1200, duration: 90, description: 'Deep cleanse + mask' },
    { name: 'Manicure', category: 'nails', price: 350, duration: 45, description: 'Nail shaping & polish' },
    { name: 'Pedicure', category: 'nails', price: 450, duration: 60, description: 'Full foot care & polish' },
    { name: 'Bridal Makeup', category: 'makeup', price: 8000, duration: 180, description: 'Complete bridal look' },
    { name: 'Party Makeup', category: 'makeup', price: 2500, duration: 90, description: 'Event-ready makeup' },
    { name: 'Body Massage', category: 'spa', price: 1800, duration: 90, description: 'Relaxing full body massage' },
  ]);
  console.log('✅ 12 services added');

  // Staff
  await Staff.insertMany([
    { name: 'Priya Verma', phone: '9876543210', email: 'priya@salon.com', role: 'Senior Hair Stylist', specialties: ['Balayage', 'Keratin', 'Hair Coloring'], salary: 25000, workingDays: ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'], workingHours: { start: '09:00', end: '18:00' } },
    { name: 'Riya Kapoor', phone: '9876543211', role: 'Makeup Artist', specialties: ['Bridal Makeup', 'Party Makeup'], salary: 22000, workingDays: ['Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'], workingHours: { start: '10:00', end: '19:00' } },
    { name: 'Sunita Sharma', phone: '9876543212', role: 'Skin & Nail Specialist', specialties: ['Facials', 'Manicure', 'Pedicure'], salary: 18000, workingDays: ['Monday','Wednesday','Thursday','Friday','Saturday'], workingHours: { start: '09:00', end: '17:00' } },
  ]);
  console.log('✅ 3 staff members added');

  // Customers
  await Customer.insertMany([
    { name: 'Anjali Singh', phone: '9000000001', email: 'anjali@email.com', gender: 'female', totalVisits: 5, totalSpent: 7500 },
    { name: 'Meera Patel', phone: '9000000002', email: 'meera@email.com', gender: 'female', totalVisits: 2, totalSpent: 3200 },
    { name: 'Rahul Kumar', phone: '9000000003', gender: 'male', totalVisits: 8, totalSpent: 2400 },
    { name: 'Kavya Reddy', phone: '9000000004', gender: 'female', totalVisits: 1, totalSpent: 1500 },
  ]);
  console.log('✅ 4 customers added');

  console.log('\n🎉 Seed complete! Login with: admin@salon.com / admin123');
  process.exit(0);
}).catch(err => { console.error(err); process.exit(1); });
