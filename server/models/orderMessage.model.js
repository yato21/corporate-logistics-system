module.exports = (sequelize, Sequelize) => {
  const OrderMessage = sequelize.define("order_message", {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    orderId: {
      type: Sequelize.INTEGER,
      references: {
        model: 'orders',
        key: 'id'
      }
    },
    senderId: {
      type: Sequelize.INTEGER,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    message: {
      type: Sequelize.TEXT,
      allowNull: true
    },
    timestamp: {
      type: Sequelize.DATE,
      defaultValue: Sequelize.NOW
    },
    isRead: {
      type: Sequelize.BOOLEAN,
      defaultValue: false
    },
    hasFile: {
      type: Sequelize.BOOLEAN,
      defaultValue: false
    }
  });

  return OrderMessage;
}; 