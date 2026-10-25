module.exports = (sequelize, DataTypes) => sequelize.define('InventoryItem', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  name: { type: DataTypes.STRING(120), allowNull: false },
  category: { type: DataTypes.STRING(80), allowNull: false, defaultValue: 'General' },
  quantity: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0, validate: { min: 0 } },
  lowStockThreshold: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 5, validate: { min: 0 } },
  unit: { type: DataTypes.STRING(30), allowNull: false, defaultValue: 'units' },
  notes: { type: DataTypes.STRING(500), allowNull: true },
  isDeleted: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  deletedAt: { type: DataTypes.DATE, allowNull: true }
}, { tableName: 'inventory_items', timestamps: true });
