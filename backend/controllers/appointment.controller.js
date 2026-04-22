const { Op } = require('sequelize');
const {
  Appointment,
  Customer,
  Staff,
  Service
} = require('../models');
const { ApiError } = require('../errors/apiError');
const { pushNotification } = require('../config/notify');

const includeRelations = [
  { model: Customer, as: 'customer', attributes: ['id', 'name', 'phone'] },
  { model: Staff, as: 'staff', attributes: ['id', 'name', 'role'] },
  { model: Service, as: 'services', attributes: ['id', 'name', 'price', 'duration'], through: { attributes: [] } }
];

const PAYMENT_METHODS = new Set(['cash', 'card', 'upi', 'other']);

const normalizeAppointmentPayload = (payload = {}, { forUpdate = false } = {}) => {
  const normalized = { ...payload };

  if (Object.prototype.hasOwnProperty.call(normalized, 'paymentMethod')) {
    if (typeof normalized.paymentMethod === 'string') {
      const method = normalized.paymentMethod.trim().toLowerCase();
      normalized.paymentMethod = PAYMENT_METHODS.has(method) ? method : null;
    } else if (!normalized.paymentMethod) {
      normalized.paymentMethod = null;
    }
  } else if (!forUpdate) {
    normalized.paymentMethod = null;
  }

  return normalized;
};

exports.getAppointments = async (req, res, next) => {
  try {
    const { date, status, staff } = req.query;
    const where = {};
    if (status) where.status = status;
    if (staff) where.staffId = staff;
    if (date) where.date = date;

    const appointments = await Appointment.findAll({
      where,
      include: includeRelations,
      order: [['date', 'ASC'], ['timeSlot', 'ASC']]
    });
    res.json(appointments);
  } catch (err) {
    next(err);
  }
};

exports.getAppointment = async (req, res, next) => {
  try {
    const appt = await Appointment.findByPk(req.params.id, { include: includeRelations });
    if (!appt) return next(ApiError.notFound('Appointment not found'));
    res.json(appt);
  } catch (err) {
    next(err);
  }
};

exports.createAppointment = async (req, res, next) => {
  try {
    const { services = [], ...body } = req.body;
    const payload = normalizeAppointmentPayload(body);
    const appt = await Appointment.create({
      ...payload,
      customerId: payload.customerId || payload.customer,
      staffId: payload.staffId || payload.staff
    });
    if (services?.length) await appt.setServices(services);
    const full = await Appointment.findByPk(appt.id, { include: includeRelations });
    pushNotification({
      type: 'appointment',
      title: 'New appointment booked',
      message: `${full.customer?.name || 'Customer'} with ${full.staff?.name || 'staff'} at ${full.timeSlot}`,
      at: new Date().toISOString()
    });
    res.status(201).json(full);
  } catch (err) {
    next(err);
  }
};

exports.updateAppointment = async (req, res, next) => {
  try {
    const { services, ...body } = req.body;
    const payload = normalizeAppointmentPayload(body, { forUpdate: true });
    const appt = await Appointment.findByPk(req.params.id);
    if (!appt) return next(ApiError.notFound('Appointment not found'));

    const prevStatus = appt.status;
    await appt.update({
      ...payload,
      customerId: payload.customerId || payload.customer || appt.customerId,
      staffId: payload.staffId || payload.staff || appt.staffId
    });
    if (services) await appt.setServices(services);

    if (req.body.status === 'completed' && prevStatus !== 'completed') {
      await Customer.increment(
        { totalVisits: 1, totalSpent: appt.finalAmount || 0 },
        { where: { id: appt.customerId } }
      );
    }

    const full = await Appointment.findByPk(appt.id, { include: includeRelations });

    if (req.body.status && req.body.status !== prevStatus) {
      pushNotification({
        type: 'appointment',
        title: 'Appointment status updated',
        message: `${full.customer?.name || 'Customer'} is now ${req.body.status}`,
        at: new Date().toISOString()
      });
    }

    res.json(full);
  } catch (err) {
    next(err);
  }
};

exports.deleteAppointment = async (req, res, next) => {
  try {
    const appt = await Appointment.findByPk(req.params.id);
    if (!appt) return next(ApiError.notFound('Appointment not found'));
    await appt.destroy();
    res.json({ message: 'Appointment deleted' });
  } catch (err) {
    next(err);
  }
};
