const { Op } = require('sequelize');
const {
  Appointment,
  Customer,
  Service,
  Staff
} = require('../models');
const { ApiError } = require('../errors/apiError');
const { pushNotification } = require('../config/notify');

const BUSY_STATUSES = ['scheduled', 'confirmed', 'in-progress'];

const appointmentIncludes = [
  { model: Staff, as: 'staff', attributes: ['id', 'name', 'role'] },
  { model: Service, as: 'services', attributes: ['id', 'name', 'price', 'duration'], through: { attributes: [] } }
];

const toMoney = (value) => Number(Number(value || 0).toFixed(2));

exports.getServices = async (_req, res, next) => {
  try {
    const services = await Service.findAll({
      where: { isActive: true },
      order: [['category', 'ASC'], ['name', 'ASC']]
    });
    return res.json(services);
  } catch (err) {
    return next(err);
  }
};

exports.getStaff = async (_req, res, next) => {
  try {
    const staff = await Staff.findAll({
      where: { isActive: true },
      attributes: ['id', 'name', 'role', 'specialties', 'workingDays', 'workingHours'],
      order: [['name', 'ASC']]
    });
    return res.json(staff);
  } catch (err) {
    return next(err);
  }
};

exports.getAvailability = async (req, res, next) => {
  try {
    const booked = await Appointment.findAll({
      attributes: ['staffId', 'timeSlot'],
      where: {
        date: req.query.date,
        status: { [Op.in]: BUSY_STATUSES }
      },
      order: [['timeSlot', 'ASC']]
    });

    const bookedByStaff = booked.reduce((acc, item) => {
      const key = String(item.staffId);
      if (!acc[key]) acc[key] = [];
      acc[key].push(item.timeSlot);
      return acc;
    }, {});

    return res.json({
      date: req.query.date,
      bookedByStaff
    });
  } catch (err) {
    return next(err);
  }
};

exports.getMyAppointments = async (req, res, next) => {
  try {
    const customerId = req.user.customerId;
    const appts = await Appointment.findAll({
      where: { customerId },
      include: appointmentIncludes,
      order: [['date', 'ASC'], ['timeSlot', 'ASC']]
    });
    return res.json(appts);
  } catch (err) {
    return next(err);
  }
};

exports.bookAppointment = async (req, res, next) => {
  try {
    const customerId = req.user.customerId;
    const { staffId, services, date, timeSlot, notes } = req.body;

    const customer = await Customer.findByPk(customerId);
    if (!customer) return next(ApiError.notFound('Customer not found'));

    const staff = await Staff.findOne({ where: { id: staffId, isActive: true } });
    if (!staff) return next(ApiError.badRequest('Selected staff member is not available'));

    const normalizedServiceIds = [...new Set(services.map((id) => Number(id)))];
    const serviceRows = await Service.findAll({
      where: {
        id: { [Op.in]: normalizedServiceIds },
        isActive: true
      }
    });

    if (serviceRows.length !== normalizedServiceIds.length) {
      return next(ApiError.badRequest('One or more selected services are unavailable'));
    }

    const conflictingAppointment = await Appointment.findOne({
      where: {
        staffId,
        date,
        timeSlot,
        status: { [Op.in]: BUSY_STATUSES }
      }
    });

    if (conflictingAppointment) {
      return next(ApiError.conflict('This time slot is no longer available. Please choose another slot.'));
    }

    const totalAmount = toMoney(
      serviceRows.reduce((sum, item) => sum + Number(item.price || 0), 0)
    );

    const appointment = await Appointment.create({
      customerId,
      staffId,
      date,
      timeSlot,
      status: 'scheduled',
      notes: notes || null,
      totalAmount,
      discount: 0,
      finalAmount: totalAmount,
      paymentStatus: 'pending',
      paymentMethod: null
    });

    await appointment.setServices(normalizedServiceIds);

    const fullAppointment = await Appointment.findByPk(appointment.id, {
      include: [
        { model: Customer, as: 'customer', attributes: ['id', 'name', 'phone'] },
        ...appointmentIncludes
      ]
    });

    pushNotification({
      type: 'appointment',
      title: 'New customer booking',
      message: `${customer.name} booked ${date} at ${timeSlot}`,
      at: new Date().toISOString()
    });

    return res.status(201).json(fullAppointment);
  } catch (err) {
    return next(err);
  }
};

exports.cancelMyAppointment = async (req, res, next) => {
  try {
    const customerId = req.user.customerId;
    const { reason } = req.body;

    const appointment = await Appointment.findOne({
      where: { id: req.params.id, customerId }
    });

    if (!appointment) return next(ApiError.notFound('Appointment not found'));
    if (appointment.status === 'cancelled') return next(ApiError.badRequest('Appointment is already cancelled'));
    if (appointment.status === 'completed') return next(ApiError.badRequest('Completed appointments cannot be cancelled'));

    const notes = reason
      ? [appointment.notes, `Customer cancellation reason: ${reason}`].filter(Boolean).join('\n')
      : appointment.notes;

    await appointment.update({
      status: 'cancelled',
      notes
    });

    pushNotification({
      type: 'appointment',
      title: 'Customer cancelled appointment',
      message: `Appointment #${appointment.id} has been cancelled`,
      at: new Date().toISOString()
    });

    return res.json({ message: 'Appointment cancelled successfully' });
  } catch (err) {
    return next(err);
  }
};
