module.exports = (sequelize, Sequelize) => {
  const Transport = sequelize.define("transports", {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    vehicleTypeId: {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: 'vehicle_types',
        key: 'id'
      },
      comment: 'Ссылка на тип транспортного средства'
    },
    vehicleNumber: {
      type: Sequelize.STRING,
      unique: true,
      allowNull: false,
      comment: 'Регистрационный номер'
    },
    status: {
      type: Sequelize.ENUM('available', 'in_use', 'maintenance'),
      defaultValue: 'available',
      comment: 'Статус конкретного транспортного средства'
    }
  });

  return Transport;
}; 