const router = require('express').Router();
const Appointment = require('../models/Appointment');
const Customer = require('../models/Customer');
const Staff = require('../models/Staff');
const Service = require('../models/Service');
const auth = require('../middleware/auth');

router.get('/stats', auth, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayEnd = new Date(); todayEnd.setHours(23, 59, 59, 999);

    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthEnd   = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59);

    const [
      todayAppts,
      monthAppts,
      totalCustomers,
      activeStaff,
      pendingAppts,
      revenueToday,
      revenueMonth
    ] = await Promise.all([
      Appointment.countDocuments({ date: { $gte: today, $lte: todayEnd } }),
      Appointment.countDocuments({ date: { $gte: monthStart, $lte: monthEnd } }),
      Customer.countDocuments(),
      Staff.countDocuments({ isActive: true }),
      Appointment.countDocuments({ status: 'scheduled' }),
      Appointment.aggregate([
        { $match: { date: { $gte: today, $lte: todayEnd }, status: 'completed' } },
        { $group: { _id: null, total: { $sum: '$finalAmount' } } }
      ]),
      Appointment.aggregate([
        { $match: { date: { $gte: monthStart, $lte: monthEnd }, status: 'completed' } },
        { $group: { _id: null, total: { $sum: '$finalAmount' } } }
      ])
    ]);

    // Recent appointments
    const recentAppointments = await Appointment.find()
      .populate('customer', 'name phone')
      .populate('staff', 'name')
      .populate('services', 'name')
      .sort({ createdAt: -1 })
      .limit(5);

    // Top services this month
    const topServices = await Appointment.aggregate([
      { $match: { date: { $gte: monthStart, $lte: monthEnd }, status: 'completed' } },
      { $unwind: '$services' },
      { $group: { _id: '$services', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
      { $lookup: { from: 'services', localField: '_id', foreignField: '_id', as: 'service' } },
      { $unwind: '$service' },
      { $project: { name: '$service.name', count: 1 } }
    ]);

    res.json({
      todayAppts,
      monthAppts,
      totalCustomers,
      activeStaff,
      pendingAppts,
      revenueToday: revenueToday[0]?.total || 0,
      revenueMonth: revenueMonth[0]?.total || 0,
      recentAppointments,
      topServices
    });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
