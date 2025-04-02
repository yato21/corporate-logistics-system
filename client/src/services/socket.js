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
    if (this.socket?.connected) {
      console.log('Socket.IO уже подключен, повторное подключение не требуется');
      return;
    }

    console.log('Инициализация Socket.IO соединения');
    const token = localStorage.getItem('token');
    const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';
    
    try {
      this.socket = io(SOCKET_URL, {
        path: '/socket.io',
        auth: { token },
        reconnection: true,
        reconnectionDelay: 3000,
        reconnectionAttempts: 5
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
    } catch (error) {
      console.error('Ошибка при создании сокета:', error);
    }
  }

  disconnect() {
    if (this.socket) {
      try {
        this.socket.disconnect();
      } catch (error) {
        console.error('Ошибка при отключении сокета:', error);
      } finally {
        this.socket = null;
      }
    }
  }

  emit(event, data) {
    if (this.socket?.connected) {
      console.log(`Отправка события ${event}:`, data);
      this.socket.emit(event, data);
    } else {
      console.error(`Невозможно отправить событие ${event}, Socket.IO не подключен`);
    }
  }

  joinOrderChats(orderIds) {
    if (!this.socket?.connected) {
      console.error('Невозможно подписаться на чаты, Socket.IO не подключен');
      return;
    }
    
    if (Array.isArray(orderIds) && orderIds.length > 0) {
      console.log('Подписка на чаты заказов:', orderIds);
      
      // Подписываемся на каждый чат
      orderIds.forEach(orderId => {
        this.socket.emit('joinOrderChat', orderId);
      });
    }
  }
  
  // Добавляем безопасную версию off метода
  off(event, listener) {
    if (this.socket) {
      try {
        this.socket.off(event, listener);
      } catch (error) {
        console.error(`Ошибка при отписке от события ${event}:`, error);
      }
    }
  }
}

const socketService = new SocketService();
export default socketService; 