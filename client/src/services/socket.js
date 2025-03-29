import { io } from 'socket.io-client';

class SocketService {
  constructor() {
    this.socket = null;
    this.store = null;
  }

  setStore(store) {
    this.store = store;
  }

  connect() {
    if (this.socket?.connected) return;

    const token = localStorage.getItem('token');
    const SOCKET_URL = process.env.NODE_ENV === 'production' 
      ? '' // В продакшне используем относительный путь
      : (process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000');
    
    this.socket = io(SOCKET_URL, {
      path: '/socket.io',
      auth: { token },
      reconnection: true,
      reconnectionDelay: 3000,
      reconnectionAttempts: 5,
      transports: ['websocket', 'polling'] // Явно указываем транспорты
    });

    this.socket.on('connect', () => {
      console.log('Socket.IO соединение установлено');
    });

    this.socket.on('disconnect', () => {
      console.log('Socket.IO соединение закрыто');
    });

    this.socket.on('error', (error) => {
      console.error('Socket.IO ошибка:', error);
    });

    this.socket.on('orderUpdate', (data) => {
      if (!this.store) return;
      
      if (data.payload && data.type) {
        console.log('Получено socket-обновление:', data);
        
        this.store.dispatch({
          type: `orders/${data.type}`,
          payload: data.payload
        });

        // Проверяем, что обновление применилось
        const state = this.store.getState();
        const updatedOrder = state.orders.items.find(order => order.id === data.payload.id);
        console.log('Состояние заказа после обновления:', updatedOrder);
      } else {
        console.error('Получены некорректные данные:', data);
      }
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  emit(event, data) {
    if (this.socket?.connected) {
      this.socket.emit(event, data);
    }
  }
}

const socketService = new SocketService();
export default socketService; 