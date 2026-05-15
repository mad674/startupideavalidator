const { Sequelize } = require("sequelize");

const sequelize = new Sequelize(process.env.POSTGRES_URL, {
  dialect: "postgres",
  logging: false,
  dialectOptions: process.env.NODE_ENV === "production" ? {
    ssl: {
      require: true,
      rejectUnauthorized: false,
    },
  } : {},
});

const connectPostgres = async () => {
  try {
    await sequelize.authenticate();
    console.log("✅ PostgreSQL connected");
  } catch (error) {
    console.error("❌ PostgreSQL Error:", error.message);
    process.exit(1);
  }
};

module.exports = {
  sequelize,
  connectPostgres,
};