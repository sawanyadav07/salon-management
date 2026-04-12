const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { ApiError } = require('../errors/apiError');

const signToken = (user) =>
  jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });

exports.register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;
    const exists = await User.findOne({ where: { email } });
    if (exists) return next(ApiError.badRequest('Email already registered'));

    const user = await User.create({ name, email, password, role });
    const token = signToken(user);
    res.status(201).json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role }
    });
  } catch (err) {
    next(err);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ where: { email } });
    if (!user) return next(ApiError.unauthorized('Invalid credentials'));

    const isMatch = await user.matchPassword(password);
    if (!isMatch) return next(ApiError.unauthorized('Invalid credentials'));

    const token = signToken(user);
    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role }
    });
  } catch (err) {
    next(err);
  }
};
