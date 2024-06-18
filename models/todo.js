const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  sequelize.define("todo", {
    id: {
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: DataTypes.INTEGER,
    },
    user_id: {
      allowNull: false,
      type: DataTypes.INTEGER,
    },
    name: {
      allowNull: false,
      type: DataTypes.STRING,
    },
    done_date: {
      allowNull: true,
      type: DataTypes.DATEONLY,
    },
  });
};
