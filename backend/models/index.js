const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const User = require('./User')(sequelize, DataTypes);
const Customer = require('./Customer')(sequelize, DataTypes);
const Service = require('./Service')(sequelize, DataTypes);
const Staff = require('./Staff')(sequelize, DataTypes);
const Appointment = require('./Appointment')(sequelize, DataTypes);
const AppointmentService = require('./AppointmentService')(sequelize, DataTypes);

// Associations
Customer.hasMany(Appointment, { foreignKey: 'customerId', as: 'appointments', onDelete: 'CASCADE' });
Appointment.belongsTo(Customer, { foreignKey: 'customerId', as: 'customer', onDelete: 'CASCADE' });

Staff.hasMany(Appointment, { foreignKey: 'staffId', as: 'appointments', onDelete: 'CASCADE' });
Appointment.belongsTo(Staff, { foreignKey: 'staffId', as: 'staff', onDelete: 'CASCADE' });

Appointment.belongsToMany(Service, {
  through: AppointmentService,
  foreignKey: 'appointmentId',
  otherKey: 'serviceId',
  as: 'services',
  onDelete: 'CASCADE'
});

Service.belongsToMany(Appointment, {
  through: AppointmentService,
  foreignKey: 'serviceId',
  otherKey: 'appointmentId',
  as: 'appointments',
  onDelete: 'CASCADE'
});

AppointmentService.belongsTo(Service, { foreignKey: 'serviceId', as: 'service' });
AppointmentService.belongsTo(Appointment, { foreignKey: 'appointmentId', as: 'appointment' });

module.exports = {
  sequelize,
  User,
  Customer,
  Service,
  Staff,
  Appointment,
  AppointmentService
};
