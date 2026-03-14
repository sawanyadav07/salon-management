const router = require('express').Router();
const Customer = require('../models/Customer');
const auth = require('../middleware/auth');

// GET all customers
router.get('/', auth, async (req, res) => {
  try {
    const { search } = req.query;
    const query = search
      ? { $or: [{ name: { $regex: search, $options: 'i' } }, { phone: { $regex: search, $options: 'i' } }] }
      : {};
    const customers = await Customer.find(query).sort({ createdAt: -1 });
    res.json(customers);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// GET single customer
router.get('/:id', auth, async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) return res.status(404).json({ message: 'Customer not found' });
    res.json(customer);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// CREATE customer
router.post('/', auth, async (req, res) => {
  try {
    const customer = await Customer.create(req.body);
    res.status(201).json(customer);
  } catch (err) { res.status(400).json({ message: err.message }); }
});

// UPDATE customer
router.put('/:id', auth, async (req, res) => {
  try {
    const customer = await Customer.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(customer);
  } catch (err) { res.status(400).json({ message: err.message }); }
});

// DELETE customer
router.delete('/:id', auth, async (req, res) => {
  try {
    await Customer.findByIdAndDelete(req.params.id);
    res.json({ message: 'Customer deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
