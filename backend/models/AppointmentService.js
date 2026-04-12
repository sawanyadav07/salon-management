module.exports = (sequelize, DataTypes) => {
  const AppointmentService = sequelize.define('AppointmentService', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    appointmentId: { type: DataTypes.INTEGER, allowNull: false },
    serviceId: { type: DataTypes.INTEGER, allowNull: false }
  }, {
    tableName: 'appointment_services',
    timestamps: false
  });

  return AppointmentService;
};
