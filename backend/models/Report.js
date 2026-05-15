const { DataTypes } = require("sequelize");

const { sequelize } = require("../config/postgres");

const Report = sequelize.define(
    "Report",
    {
    id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
    },

    idea_id: {
    type: DataTypes.STRING,
    allowNull: false
    },

    user_id: {
    type: DataTypes.STRING,
    allowNull: false
    },

    file_name: {
    type: DataTypes.STRING,
    allowNull: false
    },

    status: {
    type: DataTypes.STRING,
    defaultValue: "completed"
    }
    },
    {
        timestamps: true
    }
);

module.exports = Report;
