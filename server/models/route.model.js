module.exports = (sequelize, Sequelize) => {
  const Route = sequelize.define("routes", {
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
    points: {
      type: Sequelize.JSON, // Массив точек маршрута
      allowNull: false,
      defaultValue: []
    },
    dateTime: {
      type: Sequelize.DATE,
      allowNull: false,
      comment: 'Планируемое время начала поездки'
    },
    estimatedEndTime: {
      type: Sequelize.DATE,
      allowNull: false,
      comment: 'Предполагаемое время окончания поездки'
    }
  });

  return Route;
}; 