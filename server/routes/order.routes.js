const { authJwt } = require("../middleware");
const controller = require("../controllers/order.controller");
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, '..', 'uploads');
    console.log('Путь для сохранения:', uploadPath);
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    // Сохраняем с уникальным именем, оригинальное имя сохраним в БД
    const uniqueName = `${Date.now()}-${Math.random().toString(36).substring(7)}`;
    const ext = path.extname(file.originalname);
    const filename = uniqueName + ext;
    console.log('Сгенерированное имя файла:', filename);
    cb(null, filename);
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  },
  fileFilter: function (req, file, cb) {
    // Сохраняем оригинальное имя файла в request
    file.originalname = Buffer.from(file.originalname, 'latin1').toString('utf8');
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(file.mimetype)) {
      cb(new Error('Неподдерживаемый формат файла'));
      return;
    }
    cb(null, true);
  }
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
}; 