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

// Метод для прямого скачивания тоже добавим логи
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
      console.log('Документ не найден в БД для файла:', filename);
      return res.status(404).send({ message: "Документ не найден в БД" });
    }

    console.log('Данные документа из БД:', {
      id: doc.id,
      filePath: doc.filePath,
      originalName: doc.originalName,
      mimeType: doc.mimeType
    });

    console.log('Начинаем отправку файла...');
    res.download(filePath, doc.originalName, (err) => {
      if (err) {
        console.error('Ошибка при скачивании:', err);
        console.error('Стек ошибки:', err.stack);
        if (!res.headersSent) {
          res.status(500).send({ message: "Ошибка при скачивании файла" });
        }
      } else {
        console.log('Файл успешно отправлен');
      }
    });

  } catch (error) {
    console.error('\n!!! Ошибка в downloadDirect !!!');
    console.error('Время:', new Date().toISOString());
    console.error('Ошибка:', error);
    console.error('Стек:', error.stack);
    res.status(500).send({
      message: "Ошибка при скачивании файла"
    });
  }
}; 