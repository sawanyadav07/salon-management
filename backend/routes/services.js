const router = require('express').Router();
const Service = require('../models/Service');
const auth = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  try {
    const { category } = req.query;
    const query = category ? { category, isActive: true } : { isActive: true };
    const services = await Service.find(query).sort({ category: 1, name: 1 });
    res.json(services);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.get('/all', auth, async (req, res) => {
  try {
    const services = await Service.find().sort({ createdAt: -1 });
    res.json(services);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);
    if (!service) return res.status(404).json({ message: 'Service not found' });
    res.json(service);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.post('/', auth, async (req, res) => {
  try {
    const service = await Service.create(req.body);
    res.status(201).json(service);
  } catch (err) { res.status(400).json({ message: err.message }); }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const service = await Service.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(service);
  } catch (err) { res.status(400).json({ message: err.message }); }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    await Service.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ message: 'Service deactivated' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
