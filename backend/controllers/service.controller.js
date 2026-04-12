const { Service } = require('../models');
const { ApiError } = require('../errors/apiError');
const { pushNotification } = require('../config/notify');

exports.getServices = async (req, res, next) => {
  try {
    const { category } = req.query;
    const where = category ? { category, isActive: true } : { isActive: true };
    const services = await Service.findAll({ where, order: [['category', 'ASC'], ['name', 'ASC']] });
    res.json(services);
  } catch (err) {
    next(err);
  }
};

exports.getAllServices = async (_req, res, next) => {
  try {
    const services = await Service.findAll({ order: [['createdAt', 'DESC']] });
    res.json(services);
  } catch (err) {
    next(err);
  }
};

exports.getService = async (req, res, next) => {
  try {
    const service = await Service.findByPk(req.params.id);
    if (!service) return next(ApiError.notFound('Service not found'));
    res.json(service);
  } catch (err) {
    next(err);
  }
};

exports.createService = async (req, res, next) => {
  try {
    const service = await Service.create(req.body);
    pushNotification({
      type: 'service',
      title: 'New service added',
      message: service.name,
      at: new Date().toISOString()
    });
    res.status(201).json(service);
  } catch (err) {
    next(err);
  }
};

exports.updateService = async (req, res, next) => {
  try {
    const service = await Service.findByPk(req.params.id);
    if (!service) return next(ApiError.notFound('Service not found'));
    await service.update(req.body);
    res.json(service);
  } catch (err) {
    next(err);
  }
};

exports.deactivateService = async (req, res, next) => {
  try {
    const service = await Service.findByPk(req.params.id);
    if (!service) return next(ApiError.notFound('Service not found'));
    await service.update({ isActive: false });
    pushNotification({
      type: 'service',
      title: 'Service deactivated',
      message: service.name,
      at: new Date().toISOString()
    });
    res.json({ message: 'Service deactivated' });
  } catch (err) {
    next(err);
  }
};
