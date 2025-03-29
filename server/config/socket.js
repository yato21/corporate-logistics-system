const { Server } = require('socket.io');

function setupSocketIO(server) {
  const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:3000';
  const BASE_API_PATH = process.env.BASE_API_PATH || '';
  const SOCKET_PATH = process.env.SOCKET_PATH || '/socket.io';

  const io = new Server(server, {
    cors: {
      origin: CLIENT_URL,
      methods: ["GET", "POST"],
      credentials: true
    },
    path: SOCKET_PATH,
    allowEIO3: true,
    transports: ['websocket', 'polling']
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