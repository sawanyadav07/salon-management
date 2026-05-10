const bcrypt = require('bcryptjs');

module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    name: { type: DataTypes.STRING, allowNull: false },
    email: { type: DataTypes.STRING, allowNull: false, unique: true, validate: { isEmail: true } },
    password: { type: DataTypes.STRING, allowNull: false },
    role: { type: DataTypes.ENUM('admin', 'receptionist'), defaultValue: 'receptionist' }
  }, {
    tableName: 'users',
    timestamps: true
  });

  User.addHook('beforeValidate', (user) => {
    if (user.email) {
      user.email = String(user.email).trim().toLowerCase();
    }
  });

  User.addHook('beforeCreate', async (user) => {
    if (user.password) {
      user.password = await bcrypt.hash(user.password, 10);
    }
  });

  User.addHook('beforeUpdate', async (user) => {
    if (user.changed('password')) {
      user.password = await bcrypt.hash(user.password, 10);
    }
  });

  User.prototype.matchPassword = function (entered) {
    return bcrypt.compare(entered, this.password);
  };

  return User;
};
