const authJwt = require("./authJwt");
const verifySignUp = require("./verifySignUp");

// Добавляем middleware для логирования
const requestLogger = (req, res, next) => {
  console.log('\n--- Новый запрос ---');
  console.log('Метод:', req.method);
  console.log('URL:', req.url);
  console.log('Параметры:', req.params);
  console.log('Query:', req.query);
  console.log('Headers:', req.headers);
  console.log('------------------\n');
  next();
};

module.exports = {
  authJwt,
  verifySignUp,
  requestLogger
}; 