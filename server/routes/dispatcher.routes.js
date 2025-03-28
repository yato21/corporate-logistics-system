const { authJwt } = require("../middleware");
const userController = require("../controllers/user.controller.js");
const transportController = require("../controllers/transport.controller.js");
const orderController = require("../controllers/order.controller.js");
const controller = require("../controllers/dispatcher.controller");

module.exports = function(app) {
  app.use(function(req, res, next) {
    res.header(
      "Access-Control-Allow-Headers",
      "x-access-token, Origin, Content-Type, Accept, Authorization"
    );
    next();
  });

  // Маршруты для профиля
  app.get(
    "/api/profile",
    [authJwt.verifyToken],
    userController.getProfile
  );

  app.put(
    "/api/profile",
    [authJwt.verifyToken],
    userController.updateProfile
  );

  // Маршруты для управления заказами
  app.get(
    "/api/drivers",
    [authJwt.verifyToken, authJwt.isDispatcher],
    userController.getDrivers
  );

  app.get(
    "/api/available-drivers",
    [authJwt.verifyToken, authJwt.isDispatcher],
    controller.getAvailableDrivers
  );

  app.get(
    "/api/available-transport",
    [authJwt.verifyToken, authJwt.isDispatcher],
    controller.getAvailableTransport
  );

  // Добавляем новые маршруты для проверки доступности
  app.get(
    "/api/check-driver-availability/:driverId",
    [authJwt.verifyToken, authJwt.isDispatcher],
    controller.checkDriverAvailability
  );

  app.get(
    "/api/check-transport-availability/:transportId",
    [authJwt.verifyToken, authJwt.isDispatcher],
    controller.checkTransportAvailability
  );
}; 