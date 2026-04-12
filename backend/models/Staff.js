module.exports = (sequelize, DataTypes) => {
  const Staff = sequelize.define('Staff', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    name: { type: DataTypes.STRING, allowNull: false },
    phone: { type: DataTypes.STRING, allowNull: false },
    email: { type: DataTypes.STRING },
    role: { type: DataTypes.STRING, allowNull: false },
    specialties: { type: DataTypes.JSON },
    salary: { type: DataTypes.DECIMAL(10, 2) },
    joinDate: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
    workingDays: { type: DataTypes.JSON },
    workingHours: { type: DataTypes.JSON }
  }, {
    tableName: 'staff',
    timestamps: true
  });

  return Staff;
};
