const { authJwt } = require("../middleware");
const controller = require("../controllers/order.controller");
const multer = require('multer');
const path = require('path');
const chatController = require("../controllers/chat.controller");
const fs = require('fs');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadsDir = path.join(__dirname, '..', 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    // Генерируем уникальное имя файла
    cb(null, Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  // Разрешаем документы и изображения
  const allowedMimes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp'
  ];
  
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Неподдерживаемый тип файла. Разрешены: PDF, Word, Excel и изображения'), false);
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  },
  fileFilter: fileFilter
});

module.exports = function(app) {
  app.use(function(req, res, next) {
    res.header(
      "Access-Control-Allow-Headers",
      "x-access-token, Origin, Content-Type, Accept, Authorization"
    );
    next();
  });

  app.get(
    "/api/orders",
    [authJwt.verifyToken],
    controller.findAll
  );

  app.post(
    "/api/orders",
    [authJwt.verifyToken, authJwt.isCustomer],
    (req, res, next) => {
      upload.single('waybill')(req, res, (err) => {
        if (err instanceof multer.MulterError) {
          return res.status(400).json({ message: 'Ошибка при загрузке файла: ' + err.message });
        } else if (err) {
          return res.status(400).json({ message: err.message });
        }
        next();
      });
    },
    controller.create
  );

  app.patch(
    "/api/orders/:orderId/status",
    [authJwt.verifyToken],
    controller.updateStatus
  );

  app.put(
    "/api/orders/:orderId",
    [authJwt.verifyToken, authJwt.isCustomer],
    (req, res, next) => {
      upload.single('waybill')(req, res, (err) => {
        if (err instanceof multer.MulterError) {
          return res.status(400).json({ message: 'Ошибка при загрузке файла: ' + err.message });
        } else if (err) {
          return res.status(400).json({ message: err.message });
        }
        next();
      });
    },
    controller.update
  );

  // Обновляем права доступа для обновления статуса заказа
  app.put(
    "/api/orders/:orderId/status",
    [authJwt.verifyToken, authJwt.hasRole(['driver', 'dispatcher'])],
    controller.updateOrderStatus
  );

  // Добавляем маршруты для чата
  app.get(
    "/api/orders/:orderId/messages",
    [authJwt.verifyToken, authJwt.hasRole(['customer', 'driver', 'dispatcher'])],
    chatController.getMessages
  );

  app.post(
    "/api/orders/:orderId/messages",
    [authJwt.verifyToken, authJwt.hasRole(['customer', 'driver'])],
    (req, res, next) => {
      upload.single('file')(req, res, (err) => {
        if (err instanceof multer.MulterError) {
          console.error('Ошибка multer:', err);
          return res.status(400).json({ 
            message: 'Ошибка при загрузке файла: ' + err.message,
            details: err
          });
        } else if (err) {
          console.error('Другая ошибка при загрузке:', err);
          return res.status(400).json({ 
            message: err.message,
            details: err
          });
        }
        next();
      });
    },
    chatController.sendMessage
  );

  app.put(
    "/api/orders/:orderId/chat-active",
    [authJwt.verifyToken, authJwt.hasRole(['customer', 'driver'])],
    chatController.toggleChatActive
  );

  // Добавляем новый маршрут для отметки сообщений как прочитанных
  app.put(
    "/api/orders/:orderId/messages/read",
    [authJwt.verifyToken],
    chatController.markMessagesAsRead
  );
}; 