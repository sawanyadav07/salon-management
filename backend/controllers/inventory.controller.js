const { InventoryItem } = require('../models');
const { ApiError } = require('../errors/apiError');
const { pushNotification } = require('../config/notify');

const clean = (value) => ({
  name: String(value.name || '').trim(),
  category: String(value.category || 'General').trim(),
  quantity: Number(value.quantity),
  lowStockThreshold: Number(value.lowStockThreshold),
  unit: String(value.unit || 'units').trim(),
  notes: value.notes ? String(value.notes).trim() : null
});

const validate = (item) => {
  if (!item.name || item.name.length > 120) throw ApiError.badRequest('Name is required and must be under 120 characters.');
  if (!item.category || item.category.length > 80 || !item.unit || item.unit.length > 30) throw ApiError.badRequest('Category and unit are required.');
  if (!Number.isInteger(item.quantity) || item.quantity < 0 || !Number.isInteger(item.lowStockThreshold) || item.lowStockThreshold < 0) throw ApiError.badRequest('Quantity and low-stock threshold must be whole numbers of zero or more.');
};

const notifyCurrentLowStock = async () => {
  const lowItems = await InventoryItem.findAll({
    where: { isDeleted: false },
    order: [['quantity', 'ASC'], ['name', 'ASC']]
  });
  const items = lowItems.filter((item) => item.quantity <= item.lowStockThreshold);
  if (!items.length) return;
  const summary = items.slice(0, 5).map((item) => `${item.name}, ${item.quantity} ${item.unit} remaining`).join('; ');
  const extra = items.length > 5 ? `; and ${items.length - 5} more items` : '';
  pushNotification({
    type: 'inventory-low-stock',
    title: 'Low stock alert',
    message: `Inventory updated. Low stock: ${summary}${extra}.`,
    itemIds: items.map((item) => item.id),
    at: new Date().toISOString()
  });
};

exports.listInventory = async (_req, res, next) => {
  try {
    const items = await InventoryItem.findAll({ where: { isDeleted: false }, order: [['name', 'ASC']] });
    res.json({ items, summary: { totalItems: items.length, lowStockCount: items.filter((item) => item.quantity <= item.lowStockThreshold).length, outOfStockCount: items.filter((item) => item.quantity === 0).length, totalUnits: items.reduce((sum, item) => sum + item.quantity, 0) } });
  } catch (err) { next(err); }
};

exports.createInventoryItem = async (req, res, next) => {
  try {
    const values = clean(req.body || {}); validate(values);
    const item = await InventoryItem.create(values);
    res.status(201).json(item);
    await notifyCurrentLowStock();
  }
  catch (err) { next(err); }
};

exports.updateInventoryItem = async (req, res, next) => {
  try {
    const item = await InventoryItem.findOne({ where: { id: req.params.id, isDeleted: false } });
    if (!item) return next(ApiError.notFound('Inventory item not found.'));
    const values = clean({ ...item.toJSON(), ...(req.body || {}) }); validate(values);
    await item.update(values); res.json(item);
    await notifyCurrentLowStock();
  } catch (err) { next(err); }
};

exports.deleteInventoryItem = async (req, res, next) => {
  try {
    const item = await InventoryItem.findOne({ where: { id: req.params.id, isDeleted: false } });
    if (!item) return next(ApiError.notFound('Inventory item not found.'));
    await item.update({ isDeleted: true, deletedAt: new Date() });
    res.json({ message: 'Inventory item soft-deleted.' });
    await notifyCurrentLowStock();
  } catch (err) { next(err); }
};
