const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Category = sequelize.define(
  'Category',
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    parent_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      // 자기 자신과 1:N 관계를 맺기 위한 FK
      references: {
        model: 'categories',
        key: 'id'
      }
    }
  },
  {
    tableName: 'categories',
    timestamps: false
  }
);

// 자기 자신과의 관계 설정 (계층 구조)
Category.hasMany(Category, {
  foreignKey: 'parent_id',
  as: 'children'
});
Category.belongsTo(Category, {
  foreignKey: 'parent_id',
  as: 'parent'
});

module.exports = Category;
