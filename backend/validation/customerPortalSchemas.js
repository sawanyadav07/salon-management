const Joi = require('joi');

const genders = ['male', 'female', 'other'];
const dateOnly = Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/);
const timeOnly = Joi.string().pattern(/^([01]\d|2[0-3]):([0-5]\d)$/);

const customerPortalSchemas = {
  signupBody: Joi.object({
    name: Joi.string().trim().min(2).max(100).required(),
    phone: Joi.string().trim().pattern(/^\d{10}$/).required(),
    email: Joi.string().trim().email().required(),
    password: Joi.string().min(6).max(128).required(),
    gender: Joi.string().valid(...genders).allow(null).empty(''),
    dob: dateOnly.allow(null).empty(''),
    address: Joi.string().trim().max(255).allow('', null)
  }),
  loginBody: Joi.object({
    email: Joi.string().trim().email().required(),
    password: Joi.string().min(1).required()
  }),
  availabilityQuery: Joi.object({
    date: dateOnly.required()
  }),
  createAppointmentBody: Joi.object({
    staffId: Joi.number().integer().positive().required(),
    services: Joi.array().items(Joi.number().integer().positive()).min(1).required(),
    date: dateOnly.required(),
    timeSlot: timeOnly.required(),
    notes: Joi.string().trim().max(2000).allow('', null)
  }),
  cancelAppointmentBody: Joi.object({
    reason: Joi.string().trim().min(3).max(300).allow('', null)
  })
};

module.exports = { customerPortalSchemas };
