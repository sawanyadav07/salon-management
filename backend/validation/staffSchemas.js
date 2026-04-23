const Joi = require('joi');

const workingDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const dateOnly = Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/);
const timeOnly = Joi.string().pattern(/^([01]\d|2[0-3]):([0-5]\d)$/);
const money = Joi.number().min(0).precision(2);

const workingHoursSchema = Joi.object({
  start: timeOnly.required(),
  end: timeOnly.required()
});

const staffBase = {
  name: Joi.string().trim().min(2).max(100),
  phone: Joi.string().trim().pattern(/^\d{10}$/),
  email: Joi.string().trim().email().allow('', null),
  role: Joi.string().trim().min(2).max(80),
  specialties: Joi.array().items(Joi.string().trim().min(1).max(60)).max(30),
  salary: money.allow(null).empty(''),
  joinDate: dateOnly.allow(null).empty(''),
  isActive: Joi.boolean(),
  workingDays: Joi.array().items(Joi.string().valid(...workingDays)).max(7),
  workingHours: workingHoursSchema
};

const staffSchemas = {
  createBody: Joi.object({
    ...staffBase,
    name: staffBase.name.required(),
    phone: staffBase.phone.required(),
    role: staffBase.role.required()
  }),
  updateBody: Joi.object(staffBase).min(1)
};

module.exports = { staffSchemas };
