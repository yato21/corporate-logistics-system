const { authJwt, requestLogger } = require("../middleware");
const controller = require("../controllers/document.controller");
const path = require('path');

module.exports = function(app) {
  // Добавляем предварительный лог при инициализации маршрутов
  console.log('\n=== Инициализация маршрутов документов ===');

  // Добавляем общий обработчик для всех запросов к /api/documents
  app.use('/api/documents', (req, res, next) => {
    console.log('\n=== Запрос к /api/documents ===');
    console.log('URL:', req.url);
    console.log('Метод:', req.method);
    console.log('Параметры:', req.params);
    next();
  });

  // Маршрут для скачивания по ID
  app.get(
    "/api/documents/:id/download",
    (req, res, next) => {
      console.log('\n=== Попытка скачивания документа ===');
      console.log('ID документа:', req.params.id);
      console.log('Headers:', req.headers);
      next();
    },
    authJwt.verifyToken,
    controller.download
  );

  // Маршрут для прямого скачивания по имени файла
  app.get(
    "/uploads/:filename",
    [requestLogger, authJwt.verifyToken],
    (req, res, next) => {
      console.log('Получен запрос на прямое скачивание файла:', req.params.filename);
      next();
    },
    controller.downloadDirect
  );

  // Маршрут для получения информации о документе по ID
  app.get(
    "/api/documents/:id",
    [authJwt.verifyToken],
    controller.getDocument
  );

  // Логируем завершение инициализации
  console.log('Маршруты документов зарегистрированы');
  console.log('=== Конец инициализации маршрутов ===\n');
}; 