const Joi = require('joi');

const genders = ['male', 'female', 'other'];
const dateOnly = Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/);

const customerBase = {
  name: Joi.string().trim().min(2).max(100),
  phone: Joi.string().trim().pattern(/^\d{10}$/),
  email: Joi.string().trim().email().allow('', null),
  gender: Joi.string().valid(...genders).allow(null).empty(''),
  dob: dateOnly.allow(null).empty(''),
  address: Joi.string().trim().max(255).allow('', null),
  notes: Joi.string().trim().max(2000).allow('', null)
};

const customerSchemas = {
  listQuery: Joi.object({
    search: Joi.string().trim().max(100).allow('')
  }),
  createBody: Joi.object({
    ...customerBase,
    name: customerBase.name.required(),
    phone: customerBase.phone.required()
  }),
  updateBody: Joi.object(customerBase).min(1)
};

module.exports = { customerSchemas };
