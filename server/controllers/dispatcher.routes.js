const { authJwt } = require("../middleware");
const controller = require("../controllers/dispatcher.controller");

module.exports = function(app) {
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