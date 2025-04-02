import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance from '../../utils/axios';

export const fetchOrders = createAsyncThunk(
  'orders/fetchOrders',
  async () => {
    const response = await axiosInstance.get('/orders');
    return response.data;
  }
);

export const createOrder = createAsyncThunk(
  'orders/createOrder',
  async (orderData) => {
    const formData = new FormData();
    
    formData.append('vehicleTypeId', orderData.vehicleTypeId);
    formData.append('customerId', orderData.customerId);
    
    // Добавляем данные заказчика
    formData.append('customerName', orderData.customerInfo.fullName);
    formData.append('customerPhone', orderData.customerInfo.contact);
    formData.append('customerPosition', orderData.customerInfo.position);
    formData.append('customerDepartment', orderData.customerInfo.subdivision);
    formData.append('customerEmail', orderData.customerInfo.email);
    
    // Добавляем данные маршрута с временем окончания
    if (orderData.route) {
      const routeData = {
        startPoint: orderData.route.startPoint,
        endPoints: orderData.route.endPoints,
        dateTime: orderData.route.dateTime,
        estimatedEndTime: orderData.route.estimatedEndTime
      };
      formData.append('route', JSON.stringify(routeData));
    }
    
    // Добавляем комментарий, если есть
    if (orderData.comment) {
      formData.append('comment', orderData.comment);
    }
    
    // Добавляем файл накладной, если есть
    if (orderData.documents?.waybill) {
      formData.append('waybill', orderData.documents.waybill);
    }
    
    const response = await axiosInstance.post('/orders', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  }
);

export const updateOrderStatus = createAsyncThunk(
  'orders/updateOrderStatus',
  async (orderData) => {
    const response = await axiosInstance.put(`/orders/${orderData.orderId}/status`, orderData);
    return response.data;
  }
);

export const updateOrder = createAsyncThunk(
  'orders/updateOrder',
  async ({ orderId, orderData }, { rejectWithValue }) => {
    try {
      // Проверяем, что orderData это FormData
      if (!(orderData instanceof FormData)) {
        // Если это не FormData, создаем новый FormData
        const formData = new FormData();
        
        // Добавляем основные поля
        formData.append('vehicleTypeId', orderData.vehicleTypeId);
        formData.append('customerId', orderData.customerId);
        
        // Добавляем данные заказчика
        if (orderData.customerInfo) {
          formData.append('customerName', orderData.customerInfo.fullName);
          formData.append('customerPhone', orderData.customerInfo.contact);
          formData.append('customerPosition', orderData.customerInfo.position);
          formData.append('customerDepartment', orderData.customerInfo.subdivision);
          formData.append('customerEmail', orderData.customerInfo.email);
        }
        
        // Добавляем маршрут
        if (orderData.route) {
          formData.append('route', JSON.stringify(orderData.route));
        }
        
        // Добавляем комментарий
        if (orderData.comment) {
          formData.append('comment', orderData.comment);
        }
        
        // Обрабатываем накладную
        if (orderData.documents?.waybill instanceof File) {
          formData.append('waybill', orderData.documents.waybill);
        } else if (orderData.documents?.removeWaybill) {
          formData.append('removeWaybill', 'true');
        }
        
        orderData = formData;
      }

      const response = await axiosInstance.put(`/orders/${orderId}`, orderData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const cancelOrder = createAsyncThunk(
  'orders/cancelOrder',
  async (orderId) => {
    const response = await axiosInstance.patch(`/orders/${orderId}/status`, {
      status: 'cancelled'
    });
    return response.data;
  }
);

const orderSlice = createSlice({
  name: 'orders',
  initialState: {
    items: [],
    loading: false,
    error: null,
  },
  reducers: {
    ORDER_CREATED: (state, action) => {
      if (action.payload && action.payload.id) {
        console.log('Добавление нового заказа:', action.payload);
        state.items.unshift(action.payload);
      } else {
        console.error('Получены некорректные данные заказа:', action.payload);
      }
    },
    
    ORDER_UPDATED: (state, action) => {
      if (action.payload && action.payload.id) {
        console.log('Обработка ORDER_UPDATED:', action.payload);
        const index = state.items.findIndex(item => item.id === action.payload.id);
        if (index !== -1) {
          // Сохраняем существующие документы, если они не переданы в обновлении
          const existingDocuments = state.items[index].documents || [];
          
          state.items[index] = {
            ...state.items[index],
            ...action.payload,
            // Если в обновлении есть информация о документах, используем её,
            // иначе оставляем существующие документы
            documents: action.payload.documents || existingDocuments
          };
          console.log('Заказ обновлен в store:', state.items[index]);
        }
      }
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchOrders.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchOrders.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchOrders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(updateOrder.fulfilled, (state, action) => {
        const index = state.items.findIndex(order => order.id === action.payload.id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
      })
      .addCase(updateOrderStatus.fulfilled, (state, action) => {
        console.log('updateOrderStatus.fulfilled:', action.payload);
        const index = state.items.findIndex(item => item.id === action.payload.id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
      })
      .addCase(updateOrderStatus.rejected, (state, action) => {
        console.error('Ошибка при обновлении статуса:', action.error);
      })
      .addCase('ORDER_CREATED', (state, action) => {
        const newOrder = action.payload;
        
        // Проверяем, что заказа еще нет в списке
        const orderExists = state.items.some(order => order.id === newOrder.id);
        
        // Добавляем только если его еще нет
        if (!orderExists) {
          state.items.push(newOrder);
        }
      });
  },
});

export const { ORDER_CREATED, ORDER_UPDATED } = orderSlice.actions;
export default orderSlice.reducer; 