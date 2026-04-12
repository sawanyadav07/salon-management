const { Staff } = require('../models');
const { ApiError } = require('../errors/apiError');
const { pushNotification } = require('../config/notify');

exports.getStaff = async (_req, res, next) => {
  try {
    const staff = await Staff.findAll({ where: { isActive: true }, order: [['name', 'ASC']] });
    res.json(staff);
  } catch (err) {
    next(err);
  }
};

exports.getAllStaff = async (_req, res, next) => {
  try {
    const staff = await Staff.findAll({ order: [['createdAt', 'DESC']] });
    res.json(staff);
  } catch (err) {
    next(err);
  }
};

exports.getStaffById = async (req, res, next) => {
  try {
    const member = await Staff.findByPk(req.params.id);
    if (!member) return next(ApiError.notFound('Staff not found'));
    res.json(member);
  } catch (err) {
    next(err);
  }
};

exports.createStaff = async (req, res, next) => {
  try {
    const member = await Staff.create(req.body);
    pushNotification({
      type: 'staff',
      title: 'New staff added',
      message: member.name,
      at: new Date().toISOString()
    });
    res.status(201).json(member);
  } catch (err) {
    next(err);
  }
};

exports.updateStaff = async (req, res, next) => {
  try {
    const member = await Staff.findByPk(req.params.id);
    if (!member) return next(ApiError.notFound('Staff not found'));
    await member.update(req.body);
    res.json(member);
  } catch (err) {
    next(err);
  }
};

exports.deactivateStaff = async (req, res, next) => {
  try {
    const member = await Staff.findByPk(req.params.id);
    if (!member) return next(ApiError.notFound('Staff not found'));
    await member.update({ isActive: false });
    res.json({ message: 'Staff deactivated' });
  } catch (err) {
    next(err);
  }
};
