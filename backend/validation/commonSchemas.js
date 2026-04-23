const Joi = require('joi');

const commonSchemas = {
  idParam: Joi.object({
    id: Joi.number().integer().positive().required()
  })
};

module.exports = { commonSchemas };
