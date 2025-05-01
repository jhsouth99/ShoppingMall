const { DataTypes, Sequelize } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./User');

const QnA = sequelize.define(
  'QnA',
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true
    },
    user_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      references: { model: User, key: 'id' },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    },
    seller_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      references: { model: Seller, key: 'id' },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    },
    title: {
      type: DataTypes.STRING(200),
      allowNull: false
    },
    question: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    answer: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM('waiting', 'answered'),
      allowNull: false,
      defaultValue: 'waiting'
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
    },
    answered_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
  },
  {
    tableName: 'qnas',
    timestamps: false
  }
);

// 관계 설정
QnA.belongsTo(User,   { foreignKey: 'user_id',   as: 'user'   });
QnA.belongsTo(Seller, { foreignKey: 'seller_id', as: 'seller' });

module.exports = QnA;
