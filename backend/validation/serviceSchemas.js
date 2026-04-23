const Joi = require('joi');

const serviceCategories = ['hair', 'skin', 'nails', 'makeup', 'spa', 'other'];
const money = Joi.number().min(0).precision(2);

const serviceBase = {
  name: Joi.string().trim().min(2).max(120),
  category: Joi.string().valid(...serviceCategories),
  price: money,
  duration: Joi.number().integer().min(5),
  description: Joi.string().trim().max(2000).allow('', null),
  isActive: Joi.boolean()
};

const serviceSchemas = {
  listQuery: Joi.object({
    category: Joi.string().valid(...serviceCategories)
  }),
  createBody: Joi.object({
    ...serviceBase,
    name: serviceBase.name.required(),
    category: serviceBase.category.required(),
    price: serviceBase.price.required(),
    duration: serviceBase.duration.required()
  }),
  updateBody: Joi.object(serviceBase).min(1)
};

module.exports = { serviceSchemas };
