const jwt = require('jsonwebtoken');
const { sequelize, Customer, CustomerAccount } = require('../models');
const { ApiError } = require('../errors/apiError');

const normalizeEmail = (email = '') => email.trim().toLowerCase();

const signToken = (customer) =>
  jwt.sign(
    {
      role: 'customer',
      customerId: customer.id
    },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

const toCustomerResponse = (customer) => ({
  id: customer.id,
  name: customer.name,
  phone: customer.phone,
  email: customer.email,
  role: 'customer'
});

exports.signup = async (req, res, next) => {
  const tx = await sequelize.transaction();
  try {
    const {
      name,
      phone,
      email,
      password,
      gender,
      dob,
      address
    } = req.body;

    const normalizedEmail = normalizeEmail(email);

    const existingByEmail = await CustomerAccount.findOne({ where: { email: normalizedEmail }, transaction: tx });
    if (existingByEmail) {
      throw ApiError.conflict('Email is already registered. Please sign in.');
    }

    let customer = await Customer.findOne({ where: { phone }, transaction: tx });

    if (customer) {
      const existingLinkedAccount = await CustomerAccount.findOne({ where: { customerId: customer.id }, transaction: tx });
      if (existingLinkedAccount) {
        throw ApiError.conflict('Phone number is already registered. Please sign in.');
      }

      await customer.update(
        {
          name,
          email: normalizedEmail,
          gender: gender || null,
          dob: dob || null,
          address: address || null
        },
        { transaction: tx }
      );
    } else {
      customer = await Customer.create(
        {
          name,
          phone,
          email: normalizedEmail,
          gender: gender || null,
          dob: dob || null,
          address: address || null
        },
        { transaction: tx }
      );
    }

    await CustomerAccount.create(
      {
        customerId: customer.id,
        email: normalizedEmail,
        password
      },
      { transaction: tx }
    );

    await tx.commit();

    const token = signToken(customer);
    return res.status(201).json({
      token,
      user: toCustomerResponse(customer)
    });
  } catch (err) {
    await tx.rollback();
    return next(err);
  }
};

exports.login = async (req, res, next) => {
  try {
    const normalizedEmail = normalizeEmail(req.body.email);
    const account = await CustomerAccount.findOne({
      where: { email: normalizedEmail },
      include: [{ model: Customer, as: 'customer' }]
    });

    if (!account || !account.customer) {
      return next(ApiError.unauthorized('Invalid credentials'));
    }

    const isMatch = await account.matchPassword(req.body.password);
    if (!isMatch) {
      return next(ApiError.unauthorized('Invalid credentials'));
    }

    const token = signToken(account.customer);
    return res.json({
      token,
      user: toCustomerResponse(account.customer)
    });
  } catch (err) {
    return next(err);
  }
};
