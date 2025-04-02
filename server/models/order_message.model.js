module.exports = (sequelize, Sequelize) => {
  const OrderMessage = sequelize.define("order_messages", {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    orderId: {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: 'orders',
        key: 'id'
      }
    },
    senderId: {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    message: {
      type: Sequelize.TEXT,
      allowNull: false
    },
    timestamp: {
      type: Sequelize.DATE,
      defaultValue: Sequelize.NOW
    },
    isRead: {
      type: Sequelize.BOOLEAN,
      defaultValue: false
    }
  });

  OrderMessage.associate = (models) => {
    OrderMessage.belongsTo(models.order, {
      foreignKey: 'orderId',
      as: 'order'
    });
    
    OrderMessage.belongsTo(models.user, {
      foreignKey: 'senderId',
      as: 'sender'
    });
  };

  return OrderMessage;
}; 