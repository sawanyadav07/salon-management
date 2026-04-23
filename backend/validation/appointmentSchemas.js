const Joi = require('joi');

const appointmentStatuses = ['scheduled', 'confirmed', 'in-progress', 'completed', 'cancelled'];
const paymentStatuses = ['pending', 'paid', 'partial'];
const paymentMethods = ['cash', 'card', 'upi', 'other'];
const dateOnly = Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/);
const timeOnly = Joi.string().pattern(/^([01]\d|2[0-3]):([0-5]\d)$/);
const money = Joi.number().min(0).precision(2);

const appointmentBase = {
  customer: Joi.number().integer().positive(),
  customerId: Joi.number().integer().positive(),
  staff: Joi.number().integer().positive(),
  staffId: Joi.number().integer().positive(),
  services: Joi.array().items(Joi.number().integer().positive()).min(1),
  date: dateOnly,
  timeSlot: timeOnly,
  status: Joi.string().valid(...appointmentStatuses),
  totalAmount: money,
  discount: money,
  finalAmount: money,
  paymentStatus: Joi.string().valid(...paymentStatuses),
  paymentMethod: Joi.string().valid(...paymentMethods).allow(null).empty(''),
  notes: Joi.string().trim().max(2000).allow('', null)
};

const appointmentSchemas = {
  listQuery: Joi.object({
    date: dateOnly,
    status: Joi.string().valid(...appointmentStatuses),
    staff: Joi.number().integer().positive()
  }),
  createBody: Joi.object({
    ...appointmentBase,
    services: appointmentBase.services.required(),
    date: appointmentBase.date.required(),
    timeSlot: appointmentBase.timeSlot.required()
  })
    .or('customer', 'customerId')
    .or('staff', 'staffId'),
  updateBody: Joi.object(appointmentBase).min(1)
};

module.exports = { appointmentSchemas };
