const { Op, fn, col, literal } = require('sequelize');
const {
  Appointment,
  Customer,
  Staff,
  Service,
  AppointmentService,
  sequelize
} = require('../models');

const formatDate = (date) => date.toISOString().split('T')[0];

exports.getStats = async (_req, res, next) => {
  try {
    const today = new Date();
    const todayStr = formatDate(today);
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    const [
      todayAppts,
      monthAppts,
      totalCustomers,
      activeStaff,
      pendingAppts,
      revenueToday,
      revenueMonth
    ] = await Promise.all([
      Appointment.count({ where: { date: todayStr } }),
      Appointment.count({ where: { date: { [Op.between]: [formatDate(monthStart), formatDate(monthEnd)] } } }),
      Customer.count(),
      Staff.count({ where: { isActive: true } }),
      Appointment.count({ where: { status: 'scheduled' } }),
      Appointment.sum('finalAmount', { where: { status: 'completed', date: todayStr } }),
      Appointment.sum('finalAmount', {
        where: {
          status: 'completed',
          date: { [Op.between]: [formatDate(monthStart), formatDate(monthEnd)] }
        }
      })
    ]);

    const recentAppointments = await Appointment.findAll({
      include: [
        { model: Customer, as: 'customer', attributes: ['name', 'phone'] },
        { model: Staff, as: 'staff', attributes: ['name'] },
        { model: Service, as: 'services', attributes: ['name'], through: { attributes: [] } }
      ],
      order: [['createdAt', 'DESC']],
      limit: 5
    });

    const topServices = await AppointmentService.findAll({
      attributes: [
        ['service_id', 'serviceId'],
        [fn('COUNT', col('service_id')), 'count']
      ],
      include: [{ model: Service, as: 'service', attributes: ['id', 'name'] }],
      group: ['service_id', 'service.id'],
      order: [[literal('count'), 'DESC']],
      limit: 5
    });

    res.json({
      todayAppts,
      monthAppts,
      totalCustomers,
      activeStaff,
      pendingAppts,
      revenueToday: revenueToday || 0,
      revenueMonth: revenueMonth || 0,
      recentAppointments,
      topServices: topServices.map((item) => ({
        id: item.get('serviceId'),
        name: item.service?.name,
        count: Number(item.get('count'))
      }))
    });
  } catch (err) {
    next(err);
  }
};
