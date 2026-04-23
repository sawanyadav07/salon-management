const Joi = require('joi');

const userRoles = ['admin', 'receptionist'];

const authSchemas = {
  registerBody: Joi.object({
    name: Joi.string().trim().min(2).max(100).required(),
    email: Joi.string().trim().email().required(),
    password: Joi.string().min(6).max(128).required(),
    role: Joi.string().valid(...userRoles).optional()
  }),
  loginBody: Joi.object({
    email: Joi.string().trim().email().required(),
    password: Joi.string().min(1).required()
  })
};

module.exports = { authSchemas };
