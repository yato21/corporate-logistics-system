const path = require('path');
const fs = require('fs');
const db = require("../models");
const Document = db.document;

exports.download = async (req, res) => {
  try {
    const doc = await Document.findByPk(req.params.id);
    
    if (!doc) {
      return res.status(404).json({ message: "Документ не найден" });
    }

    // Перенаправляем на прямой URL файла
    res.redirect(`/uploads/${doc.filePath}`);

  } catch (error) {
    console.error('Ошибка при скачивании:', error);
    return res.status(500).json({ message: "Ошибка при скачивании документа" });
  }
};

// Метод для прямого скачивания
exports.downloadDirect = async (req, res) => {
  console.log('\n=== Начало выполнения downloadDirect ===');
  console.log('Время:', new Date().toISOString());
  try {
    console.log('Начало прямого скачивания, имя файла:', req.params.filename);
    
    const filename = req.params.filename;
    const filePath = path.join(__dirname, '..', 'uploads', filename);
    
    console.log('Полный путь к файлу:', filePath);
    
    if (!fs.existsSync(filePath)) {
      console.log('Файл не найден по пути:', filePath);
      return res.status(404).send({ message: "Файл не найден" });
    }

    const stats = fs.statSync(filePath);
    console.log('Информация о файле:', {
      размер: stats.size + ' байт',
      создан: stats.birthtime,
      изменен: stats.mtime
    });

    const doc = await Document.findOne({
      where: { filePath: filename }
    });

    if (!doc) {
      console.log('Документ не найден в базе данных');
      return res.status(404).send({ message: "Документ не найден в базе данных" });
    }

    // Улучшаем заголовки для правильной кодировки
    res.setHeader('Content-Type', `${doc.mimeType}`);
    // Используем RFC5987 для кодирования имени файла
    const encodedFilename = encodeURIComponent(doc.originalName)
      .replace(/['()]/g, escape) // Экранируем специальные символы 
      .replace(/\*/g, '%2A');
      
    // Отправляем в двух форматах для максимальной совместимости
    res.setHeader('Content-Disposition', 
      `attachment; filename="${encodedFilename}"; filename*=UTF-8''${encodedFilename}`);
    
    console.log('Отправка файла с улучшенными заголовками кодировки');
    console.log('Content-Disposition:', res.getHeader('Content-Disposition'));
    
    // Используем fs.createReadStream для отправки файла
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
    
    fileStream.on('error', (err) => {
      console.error('Ошибка потока чтения файла:', err);
      if (!res.headersSent) {
        res.status(500).send({ message: "Ошибка при чтении файла" });
      }
    });
    
    fileStream.on('end', () => {
      console.log('Файл успешно отправлен');
    });
    
  } catch (error) {
    console.error('\n!!! Ошибка в downloadDirect !!!');
    console.error('Ошибка:', error);
    res.status(500).send({
      message: "Ошибка при скачивании файла"
    });
  }
};

// Получение информации о документе по ID
exports.getDocument = async (req, res) => {
  try {
    const documentId = req.params.id;
    const document = await Document.findByPk(documentId);
    
    if (!document) {
      return res.status(404).send({ message: "Документ не найден" });
    }
    
    res.send(document);
  } catch (error) {
    console.error('Ошибка при получении документа:', error);
    res.status(500).send({
      message: "Произошла ошибка при получении документа",
      error: error.message
    });
  }
}; 