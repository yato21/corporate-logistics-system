const { Server } = require('socket.io');

function setupSocketIO(server) {
  const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:3000';
  const io = new Server(server, {
    cors: {
      origin: CLIENT_URL,
      methods: ["GET", "POST"],
      credentials: true
    },
    path: '/socket.io'
  });

  // Аутентификация через middleware
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication error'));
    }
    // Здесь можно добавить проверку токена
    next();
  });

  io.on('connection', (socket) => {
    console.log('Новое Socket.IO соединение установлено');

    // Подписка на комнаты чатов заказов
    socket.on('joinOrderChat', (orderId) => {
      const roomName = `order_chat_${orderId}`;
      // Проверяем, подписан ли уже сокет на эту комнату
      if (!socket.rooms.has(roomName)) {
        socket.join(roomName);
        console.log(`Пользователь присоединился к чату заказа ${orderId}`);
      }
    });
    
    // Отписка от комнаты чата заказа
    socket.on('leaveOrderChat', (orderId) => {
      socket.leave(`order_chat_${orderId}`);
      console.log(`Пользователь покинул чат заказа ${orderId}`);
    });

    // Обработка нового сообщения в чате
    socket.on('chat_message', (data) => {
      // Отправка сообщения только участникам конкретного чата заказа
      io.to(`order_chat_${data.orderId}`).emit('chat_message', data);
      console.log(`Сообщение отправлено в чат заказа ${data.orderId}`);
    });

    socket.on('disconnect', () => {
      console.log('Socket.IO соединение закрыто');
    });

    socket.on('error', (error) => {
      console.error('Socket.IO ошибка:', error);
    });
  });

  return io;
}

module.exports = setupSocketIO; 