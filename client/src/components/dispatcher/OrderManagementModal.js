import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { updateOrderStatus } from '../../redux/slices/orderSlice';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DateTimePicker, TimePicker } from '@mui/x-date-pickers';
import dayjs from 'dayjs';
import 'dayjs/locale/ru';
import axiosInstance from '../../utils/axios';
import TimePickerWidget, { TIME_CONSTRAINTS } from '../common/TimePickerWidget/TimePickerWidget';
import Modal from '../common/Modal/Modal';

dayjs.locale('ru');

const OrderManagementModal = ({ order: initialOrder, onClose }) => {
  const [order, setOrder] = useState(initialOrder);
  const orders = useSelector(state => state.orders.items);
  const dispatch = useDispatch();
  const [selectedDriver, setSelectedDriver] = useState(order.driverId || '');
  const [selectedVehicle, setSelectedVehicle] = useState(order.assignedTransportId || '');
  
  // Обновляем инициализацию времени начала
  const [startTime, setStartTime] = useState(() => {
    // Если в заказе есть route.dateTime, используем его
    const orderDateTime = order.route?.dateTime ? dayjs(order.route.dateTime) : null;
    
    // Если есть время в заказе и оно валидное, используем его
    if (orderDateTime && orderDateTime.isValid()) {
      return orderDateTime;
    }
    
    // Иначе используем текущее время + 10 минут
    const now = dayjs();
    const minDateTime = now.add(10, 'minutes');
    const currentMinute = minDateTime.minute();
    const roundedMinutes = Math.ceil(currentMinute / 10) * 10;
    
    if (roundedMinutes <= 50) {
      return minDateTime.minute(roundedMinutes);
    } else {
      return minDateTime.add(1, 'hour').minute(0);
    }
  });

  // Обновляем инициализацию времени окончания
  const [endTime, setEndTime] = useState(() => {
    // Если в заказе есть route.estimatedEndTime, используем его
    const orderEndTime = order.route?.estimatedEndTime ? 
      dayjs(order.route.estimatedEndTime) : null;
    
    // Если есть время окончания в заказе и оно валидное, используем его
    if (orderEndTime && orderEndTime.isValid()) {
      return orderEndTime;
    }
    
    // Иначе вычисляем время окончания от времени начала + 1 час
    const endDateTime = startTime.add(1, 'hour');
    const endMinutes = endDateTime.minute();
    
    if (endMinutes <= 40) {
      return endDateTime.minute(Math.ceil(endMinutes / 10) * 10);
    } else {
      return endDateTime.add(1, 'hour').minute(0);
    }
  });

  const [drivers, setDrivers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDriversAndVehicles();
  }, [startTime, endTime]);

  useEffect(() => {
    const updatedOrder = orders.find(o => o.id === initialOrder.id);
    if (updatedOrder) {
      setOrder(updatedOrder);
    }
  }, [orders, initialOrder.id]);

  const fetchDriversAndVehicles = async () => {
    try {
      setLoading(true);
      const [driversResponse, vehiclesResponse] = await Promise.all([
        axiosInstance.get('/available-drivers', {
          params: {
            startTime: startTime.toISOString(),
            endTime: endTime.toISOString()
          }
        }),
        axiosInstance.get('/available-transport', {
          params: {
            startTime: startTime.toISOString(),
            endTime: endTime.toISOString(),
            vehicleTypeId: order.vehicleType?.id
          }
        })
      ]);

      setDrivers(driversResponse.data);
      setVehicles(vehiclesResponse.data);
    } catch (error) {
      console.error('Ошибка при загрузке данных:', error);
      setError('Ошибка при загрузке доступных водителей и транспорта');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);

      console.log('Отправка данных для обновления заказа:', {
        orderId: order.id,
        status: 'assigned',
        driverId: selectedDriver,
        assignedTransportId: selectedVehicle,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString()
      });

      await dispatch(updateOrderStatus({
        orderId: order.id,
        status: 'assigned',
        driverId: selectedDriver,
        assignedTransportId: selectedVehicle,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString()
      })).unwrap();

      console.log('Заказ успешно обновлен');
      onClose();
    } catch (error) {
      console.error('Ошибка при обновлении заказа:', error);
      setError(error.response?.data?.message || 'Ошибка при обновлении заказа');
    } finally {
      setLoading(false);
    }
  };

  const validateAndCorrectDateTime = (newValue) => {
    if (!newValue || !newValue.isValid()) {
      return startTime;
    }

    let validDateTime = newValue;
    
    // Округляем минуты до ближайшего десятка
    const currentMinute = validDateTime.minute();
    const roundedMinutes = Math.ceil(currentMinute / 10) * 10;

    if (roundedMinutes <= 50) {
      validDateTime = validDateTime.minute(roundedMinutes);
    } else {
      validDateTime = validDateTime.add(1, 'hour').minute(0);
    }

    // Проверяем рабочие часы
    const hour = validDateTime.hour();
    if (hour < 8) {
      validDateTime = validDateTime.hour(8).minute(0);
    } else if (hour >= 17) {
      validDateTime = validDateTime.add(1, 'day').hour(8).minute(0);
    }

    return validDateTime;
  };

  const handleStartTimeChange = (newValue) => {
    setStartTime(newValue);
    setError(null);
  };

  // Обновляем функцию для обработки изменения времени окончания
  const handleEndTimeChange = (newValue) => {
    // Берем дату из времени начала, а время из выбранного значения
    const updatedEndTime = startTime.hour(newValue.hour()).minute(newValue.minute());
    setEndTime(updatedEndTime);
  };

  const validateEndTime = (endTime) => {
    if (!endTime || !endTime.isValid()) {
      return endTime;
    }

    let validDateTime = endTime;
    const minEndTime = startTime.add(10, 'minutes');
    const maxEndTime = dayjs().hour(17).minute(0);

    // Проверяем минимальное время (время начала + 10 минут)
    if (validDateTime.isBefore(minEndTime)) {
      validDateTime = minEndTime;
    }

    // Округляем минуты до ближайшего десятка
    const currentMinute = validDateTime.minute();
    const roundedMinutes = Math.ceil(currentMinute / 10) * 10;

    if (roundedMinutes <= 50) {
      validDateTime = validDateTime.minute(roundedMinutes);
    } else {
      validDateTime = validDateTime.add(1, 'hour').minute(0);
    }

    // Проверяем, не превышает ли время 17:00
    if (validDateTime.hour() > 17 || (validDateTime.hour() === 17 && validDateTime.minute() > 0)) {
      validDateTime = validDateTime.hour(17).minute(0);
    }

    return validDateTime;
  };

  return (
    <Modal isOpen onClose={onClose}>
      <div className="order-management-modal">
        <h2>Управление заказом #{order.id}</h2>
        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="ru">
            <div className="form-group">
              <label>Время начала:</label>
              <DateTimePicker
                value={startTime}
                onChange={handleStartTimeChange}
                className="datetime-picker"
                format="DD.MM.YYYY HH:mm"
                minDateTime={dayjs()}
                views={['year', 'month', 'day', 'hours', 'minutes']}
                viewRenderers={{
                  hours: () => (
                    <TimePickerWidget
                      type="start"
                      selectedHour={startTime.hour()}
                      selectedMinute={startTime.minute()}
                      onHourChange={(hour) => {
                        const newDate = startTime.hour(hour);
                        handleStartTimeChange(newDate);
                      }}
                      onMinuteChange={(minute) => {
                        const newDate = startTime.minute(minute);
                        handleStartTimeChange(newDate);
                      }}
                      constraints={{
                        ...TIME_CONSTRAINTS.BUSINESS_HOURS,
                        minDateTime: dayjs()
                      }}
                      selectedDate={startTime}
                      referenceTime={dayjs()}
                    />
                  )
                }}
                slotProps={{
                  textField: {
                    variant: "outlined",
                    fullWidth: true,
                    error: !!error && error.includes('прошедшую дату'),
                    required: true,
                    onBlur: () => {
                      if (startTime && startTime.isValid()) {
                        const validDateTime = validateAndCorrectDateTime(startTime);
                        setStartTime(validDateTime);
                      }
                    },
                    onKeyDown: (e) => {
                      if (e.key === 'Enter' && startTime && startTime.isValid()) {
                        const validDateTime = validateAndCorrectDateTime(startTime);
                        setStartTime(validDateTime);
                      }
                    }
                  }
                }}
              />
            </div>

            <div className="form-group">
              <label>Время окончания:</label>
              <TimePicker
                value={endTime}
                onChange={(newValue) => {
                  setEndTime(newValue);
                }}
                className="datetime-picker"
                format="HH:mm"
                views={['hours', 'minutes']}
                viewRenderers={{
                  hours: () => (
                    <TimePickerWidget
                      type="end"
                      selectedHour={endTime.hour()}
                      selectedMinute={endTime.minute()}
                      onHourChange={(hour) => {
                        const newTime = endTime.hour(hour);
                        handleEndTimeChange(newTime);
                      }}
                      onMinuteChange={(minute) => {
                        const newTime = endTime.minute(minute);
                        handleEndTimeChange(newTime);
                      }}
                      constraints={TIME_CONSTRAINTS.BUSINESS_HOURS}
                      referenceTime={startTime}
                      selectedDate={startTime}
                    />
                  )
                }}
                slotProps={{
                  textField: {
                    variant: "outlined",
                    fullWidth: true,
                    required: true,
                    onBlur: () => {
                      if (endTime && endTime.isValid()) {
                        const validEndTime = validateEndTime(endTime);
                        setEndTime(validEndTime);
                      }
                    },
                    onKeyDown: (e) => {
                      if (e.key === 'Enter' && endTime && endTime.isValid()) {
                        const validEndTime = validateEndTime(endTime);
                        setEndTime(validEndTime);
                      }
                    }
                  }
                }}
              />
            </div>
          </LocalizationProvider>

          <div className="form-group">
            <label>Водитель:</label>
            <select
              value={selectedDriver}
              onChange={(e) => setSelectedDriver(e.target.value)}
              required
            >
              <option value="">Выберите водителя</option>
              {drivers.map(driver => (
                <option key={driver.id} value={driver.id}>
                  {driver.fullName} ({driver.employeeId})
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Транспорт:</label>
            <select
              value={selectedVehicle}
              onChange={(e) => setSelectedVehicle(e.target.value)}
              required
            >
              <option value="">Выберите транспорт</option>
              {vehicles.map(vehicle => (
                <option key={vehicle.id} value={vehicle.id}>
                  {vehicle.vehicleType.name} - {vehicle.vehicleNumber}
                </option>
              ))}
            </select>
          </div>

          <div className="modal-actions">
            <button 
              type="button" 
              className="btn btn-secondary" 
              onClick={onClose}
              disabled={loading}
            >
              <i className="fas fa-times"></i>
              Отмена
            </button>
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={loading}
            >
              <i className="fas fa-check"></i>
              Сохранить
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
};

export default OrderManagementModal; 