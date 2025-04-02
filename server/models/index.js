const dbConfig = require("../config/db.config.js");
const Sequelize = require("sequelize");

const sequelize = new Sequelize(dbConfig.DB, dbConfig.USER, dbConfig.PASSWORD, {
  host: dbConfig.HOST,
  dialect: dbConfig.dialect,
  logging: false,
  define: {
    charset: 'utf8',
    collate: 'utf8_general_ci'
  }
});

const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;

// Импортируем модели
db.user = require("./user.model.js")(sequelize, Sequelize);
db.order = require("./order.model.js")(sequelize, Sequelize);
db.route = require("./route.model.js")(sequelize, Sequelize);
db.vehicleType = require("./vehicleType.model.js")(sequelize, Sequelize);
db.transport = require("./transport.model.js")(sequelize, Sequelize);
db.document = require("./document.model.js")(sequelize, Sequelize);
db.driverSchedule = require("./driverSchedule.model.js")(sequelize, Sequelize);
db.transportSchedule = require("./transportSchedule.model.js")(sequelize, Sequelize);
db.orderMessage = require("./order_message.model.js")(sequelize, Sequelize);

// Определяем связи между моделями
db.order.belongsTo(db.user, { as: 'customer', foreignKey: 'customerId' });
db.order.belongsTo(db.user, { as: 'driver', foreignKey: 'driverId' });
db.order.hasOne(db.route, { foreignKey: 'orderId' });
db.order.hasMany(db.document, { foreignKey: 'orderId' });

db.order.belongsTo(db.transport, { as: 'assignedTransport', foreignKey: 'assignedTransportId' });

// Важно: определяем связь с правильным алиасом
db.transport.belongsTo(db.vehicleType, {
  foreignKey: 'vehicleTypeId',
  as: 'vehicleType'
});

db.vehicleType.hasMany(db.transport, {
  foreignKey: 'vehicleTypeId',
  as: 'transports'
});

// Добавляем связи для расписаний
db.driverSchedule.belongsTo(db.user, { foreignKey: 'driverId' });
db.transportSchedule.belongsTo(db.transport, { foreignKey: 'transportId' });

// Обратные связи
db.user.hasMany(db.driverSchedule, {
  foreignKey: 'driverId',
  as: 'schedules'
});

db.transport.hasMany(db.transportSchedule, {
  foreignKey: 'transportId',
  as: 'schedules'
});

// Добавить ассоциацию между сообщениями и документами
db.orderMessage.hasMany(db.document, {
  foreignKey: 'messageId',
  as: 'attachment'
});

db.document.belongsTo(db.orderMessage, {
  foreignKey: 'messageId',
  as: 'message'
});

// Настраиваем связи между моделями
Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

module.exports = db; 