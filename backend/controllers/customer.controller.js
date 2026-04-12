const { Op } = require('sequelize');
const { Customer } = require('../models');
const { ApiError } = require('../errors/apiError');
const { pushNotification } = require('../config/notify');

exports.getCustomers = async (req, res, next) => {
  try {
    const { search } = req.query;
    const where = search
      ? {
          [Op.or]: [
            { name: { [Op.like]: `%${search}%` } },
            { phone: { [Op.like]: `%${search}%` } }
          ]
        }
      : {};

    const customers = await Customer.findAll({
      where,
      order: [['createdAt', 'DESC']]
    });
    res.json(customers);
  } catch (err) {
    next(err);
  }
};

exports.getCustomer = async (req, res, next) => {
  try {
    const customer = await Customer.findByPk(req.params.id);
    if (!customer) return next(ApiError.notFound('Customer not found'));
    res.json(customer);
  } catch (err) {
    next(err);
  }
};

exports.createCustomer = async (req, res, next) => {
  try {
    const customer = await Customer.create(req.body);
    pushNotification({
      type: 'customer',
      title: 'New customer added',
      message: `${customer.name} (${customer.phone})`,
      at: new Date().toISOString()
    });
    res.status(201).json(customer);
  } catch (err) {
    next(err);
  }
};

exports.updateCustomer = async (req, res, next) => {
  try {
    const customer = await Customer.findByPk(req.params.id);
    if (!customer) return next(ApiError.notFound('Customer not found'));
    await customer.update(req.body);
    res.json(customer);
  } catch (err) {
    next(err);
  }
};

exports.deleteCustomer = async (req, res, next) => {
  try {
    const customer = await Customer.findByPk(req.params.id);
    if (!customer) return next(ApiError.notFound('Customer not found'));
    await customer.destroy();
    res.json({ message: 'Customer deleted' });
  } catch (err) {
    next(err);
  }
};
