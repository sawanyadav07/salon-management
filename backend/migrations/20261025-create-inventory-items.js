const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const tableName = 'inventory_items';

async function up() {
  const queryInterface = sequelize.getQueryInterface();
  const tables = await queryInterface.showAllTables();
  if (tables.some((table) => (typeof table === 'string' ? table : table.tableName).toLowerCase() === tableName)) {
    const existingColumns = await queryInterface.describeTable(tableName);
    if (!existingColumns.is_deleted) {
      await queryInterface.addColumn(tableName, 'is_deleted', { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false });
      console.log(`Added is_deleted to ${tableName}.`);
    }
    if (!existingColumns.deleted_at) {
      await queryInterface.addColumn(tableName, 'deleted_at', { type: DataTypes.DATE, allowNull: true });
      console.log(`Added deleted_at to ${tableName}.`);
    }
    console.log(`Table ${tableName} is ready.`);
    return;
  }

  await queryInterface.createTable(tableName, {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true, allowNull: false },
    name: { type: DataTypes.STRING(120), allowNull: false },
    category: { type: DataTypes.STRING(80), allowNull: false, defaultValue: 'General' },
    quantity: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    low_stock_threshold: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 5 },
    unit: { type: DataTypes.STRING(30), allowNull: false, defaultValue: 'units' },
    notes: { type: DataTypes.STRING(500), allowNull: true },
    created_at: { type: DataTypes.DATE, allowNull: false },
    updated_at: { type: DataTypes.DATE, allowNull: false },
    is_deleted: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    deleted_at: { type: DataTypes.DATE, allowNull: true }
  });
  console.log(`Created ${tableName}.`);
}

async function down() {
  await sequelize.getQueryInterface().dropTable(tableName);
  console.log(`Dropped ${tableName}.`);
}

if (require.main === module) {
  const direction = process.argv[2] || 'up';
  const operation = direction === 'up' ? up : direction === 'down' ? down : null;
  if (!operation) {
    console.error('Usage: node migrations/20261025-create-inventory-items.js [up|down]');
    process.exitCode = 1;
  } else {
    operation().catch((error) => { console.error(`Inventory migration ${direction} failed:`, error.message); process.exitCode = 1; })
      .finally(() => sequelize.close());
  }
}

module.exports = { up, down };
