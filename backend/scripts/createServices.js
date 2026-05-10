const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const { sequelize, Service } = require('../models');

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

const [nameArg, categoryArg, priceArg, durationArg, descriptionArg] = process.argv.slice(2);
const hasCliArgs = Boolean(nameArg || categoryArg || priceArg || durationArg || descriptionArg);

const upsertServiceByName = async (payload) => {
  const name = String(payload.name || '').trim();
  if (!name) return { action: 'skipped', name: '' };

  const existing = await Service.findOne({ where: { name } });
  if (existing) {
    await existing.update({
      category: payload.category,
      price: payload.price,
      duration: payload.duration,
      description: payload.description || existing.description,
      isActive: true
    });
    return { action: 'updated', name };
  }

  await Service.create({
    name,
    category: payload.category,
    price: payload.price,
    duration: payload.duration,
    description: payload.description || null,
    isActive: true
  });
  return { action: 'created', name };
};

const run = async () => {
  try {
    await sequelize.authenticate();
    await sequelize.sync();

    if (hasCliArgs) {
      if (!nameArg || !categoryArg || !priceArg || !durationArg) {
        console.error('Usage: node scripts/createServices.js "<name>" "<category>" <price> <durationMinutes> [description]');
        process.exit(1);
      }

      const result = await upsertServiceByName({
        name: nameArg,
        category: String(categoryArg).trim().toLowerCase(),
        price: Number(priceArg),
        duration: Number(durationArg),
        description: descriptionArg ? String(descriptionArg).trim() : null
      });
      console.log(`Service ${result.action}: ${result.name}`);
      process.exit(0);
    }

    let created = 0;
    let updated = 0;

    for (const service of defaultServices) {
      const result = await upsertServiceByName(service);
      if (result.action === 'created') created += 1;
      if (result.action === 'updated') updated += 1;
    }

    console.log(`Services seeded. Created: ${created}, Updated: ${updated}`);
    process.exit(0);
  } catch (err) {
    console.error('Failed to seed services:', err.message);
    process.exit(1);
  }
};

run();
