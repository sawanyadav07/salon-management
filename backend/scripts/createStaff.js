const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const { sequelize, Staff } = require('../models');

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
    role: 'Skin & Nail Specialist',
    specialties: ['Facials', 'Manicure', 'Pedicure'],
    salary: 18000,
    workingDays: ['Monday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    workingHours: { start: '09:00', end: '17:00' }
  }
];

const [nameArg, phoneArg, roleArg, emailArg] = process.argv.slice(2);
const hasCliArgs = Boolean(nameArg || phoneArg || roleArg || emailArg);

const run = async () => {
  try {
    await sequelize.authenticate();
    await sequelize.sync();

    if (hasCliArgs) {
      if (!nameArg || !phoneArg || !roleArg) {
        console.error('Usage: node scripts/createStaff.js "<name>" "<phone>" "<role>" [email]');
        process.exit(1);
      }

      const exists = await Staff.findOne({ where: { phone: String(phoneArg).trim() } });
      if (exists) {
        console.log(`Staff already exists with phone ${phoneArg}: ${exists.name}`);
        process.exit(0);
      }

      const created = await Staff.create({
        name: String(nameArg).trim(),
        phone: String(phoneArg).trim(),
        role: String(roleArg).trim(),
        email: emailArg ? String(emailArg).trim().toLowerCase() : null
      });

      console.log(`Staff created: ${created.name} (${created.phone})`);
      process.exit(0);
    }

    const currentCount = await Staff.count();
    if (currentCount > 0) {
      console.log(`Staff table already has ${currentCount} record(s). No default rows added.`);
      process.exit(0);
    }

    await Staff.bulkCreate(defaultStaff);
    console.log(`Default staff created: ${defaultStaff.length}`);
    process.exit(0);
  } catch (err) {
    console.error('Failed to create staff:', err.message);
    process.exit(1);
  }
};

run();
