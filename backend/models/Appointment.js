module.exports = (sequelize, DataTypes) => {
  const Appointment = sequelize.define('Appointment', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    customerId: { type: DataTypes.INTEGER, allowNull: false },
    staffId: { type: DataTypes.INTEGER, allowNull: false },
    date: { type: DataTypes.DATEONLY, allowNull: false },
    timeSlot: { type: DataTypes.STRING, allowNull: false },
    status: {
      type: DataTypes.ENUM('scheduled', 'confirmed', 'in-progress', 'completed', 'cancelled'),
      defaultValue: 'scheduled'
    },
    totalAmount: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
    discount: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
    finalAmount: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
    paymentStatus: { type: DataTypes.ENUM('pending', 'paid', 'partial'), defaultValue: 'pending' },
    paymentMethod: { type: DataTypes.ENUM('cash', 'card', 'upi', 'other') },
    notes: { type: DataTypes.TEXT }
  }, {
    tableName: 'appointments',
    timestamps: true
  });

  return Appointment;
};
