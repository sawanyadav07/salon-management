const bcrypt = require('bcryptjs');

module.exports = (sequelize, DataTypes) => {
  const CustomerAccount = sequelize.define('CustomerAccount', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    customerId: { type: DataTypes.INTEGER, allowNull: false, unique: true },
    email: { type: DataTypes.STRING, allowNull: false, unique: true, validate: { isEmail: true } },
    password: { type: DataTypes.STRING, allowNull: false }
  }, {
    tableName: 'customer_accounts',
    timestamps: true
  });

  CustomerAccount.addHook('beforeCreate', async (account) => {
    if (account.password) {
      account.password = await bcrypt.hash(account.password, 10);
    }
  });

  CustomerAccount.addHook('beforeUpdate', async (account) => {
    if (account.changed('password')) {
      account.password = await bcrypt.hash(account.password, 10);
    }
  });

  CustomerAccount.prototype.matchPassword = function matchPassword(entered) {
    return bcrypt.compare(entered, this.password);
  };

  return CustomerAccount;
};
