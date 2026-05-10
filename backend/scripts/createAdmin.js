const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const { sequelize, User } = require('../models');

const email = String(process.argv[2] || process.env.ADMIN_EMAIL || '').trim().toLowerCase();
const password = String(process.argv[3] || process.env.ADMIN_PASSWORD || '');
const name = String(process.argv[4] || process.env.ADMIN_NAME || 'Admin').trim();

const usage = 'Usage: node scripts/createAdmin.js <email> <password> [name]';

const run = async () => {
  if (!email || !password) {
    console.error(usage);
    process.exit(1);
  }

  try {
    await sequelize.authenticate();
    await sequelize.sync();

    const existing = await User.findOne({ where: { email } });
    if (existing) {
      existing.name = name || existing.name;
      existing.role = 'admin';
      existing.password = password;
      await existing.save();
      console.log(`Admin updated: ${existing.email}`);
    } else {
      const created = await User.create({
        name: name || 'Admin',
        email,
        password,
        role: 'admin'
      });
      console.log(`Admin created: ${created.email}`);
    }

    process.exit(0);
  } catch (err) {
    console.error('Failed to create/update admin:', err.message);
    process.exit(1);
  }
};

run();
