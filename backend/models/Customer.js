module.exports = (sequelize, DataTypes) => {
  const Customer = sequelize.define('Customer', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    name: { type: DataTypes.STRING, allowNull: false },
    phone: { type: DataTypes.STRING, allowNull: false, unique: true },
    email: { type: DataTypes.STRING },
    gender: { type: DataTypes.ENUM('male', 'female', 'other') },
    dob: { type: DataTypes.DATE },
    address: { type: DataTypes.STRING },
    notes: { type: DataTypes.TEXT },
    totalVisits: { type: DataTypes.INTEGER, defaultValue: 0 },
    totalSpent: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 }
  }, {
    tableName: 'customers',
    timestamps: true
  });

  return Customer;
};
