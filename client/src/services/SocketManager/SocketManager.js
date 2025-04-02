import React, { useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import socketService from '../socket';
import { ORDER_CREATED, ORDER_UPDATED } from '../../redux/slices/orderSlice';
import { NEW_CHAT_MESSAGE, MESSAGES_READ } from '../../redux/slices/chatSlice';

const SocketManager = () => {
  const dispatch = useDispatch();
  const orders = useSelector(state => state.orders.items);

  // Выносим useCallback на верхний уровень
  const handleOrderUpdate = useCallback((data) => {
    // Нормализация ордеров для нового диспетчера заказов
    if (data.type === 'ORDER_CREATED' || data.type === 'ORDER_UPDATED') {
      // Перед диспетчеризацией проверяем, существует ли уже заказ
      const orderExists = orders.some(order => order.id === data.payload.id);
      
      if (!orderExists || data.type === 'ORDER_UPDATED') {
        dispatch({
          type: data.type,
          payload: data.payload
        });
      }
    }
  }, [dispatch, orders]);

  // Обработчик сообщений чата также должен использовать useCallback
  const handleChatMessage = useCallback((data) => {
    if (data.type === 'NEW_CHAT_MESSAGE' && data.payload) {
      dispatch(NEW_CHAT_MESSAGE(data.payload));
    }
  }, [dispatch]);

  // Добавляем обработчик для события прочтения сообщений
  const handleMessagesRead = useCallback((data) => {
    dispatch(MESSAGES_READ(data));
  }, [dispatch]);

  useEffect(() => {
    // Подключаемся к Socket.IO
    socketService.connect();

    // Регистрируем обработчики событий
    socketService.socket.on('orderUpdate', handleOrderUpdate);
    socketService.socket.on('chat_message', handleChatMessage);
    socketService.socket.on('chat_messages_read', handleMessagesRead);

    // Подписываемся на чаты всех заказов пользователя
    if (orders.length > 0) {
      const orderIds = orders.map(order => order.id);
      socketService.joinOrderChats(orderIds);
    }

    // Отключаем обработчики при размонтировании
    return () => {
      if (socketService.socket) {
        socketService.off('orderUpdate', handleOrderUpdate);
        socketService.off('chat_message', handleChatMessage);
        socketService.off('chat_messages_read', handleMessagesRead);
      }
    };
  }, [dispatch, orders, handleOrderUpdate, handleChatMessage, handleMessagesRead]);

  return null;
};

export default SocketManager; 