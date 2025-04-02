module.exports = (sequelize, Sequelize) => {
  const VehicleType = sequelize.define("vehicle_types", {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    type: {
      type: Sequelize.ENUM('passenger', 'cargo', 'special'),
      allowNull: false
    },
    name: {
      type: Sequelize.STRING,
      allowNull: false
    },
    description: {
      type: Sequelize.TEXT,
      allowNull: true
    },
    capacity: {
      type: Sequelize.FLOAT,
      allowNull: false,
      comment: 'Грузоподъемность в кг или количество пассажиров'
    },
    volume: {
      type: Sequelize.FLOAT,
      allowNull: true,
      comment: 'Объем грузового отсека в м3'
    },
    features: {
      type: Sequelize.JSON,
      allowNull: true,
      comment: 'Дополнительные характеристики'
    },
    imageUrl: {
      type: Sequelize.STRING,
      allowNull: true
    }
  });

  return VehicleType;
}; 