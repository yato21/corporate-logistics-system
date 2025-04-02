const db = require("../models");
const Order = db.order;
const OrderMessage = db.orderMessage;
const User = db.user;
const Document = db.document;
const path = require('path');
const fs = require('fs');

// Проверим, правильно ли определены модели
console.log('Доступные модели:', Object.keys(db));

exports.getMessages = async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.userId;
    
    console.log(`Получение сообщений для заказа ID: ${orderId}, пользователь ID: ${userId}`);
    
    // Проверяем, что заказ существует
    const order = await Order.findByPk(orderId);
    if (!order) {
      return res.status(404).send({ message: "Заказ не найден" });
    }
    
    // Получаем сообщения для заказа
    const messages = await OrderMessage.findAll({
      where: { orderId: Number(orderId) },
      include: [
        {
          model: User,
          as: 'sender',
          attributes: ['id', 'fullName', 'role']
        },
        {
          model: Document,
          as: 'attachment',
          required: false,
          attributes: ['id', 'filePath', 'originalName', 'mimeType']
        }
      ],
      order: [['timestamp', 'ASC']]
    });
    
    // Преобразуем данные для отправки
    const formattedMessages = messages.map(msg => {
      const plainMsg = msg.get({ plain: true });
      
      // Упрощаем структуру сообщения и делаем безопасный доступ к свойствам
      return {
        id: plainMsg.id,
        message: plainMsg.message || '',
        timestamp: plainMsg.timestamp,
        isRead: plainMsg.isRead || false,
        isOwnMessage: plainMsg.senderId === userId,
        sender: plainMsg.sender || { id: null, fullName: 'Неизвестный', role: null },
        
        // Проверяем наличие вложения и обрабатываем его
        file: plainMsg.attachment && plainMsg.attachment.length > 0 
          ? {
              id: plainMsg.attachment[0].id,
              filePath: plainMsg.attachment[0].filePath,
              originalName: plainMsg.attachment[0].originalName,
              mimeType: plainMsg.attachment[0].mimeType || 'application/octet-stream'
            } 
          : null
      };
    });
    
    res.send({
      orderId: Number(orderId),
      messages: formattedMessages
    });
  } catch (error) {
    console.error('Ошибка в контроллере getMessages:', error);
    res.status(500).send({
      message: "Произошла ошибка при получении сообщений",
      error: error.message,
      stack: error.stack
    });
  }
};

exports.sendMessage = async (req, res) => {
  try {
    console.log('Начало обработки сообщения');
    const { orderId } = req.params;
    const { message } = req.body;
    const userId = req.userId;
    
    console.log(`Отправка сообщения для заказа ID: ${orderId}, пользователь ID: ${userId}`);
    console.log('Тело запроса:', req.body);
    
    if (req.file) {
      console.log('Информация о файле:', {
        originalname: req.file.originalname,
        filename: req.file.filename,
        mimetype: req.file.mimetype,
        size: req.file.size
      });
    } else {
      console.log('Файл не был загружен');
    }
    
    // Если нет текста сообщения и нет файла, возвращаем ошибку
    if ((!message || !message.trim()) && !req.file) {
      return res.status(400).send({ message: "Сообщение должно содержать текст или файл" });
    }
    
    // Проверяем, что заказ существует
    const order = await Order.findByPk(orderId);
    if (!order) {
      return res.status(404).send({ message: "Заказ не найден" });
    }
    
    // Создаем сообщение
    const newMessage = await OrderMessage.create({
      orderId: Number(orderId),
      senderId: userId,
      message: message ? message.trim() : '',
      timestamp: new Date(),
      isRead: false,
      hasFile: !!req.file // Флаг для отметки, что сообщение содержит файл
    });
    
    let fileData = null;
    
    // Если был загружен файл, сохраняем информацию о нем
    if (req.file) {
      const document = await Document.create({
        orderId: Number(orderId),
        messageId: newMessage.id,
        type: 'attachment',
        filePath: req.file.filename,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype
      });
      
      fileData = {
        id: document.id,
        filePath: document.filePath,
        originalName: document.originalName,
        mimeType: document.mimeType
      };
    }
    
    // Получаем данные отправителя
    const sender = await User.findByPk(userId, {
      attributes: ['id', 'fullName', 'role']
    });
    
    // Формируем полные данные сообщения для отправки
    const formattedMessage = {
      id: newMessage.id,
      orderId: Number(orderId),
      message: newMessage.message,
      timestamp: newMessage.timestamp,
      isRead: false,
      isOwnMessage: true,
      sender: sender.get({ plain: true }),
      file: fileData
    };
    
    // Отправляем уведомление через Socket.IO
    const io = req.app.get('io');
    io.to(`order_chat_${orderId}`).emit('chat_message', {
      type: 'NEW_CHAT_MESSAGE',
      payload: {
        orderId: Number(orderId),
        message: {
          ...formattedMessage,
          isOwnMessage: false // Для других пользователей это не их сообщение
        }
      }
    });
    
    // Отправляем ответ клиенту
    res.status(201).send(formattedMessage);
  } catch (error) {
    console.error('Ошибка при отправке сообщения:', error);
    res.status(500).send({
      message: "Произошла ошибка при отправке сообщения",
      error: error.message,
      stack: error.stack
    });
  }
};

