const { DataTypes, Sequelize } = require('sequelize');
const sequelize = require('../config/database');
const Product = require('./Product');
const User    = require('./User');

const Inquiry = sequelize.define(
  'Inquiry',
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true
    },
    product_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: { model: Product, key: 'id' },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    },
    user_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: { model: User, key: 'id' },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE'
    },
    question: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    answer: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    is_private: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
    },
    answered_at: {
      type: DataTypes.DATE,
      allowNull: true
    }
  },
  {
    tableName: 'inquiries',
    timestamps: false
  }
);

// 관계 설정
Inquiry.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });
Inquiry.belongsTo(User,    { foreignKey: 'user_id',    as: 'user'    });

module.exports = Inquiry;
