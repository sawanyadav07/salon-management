const router = require('express').Router();
const Appointment = require('../models/Appointment');
const Customer = require('../models/Customer');
const auth = require('../middleware/auth');

// GET all appointments (with filters)
router.get('/', auth, async (req, res) => {
  try {
    const { date, status, staff } = req.query;
    const query = {};
    if (status) query.status = status;
    if (staff) query.staff = staff;
    if (date) {
      const start = new Date(date); start.setHours(0, 0, 0, 0);
      const end   = new Date(date); end.setHours(23, 59, 59, 999);
      query.date = { $gte: start, $lte: end };
    }
    const appointments = await Appointment.find(query)
      .populate('customer', 'name phone')
      .populate('staff', 'name role')
      .populate('services', 'name price duration')
      .sort({ date: 1, timeSlot: 1 });
    res.json(appointments);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// GET single appointment
router.get('/:id', auth, async (req, res) => {
  try {
    const appt = await Appointment.findById(req.params.id)
      .populate('customer').populate('staff').populate('services');
    if (!appt) return res.status(404).json({ message: 'Appointment not found' });
    res.json(appt);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// CREATE appointment
router.post('/', auth, async (req, res) => {
  try {
    const appt = await Appointment.create(req.body);
    await appt.populate(['customer', 'staff', 'services']);
    res.status(201).json(appt);
  } catch (err) { res.status(400).json({ message: err.message }); }
});

// UPDATE appointment
router.put('/:id', auth, async (req, res) => {
  try {
    const appt = await Appointment.findByIdAndUpdate(req.params.id, req.body, { new: true })
      .populate('customer', 'name phone').populate('staff', 'name').populate('services', 'name price');
    
    // If completed, update customer stats
    if (req.body.status === 'completed') {
      await Customer.findByIdAndUpdate(appt.customer._id || appt.customer, {
        $inc: { totalVisits: 1, totalSpent: appt.finalAmount }
      });
    }
    res.json(appt);
  } catch (err) { res.status(400).json({ message: err.message }); }
});

// DELETE appointment
router.delete('/:id', auth, async (req, res) => {
  try {
    await Appointment.findByIdAndDelete(req.params.id);
    res.json({ message: 'Appointment deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
