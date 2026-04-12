const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
  process.env.MYSQL_DB || 'salon_management',
  process.env.MYSQL_USER || 'root',
  process.env.MYSQL_PASSWORD || '',
  {
    host: process.env.MYSQL_HOST || 'localhost',
    port: process.env.MYSQL_PORT || 3306,
    dialect: 'mysql',
    logging: process.env.DB_LOG === 'true' ? console.log : false,
    timezone: process.env.DB_TZ || '+05:30',
    define: {
      underscored: true,
      freezeTableName: false
    }
  }
);

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ MySQL connection established');
    await sequelize.sync();
    console.log('✅ Sequelize models synced');
  } catch (err) {
    console.error('❌ MySQL connection error:', err.message);
    console.error('ℹ️ Check MYSQL_* vars in backend/.env and ensure the DB/user exists.');
    throw err;
  }
};

module.exports = { sequelize, connectDB };
