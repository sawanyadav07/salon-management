const router = require('express').Router();
const Staff = require('../models/Staff');
const auth = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  try {
    const staff = await Staff.find({ isActive: true }).sort({ name: 1 });
    res.json(staff);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.get('/all', auth, async (req, res) => {
  try {
    const staff = await Staff.find().sort({ createdAt: -1 });
    res.json(staff);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const member = await Staff.findById(req.params.id);
    if (!member) return res.status(404).json({ message: 'Staff not found' });
    res.json(member);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.post('/', auth, async (req, res) => {
  try {
    const member = await Staff.create(req.body);
    res.status(201).json(member);
  } catch (err) { res.status(400).json({ message: err.message }); }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const member = await Staff.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(member);
  } catch (err) { res.status(400).json({ message: err.message }); }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    await Staff.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ message: 'Staff deactivated' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
