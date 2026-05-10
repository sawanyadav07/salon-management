const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const { sequelize, User, Staff, Service } = require('../models');

const defaultAdmin = {
  email: String(process.env.ADMIN_EMAIL || 'admin@salon.com').trim().toLowerCase(),
  password: String(process.env.ADMIN_PASSWORD || 'admin123'),
  name: String(process.env.ADMIN_NAME || 'Salon Admin').trim()
};

const defaultStaff = [
  {
    name: 'Priya Verma',
    phone: '9876543210',
    email: 'priya@salon.com',
    role: 'Senior Hair Stylist',
    specialties: ['Balayage', 'Keratin', 'Hair Coloring'],
    salary: 25000,
    workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    workingHours: { start: '09:00', end: '18:00' }
  },
  {
    name: 'Riya Kapoor',
    phone: '9876543211',
    role: 'Makeup Artist',
    specialties: ['Bridal Makeup', 'Party Makeup'],
    salary: 22000,
    workingDays: ['Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    workingHours: { start: '10:00', end: '19:00' }
  },
  {
    name: 'Sunita Sharma',
    phone: '9876543212',
    role: 'Skin and Nail Specialist',
    specialties: ['Facials', 'Manicure', 'Pedicure'],
    salary: 18000,
    workingDays: ['Monday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    workingHours: { start: '09:00', end: '17:00' }
  }
];

const defaultServices = [
  { name: 'Haircut (Women)', category: 'hair', price: 400, duration: 45, description: 'Trim, shape and style' },
  { name: 'Haircut (Men)', category: 'hair', price: 200, duration: 30, description: 'Classic cut and style' },
  { name: 'Hair Coloring', category: 'hair', price: 1500, duration: 120, description: 'Full hair color treatment' },
  { name: 'Balayage', category: 'hair', price: 3000, duration: 180, description: 'Natural-looking highlights' },
  { name: 'Keratin Treatment', category: 'hair', price: 4000, duration: 180, description: 'Smoothing and frizz control' },
  { name: 'Facial (Basic)', category: 'skin', price: 600, duration: 60, description: 'Cleansing and moisturizing' },
  { name: 'Facial (Premium)', category: 'skin', price: 1200, duration: 90, description: 'Deep cleanse and mask' },
  { name: 'Manicure', category: 'nails', price: 350, duration: 45, description: 'Nail shaping and polish' },
  { name: 'Pedicure', category: 'nails', price: 450, duration: 60, description: 'Full foot care and polish' },
  { name: 'Bridal Makeup', category: 'makeup', price: 8000, duration: 180, description: 'Complete bridal look' },
  { name: 'Party Makeup', category: 'makeup', price: 2500, duration: 90, description: 'Event-ready makeup' },
  { name: 'Body Massage', category: 'spa', price: 1800, duration: 90, description: 'Relaxing full body massage' }
];

const upsertAdmin = async () => {
  const existing = await User.findOne({ where: { email: defaultAdmin.email } });
  if (existing) {
    existing.name = defaultAdmin.name || existing.name;
    existing.role = 'admin';
    existing.password = defaultAdmin.password;
    await existing.save();
    return 'updated';
  }

  await User.create({
    name: defaultAdmin.name || 'Salon Admin',
    email: defaultAdmin.email,
    password: defaultAdmin.password,
    role: 'admin'
  });
  return 'created';
};

const upsertStaff = async () => {
  let created = 0;
  let updated = 0;

  for (const row of defaultStaff) {
    const existing = await Staff.findOne({ where: { phone: row.phone } });
    if (existing) {
      await existing.update({ ...row, isActive: true });
      updated += 1;
    } else {
      await Staff.create({ ...row, isActive: true });
      created += 1;
    }
  }

  return { created, updated };
};

const upsertServices = async () => {
  let created = 0;
  let updated = 0;

  for (const row of defaultServices) {
    const existing = await Service.findOne({ where: { name: row.name } });
    if (existing) {
      await existing.update({ ...row, isActive: true });
      updated += 1;
    } else {
      await Service.create({ ...row, isActive: true });
      created += 1;
    }
  }

  return { created, updated };
};

const run = async () => {
  try {
    await sequelize.authenticate();
    await sequelize.sync();

    const adminAction = await upsertAdmin();
    const staffResult = await upsertStaff();
    const serviceResult = await upsertServices();

    console.log(`Admin ${adminAction}: ${defaultAdmin.email}`);
    console.log(`Staff seeded. Created: ${staffResult.created}, Updated: ${staffResult.updated}`);
    console.log(`Services seeded. Created: ${serviceResult.created}, Updated: ${serviceResult.updated}`);
    process.exit(0);
  } catch (err) {
    console.error('Production seed failed:', err.message);
    process.exit(1);
  }
};

run();
