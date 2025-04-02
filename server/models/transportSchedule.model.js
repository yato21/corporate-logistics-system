module.exports = (sequelize, Sequelize) => {
  const TransportSchedule = sequelize.define("transport_schedules", {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    transportId: {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: 'transports',
        key: 'id'
      }
    },
    orderId: {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: 'orders',
        key: 'id'
      }
    },
    startTime: {
      type: Sequelize.DATE,
      allowNull: false
    },
    endTime: {
      type: Sequelize.DATE,
      allowNull: false
    },
    status: {
      type: Sequelize.ENUM('active', 'cancelled'),
      defaultValue: 'active'
    }
  });

  return TransportSchedule;
}; 