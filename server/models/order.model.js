module.exports = (sequelize, Sequelize) => {
  const Order = sequelize.define("orders", {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    customerId: {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    customerName: {
      type: Sequelize.STRING,
      allowNull: false
    },
    customerPhone: {
      type: Sequelize.STRING,
      allowNull: false
    },
    customerPosition: {
      type: Sequelize.STRING,
      allowNull: true
    },
    customerDepartment: {
      type: Sequelize.STRING,
      allowNull: true
    },
    customerEmail: {
      type: Sequelize.STRING,
      allowNull: true
    },
    driverId: {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    vehicleTypeId: {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: 'vehicle_types',
        key: 'id'
      }
    },
    assignedTransportId: {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'transports',
        key: 'id'
      }
    },
    status: {
      type: Sequelize.ENUM('pending', 'assigned', 'in_progress', 'completed', 'cancelled'),
      defaultValue: 'pending'
    },
    comment: {
      type: Sequelize.TEXT,
      allowNull: true
    },
    actualStartTime: {
      type: Sequelize.DATE,
      comment: 'Фактическое время начала поездки (когда водитель начал выполнение)'
    },
    actualEndTime: {
      type: Sequelize.DATE,
      comment: 'Фактическое время окончания поездки (когда водитель завершил)'
    },
    chatActive: {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
      allowNull: false
    }
  });

  Order.associate = (models) => {
    Order.belongsTo(models.vehicleType, {
      foreignKey: 'vehicleTypeId',
      as: 'vehicleType'
    });
  };

  return Order;
}; 