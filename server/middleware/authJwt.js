const jwt = require("jsonwebtoken");
const config = require("../config/auth.config.js");
const db = require("../models");
const User = db.user;

verifyToken = (req, res, next) => {
  let token = req.headers["authorization"];

  if (!token) {
    return res.status(403).send({
      message: "Не предоставлен токен авторизации!"
    });
  }

  // Удаляем префикс Bearer если он есть
  if (token.startsWith('Bearer ')) {
    token = token.slice(7);
  }

  jwt.verify(token, config.secret, (err, decoded) => {
    if (err) {
      return res.status(401).send({
        message: "Неавторизован!"
      });
    }
    req.userId = decoded.id;
    next();
  });
};

isCustomer = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.userId);
    if (user.role === "customer") {
      next();
      return;
    }
    res.status(403).send({
      message: "Требуются права заказчика!"
    });
  } catch (error) {
    res.status(500).send({
      message: "Ошибка при проверке роли пользователя"
    });
  }
};

isDispatcher = (req, res, next) => {
  User.findByPk(req.userId).then(user => {
    if (user.role === "dispatcher") {
      next();
      return;
    }
    res.status(403).send({
      message: "Требуются права диспетчера!"
    });
  });
};

isDriver = (req, res, next) => {
  User.findByPk(req.userId).then(user => {
    if (user.role === "driver") {
      next();
      return;
    }
    res.status(403).send({
      message: "Требуются права водителя!"
    });
  });
};

hasRole = (roles) => {
  return async (req, res, next) => {
    try {
      const user = await User.findByPk(req.userId);
      
      if (!user) {
        return res.status(403).send({
          message: "Пользователь не найден"
        });
      }

      if (!roles.includes(user.role)) {
        return res.status(403).send({
          message: "Нет прав для выполнения этого действия"
        });
      }
      
      req.user = user; // Сохраняем пользователя в request для дальнейшего использования
      next();
    } catch (error) {
      return res.status(500).send({
        message: "Ошибка при проверке прав пользователя"
      });
    }
  };
};

const authJwt = {
  verifyToken,
  isCustomer,
  isDispatcher,
  isDriver,
  hasRole
};

module.exports = authJwt; 