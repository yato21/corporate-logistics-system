import { createSlice, createAsyncThunk, createSelector } from '@reduxjs/toolkit';
import axiosInstance from '../../utils/axios';

// Мемоизированные селекторы
export const selectChatMessages = createSelector(
  [(state) => state.chat.messages, (_, orderId) => orderId],
  (messages, orderId) => messages[orderId] || []
);

export const selectUnreadMessages = createSelector(
  [(state) => state.chat.messages, (_, orderId) => orderId, (state) => state.auth.user?.id],
  (messages, orderId, userId) => {
    const orderMessages = messages[orderId] || [];
    return orderMessages.filter(msg => !msg.isRead && msg.sender.id !== userId).length;
  }
);

// Асинхронный запрос для получения сообщений
export const fetchChatMessages = createAsyncThunk(
  'chat/fetchMessages',
  async (orderId) => {
    const response = await axiosInstance.get(`/orders/${orderId}/messages`);
    return response.data;
  }
);

// Асинхронный запрос для отправки сообщения
export const sendChatMessage = createAsyncThunk(
  'chat/sendMessage',
  async ({ orderId, formData }, { rejectWithValue }) => {
    try {
      console.log('Отправка сообщения. OrderID:', orderId);
      
      // Проверяем, что formData содержит необходимые данные
      if (!(formData.get('message') || formData.get('file'))) {
        throw new Error('Сообщение должно содержать текст или файл');
      }
      
      const response = await axiosInstance.post(
        `/orders/${orderId}/messages`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      return response.data;
    } catch (error) {
      console.error('Ошибка при отправке сообщения:', error);
      
      const errorMessage = error.response?.data?.message || 
                         error.message || 
                         'Произошла ошибка при отправке сообщения';
                         
      return rejectWithValue(errorMessage);
    }
  }
);

// Асинхронный запрос для активации/деактивации чата
export const toggleChatActive = createAsyncThunk(
  'chat/toggleActive',
  async ({ orderId, active }) => {
    const response = await axiosInstance.put(`/orders/${orderId}/chat-active`, { active });
    return response.data;
  }
);

// Асинхронный запрос для отметки сообщений как прочитанных
export const markMessagesAsRead = createAsyncThunk(
  'chat/markAsRead',
  async (orderId) => {
    const response = await axiosInstance.put(`/orders/${orderId}/messages/read`);
    return { orderId, ...response.data };
  }
);

const chatSlice = createSlice({
  name: 'chat',
  initialState: {
    messages: {},  // Объект с ключами orderId и значениями в виде массивов сообщений
    loading: false,
    error: null,
    activeChats: {} // Объект с ключами orderId и значениями boolean
  },
  reducers: {
    // Редуктор для добавления нового сообщения из Socket
    NEW_CHAT_MESSAGE: (state, action) => {
      const { orderId, message } = action.payload;
      
      if (!state.messages[orderId]) {
        state.messages[orderId] = [];
      }
      
      // Проверяем, не существует ли уже сообщение с таким ID
      const messageExists = state.messages[orderId].some(
        existingMsg => existingMsg.id === message.id
      );
      
      // Добавляем сообщение только если оно не существует
      if (!messageExists) {
        state.messages[orderId].push(message);
      }
    },
    
    // Открытие и закрытие чата в UI
    setActiveChatUI: (state, action) => {
      const { orderId, active } = action.payload;
      state.activeChats[orderId] = active;
    },
    
    // Отметка сообщений как прочитанных
    MESSAGES_READ: (state, action) => {
      const { orderId, readByUserId } = action.payload;
      
      if (!state.messages[orderId]) return;
      
      // Помечаем сообщения как прочитанные
      state.messages[orderId] = state.messages[orderId].map(msg => {
        // Если отправитель - текущий пользователь, сообщение уже помечено как прочитанное
        if (msg.sender.id === readByUserId) return msg;
        
        // Иначе помечаем сообщение как прочитанное
        return { ...msg, isRead: true };
      });
    }
  },
  extraReducers: (builder) => {
    builder
      // Обработка запроса историй сообщений
      .addCase(fetchChatMessages.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchChatMessages.fulfilled, (state, action) => {
        const { orderId, messages } = action.payload;
        state.messages[orderId] = messages;
        state.loading = false;
      })
      .addCase(fetchChatMessages.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      
      // Обработка отправки сообщения - модифицируем для предотвращения дублирования
      .addCase(sendChatMessage.fulfilled, (state, action) => {
        const message = action.payload;
        const orderId = message.orderId;
        
        if (!state.messages[orderId]) {
          state.messages[orderId] = [];
        }
        
        // Проверяем, не существует ли уже сообщение с таким ID
        const messageExists = state.messages[orderId].some(
          existingMsg => existingMsg.id === message.id
        );
        
        // Добавляем сообщение только если оно не существует
        if (!messageExists) {
          state.messages[orderId].push(message);
        }
      })
      
      // Обработка активации/деактивации чата
      .addCase(toggleChatActive.fulfilled, (state, action) => {
        const { id: orderId, chatActive } = action.payload;
        state.activeChats[orderId] = chatActive;
      })
      
      // Обработка отметки сообщений как прочитанных
      .addCase(markMessagesAsRead.fulfilled, (state, action) => {
        const { orderId } = action.payload;
        
        if (!state.messages[orderId]) return;
        
        // Отмечаем все сообщения в этом чате как прочитанные
        state.messages[orderId] = state.messages[orderId].map(msg => ({
          ...msg,
          isRead: true
        }));
      });
  }
});

export const { NEW_CHAT_MESSAGE, setActiveChatUI, MESSAGES_READ } = chatSlice.actions;
export default chatSlice.reducer; 