exports.toggleChatActive = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { active } = req.body;
    const userId = req.userId;
    
    // Проверяем, что заказ существует и пользователь имеет к нему доступ
    const order = await Order.findByPk(orderId);
    if (!order) {
      return res.status(404).send({ message: "Заказ не найден" });
    }
    
    if (order.customerId !== userId && order.driverId !== userId) {
      return res.status(403).send({ message: "У вас нет доступа к этому заказу" });
    }
    
    // Обновляем статус чата
    await order.update({ chatActive: !!active });
    
    // Получаем обновленный заказ
    const updatedOrder = await Order.findByPk(orderId);
    
    // Отправляем уведомление через Socket.IO
    const io = req.app.get('io');
    io.emit('orderUpdate', {
      type: 'ORDER_UPDATED',
      payload: updatedOrder
    });
    
    res.send(updatedOrder);
  } catch (error) {
    console.error('Ошибка при изменении статуса чата:', error);
    res.status(500).send({
      message: "Произошла ошибка при изменении статуса чата",
      error: error.message
    });
  }
};

// Добавляем новый метод для отметки сообщений как прочитанных
exports.markMessagesAsRead = async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.userId;
    
    console.log(`Отметка сообщений как прочитанных для заказа ID: ${orderId}, пользователь ID: ${userId}`);
    
    // Проверяем, что заказ существует
    const order = await Order.findByPk(orderId);
    if (!order) {
      return res.status(404).send({ message: "Заказ не найден" });
    }
    
    // Находим все непрочитанные сообщения, отправленные НЕ текущим пользователем
    const unreadMessages = await OrderMessage.findAll({
      where: {
        orderId: Number(orderId),
        senderId: { [db.Sequelize.Op.ne]: userId }, // сообщения от других пользователей
        isRead: false
      }
    });
    
    // Отмечаем сообщения как прочитанные
    const updatePromises = unreadMessages.map(msg => 
      msg.update({ isRead: true })
    );
    
    await Promise.all(updatePromises);
    
    // Отправляем уведомление через Socket.IO о прочитанных сообщениях
    const io = req.app.get('io');
    io.to(`order_chat_${orderId}`).emit('chat_messages_read', {
      orderId: Number(orderId),
      readByUserId: userId
    });
    
    res.send({ message: `${unreadMessages.length} сообщений отмечены как прочитанные` });
  } catch (error) {
    console.error('Ошибка при отметке сообщений как прочитанных:', error);
    res.status(500).send({
      message: "Произошла ошибка при отметке сообщений",
      error: error.message
    });
  }
}; 