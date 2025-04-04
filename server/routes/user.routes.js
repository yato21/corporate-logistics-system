const { authJwt } = require("../middleware");
const controller = require("../controllers/user.controller");

module.exports = function(app) {
  app.use(function(req, res, next) {
    res.header(
      "Access-Control-Allow-Headers",
      "x-access-token, Origin, Content-Type, Accept, Authorization"
    );
    next();
  });

  // Маршруты для работы с профилем
  app.put(
    "/api/auth/profile",
    [authJwt.verifyToken],
    controller.updateProfile
  );

  app.put(
    "/api/auth/change-password",
    [authJwt.verifyToken],
    controller.changePassword
  );
}; 