require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const setupSocketIO = require('./config/socket');
const path = require('path');
const fs = require('fs');
const { requestLogger } = require('./middleware');
const { authJwt } = require('./middleware');
const db = require('./models');

const app = express();
const server = http.createServer(app);
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:3000';

// Настройка CORS
app.use(cors({
  origin: CLIENT_URL,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Content-Disposition', 'Content-Type', 'Content-Length'],
  credentials: true
}));

// Добавляем обработку OPTIONS запросов
app.options('*', cors());

app.use(express.json({limit: '50mb'}));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Добавляем глобальное логирование
app.use(requestLogger);

// Добавляем статическую раздачу файлов с проверкой токена
app.get('/uploads/:filename', authJwt.verifyToken, async (req, res) => {
  try {
    console.log('Запрос на скачивание файла:', {
      filename: req.params.filename,
      headers: req.headers
    });

    const filePath = path.join(__dirname, 'uploads', req.params.filename);
    
    if (!fs.existsSync(filePath)) {
      console.log('Файл не найден:', filePath);
      return res.status(404).json({ message: "Файл не найден" });
    }

    const doc = await db.document.findOne({
      where: { filePath: req.params.filename }
    });

    if (!doc) {
      console.log('Документ не найден в БД');
      return res.status(404).json({ message: "Документ не найден в БД" });
    }

    const stats = fs.statSync(filePath);

    // Отправляем файл напрямую
    res.sendFile(filePath, {
      headers: {
        'Content-Type': doc.mimeType,
        'Content-Length': stats.size,
        'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(doc.originalName)}`
      }
    });

  } catch (error) {
    console.error('Ошибка при отправке файла:', error);
    res.status(500).json({ message: "Ошибка при отправке файла" });
  }
});

// Специальный маршрут для отображения изображений (без скачивания)
app.get('/uploads/view/:filename', authJwt.verifyToken, async (req, res) => {
  try {
    console.log('Запрос на просмотр изображения:', {
      filename: req.params.filename,
      headers: req.headers
    });

    const filePath = path.join(__dirname, 'uploads', req.params.filename);
    
    if (!fs.existsSync(filePath)) {
      console.log('Файл не найден:', filePath);
      return res.status(404).json({ message: "Файл не найден" });
    }

    const doc = await db.document.findOne({
      where: { filePath: req.params.filename }
    });

    if (!doc) {
      console.log('Документ не найден в БД');
      return res.status(404).json({ message: "Документ не найден в БД" });
    }

    // Проверяем, является ли файл изображением
    const isImage = doc.mimeType && doc.mimeType.startsWith('image/');
    
    // Отправляем файл с правильным Content-Type, но без заголовка Content-Disposition для просмотра
    res.sendFile(filePath, {
      headers: {
        'Content-Type': doc.mimeType,
        'Content-Length': fs.statSync(filePath).size,
      }
    });

  } catch (error) {
    console.error('Ошибка при отправке изображения:', error);
    res.status(500).json({ message: "Ошибка при отправке изображения" });
  }
});

const io = setupSocketIO(server);
app.set('io', io);

// Создаем директорию uploads если её нет
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Подключаем маршруты
require('./routes/auth.routes')(app);
require('./routes/user.routes')(app);
require('./routes/order.routes')(app);
require('./routes/document.routes')(app);
require('./routes/dispatcher.routes')(app);

// Запуск сервера
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`);
  console.log('Зарегистрированные маршруты:');
  app._router.stack.forEach(r => {
    if (r.route && r.route.path) {
      console.log(`${Object.keys(r.route.methods).join(', ').toUpperCase()}: ${r.route.path}`);
    }
  });
}); 