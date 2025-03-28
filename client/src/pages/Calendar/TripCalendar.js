import React, { useState, useEffect, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { updateOrder, fetchOrders } from '../../redux/slices/orderSlice';
import './TripCalendar.css';
import Modal from '../../components/common/Modal/Modal';
import TaskCard from '../../components/common/TaskCard/TaskCard';
import OrderWizard from '../../components/order/OrderWizard/OrderWizard';

const TripCalendar = () => {
  const dispatch = useDispatch();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState('month');
  const { user } = useSelector(state => state.auth);
  const { items: orders } = useSelector(state => state.orders);
  
  // Инициализируем selectedDay текущей датой
  const [selectedDay, setSelectedDay] = useState(() => {
    const today = new Date();
    return {
      date: today.getDate(),
      month: today.getMonth(),
      isCurrentMonth: true,
      isToday: true
    };
  });

  // Добавляем состояние для модального окна
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showEditOrder, setShowEditOrder] = useState(false);
  const [orderToEdit, setOrderToEdit] = useState(null);

  useEffect(() => {
    dispatch(fetchOrders());
  }, [dispatch]);

  // Фильтруем заказы в зависимости от роли пользователя
  const filteredOrders = useMemo(() => {
    if (!orders) return [];
    
    switch (user.role) {
      case 'driver':
        // Для водителя показываем только его заказы
        return orders.filter(order => order.driverId === user.id);
      case 'customer':
        // Для заказчика показываем только его заказы
        return orders.filter(order => order.customerId === user.id);
      default:
        return [];
    }
  }, [orders, user]);

  // eslint-disable-next-line no-unused-vars
  const events = useMemo(() => {
    return filteredOrders.map(order => ({
      id: order.id,
      title: `Заказ №${order.id}`,
      start: new Date(order.route?.dateTime),
      end: new Date(order.route?.estimatedEndTime),
      order: order,
      status: order.status
    }));
  }, [filteredOrders]);

  // Функция для получения дней месяца
  const getDaysInMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay() || 7;

    const days = [];
    // Добавляем дни предыдущего месяца
    const prevMonth = new Date(year, month, 0);
    const prevMonthDays = prevMonth.getDate();
    for (let i = startingDay - 2; i >= 0; i--) {
      days.push({
        date: prevMonthDays - i,
        month: month - 1,
        isCurrentMonth: false
      });
    }

    // Добавляем дни текущего месяца
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({
        date: i,
        month: month,
        isCurrentMonth: true,
        isToday: new Date().getDate() === i && 
                 new Date().getMonth() === month && 
                 new Date().getFullYear() === year
      });
    }

    // Добавляем дни следующего месяца
    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      days.push({
        date: i,
        month: month + 1,
        isCurrentMonth: false
      });
    }

    return days;
  };

  // Функция для получения дней недели
  const getWeekDays = () => {
    const curr = new Date(currentDate);
    const firstDay = curr.getDate() - curr.getDay() + 1;
    const days = [];

    for (let i = 0; i < 7; i++) {
      const day = new Date(curr.setDate(firstDay + i));
      days.push({
        date: day.getDate(),
        fullDate: day,
        isToday: new Date().toDateString() === day.toDateString()
      });
    }

    return days;
  };

  const handlePrevious = () => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (view === 'month') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setDate(prev.getDate() - 7);
      }
      return newDate;
    });
  };

  const handleNext = () => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (view === 'month') {
        newDate.setMonth(prev.getMonth() + 1);
      } else {
        newDate.setDate(prev.getDate() + 7);
      }
      return newDate;
    });
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const getHeaderText = () => {
    if (view === 'month') {
      return currentDate.toLocaleString('ru', { 
        month: 'long',
        year: 'numeric'
      });
    } else {
      const weekStart = new Date(currentDate);
      weekStart.setDate(currentDate.getDate() - currentDate.getDay() + 1);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);

      // Если неделя в пределах одного месяца
      if (weekStart.getMonth() === weekEnd.getMonth()) {
        return `${weekStart.getDate()}–${weekEnd.getDate()} ${weekStart.toLocaleString('ru', { month: 'long' })}`;
      } 
      // Если неделя на стыке месяцев
      else {
        return `${weekStart.getDate()} ${weekStart.toLocaleString('ru', { month: 'long' })} – ${weekEnd.getDate()} ${weekEnd.toLocaleString('ru', { month: 'long' })}`;
      }
    }
  };

  const handleDayClick = (day) => {
    setSelectedDay(day);
  };

  const formatSelectedDay = () => {
    if (!selectedDay) return '';
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), selectedDay.date);
    return date.toLocaleString('ru', { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long' 
    });
  };

  const isSelectedDay = (day) => {
    return selectedDay && 
           selectedDay.date === day.date && 
           selectedDay.month === day.month;
  };

  // eslint-disable-next-line no-unused-vars
  const getOrdersForDate = (date) => {
    return filteredOrders.filter(order => {
      if (!order.route?.dateTime) return false;
      const orderDate = new Date(order.route.dateTime);
      return orderDate.getDate() === date.getDate() &&
             orderDate.getMonth() === date.getMonth() &&
             orderDate.getFullYear() === date.getFullYear();
    });
  };

  // Добавляем функцию для получения времени из даты
  const getTimeFromDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('ru', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  // Обновим функцию для получения цвета статуса
  const getStatusColor = (status) => {
    const statusColors = {
      pending: 'var(--warning-color)',      // оранжевый
      assigned: '#9333EA',                  // фиолетовый
      in_progress: 'var(--primary-color)',  // синий
      completed: 'var(--success-color)'     // зеленый
    };
    return statusColors[status] || 'var(--gray-500)';
  };

  // eslint-disable-next-line no-unused-vars
  const renderWeekViewCell = (day, slot) => {
    const cellOrders = filteredOrders.filter(order => {
      if (!order.route?.dateTime || order.status === 'cancelled') return false;
      const orderTime = new Date(order.route.dateTime);
      const orderDate = new Date(
        currentDate.getFullYear(),
        day.month,
        day.date
      );

      return orderTime.getHours() === slot.hour &&
             orderTime.getDate() === orderDate.getDate() &&
             orderTime.getMonth() === orderDate.getMonth() &&
             orderTime.getFullYear() === orderDate.getFullYear();
    });

    return (
      <div key={`${day.date}-${slot.time}`} className="week-cell">
        {cellOrders.map(order => (
          <div 
            key={order.id} 
            className="event-item"
            style={{ backgroundColor: getStatusColor(order.status) }}
          >
            <div className="event-title">
              {order.route.points[0]} → {order.route.points[1]}
            </div>
            <div className="event-time">
              {getTimeFromDate(order.route.dateTime)}
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Обновляем функцию для получения и сортировки заказов
  const getDayOrders = (day) => {
    const dayOrders = filteredOrders.filter(order => {
      if (!order.route?.dateTime || order.status === 'cancelled') return false;
      const orderTime = new Date(order.route.dateTime);
      const dayDate = new Date(
        currentDate.getFullYear(),
        day.month,
        day.date
      );
      
      return orderTime.getDate() === dayDate.getDate() &&
             orderTime.getMonth() === dayDate.getMonth() &&
             orderTime.getFullYear() === dayDate.getFullYear();
    });

    // Сортируем заказы по времени
    return dayOrders.sort((a, b) => {
      const timeA = new Date(a.route.dateTime);
      const timeB = new Date(b.route.dateTime);
      return timeA - timeB;
    });
  };

  // eslint-disable-next-line no-unused-vars
  const EventTooltip = ({ order }) => (
    <div className="event-tooltip">
      <div className="tooltip-time">
        {new Date(order.route.dateTime).toLocaleTimeString('ru', { 
          hour: '2-digit', 
          minute: '2-digit' 
        })}
      </div>
      <div className="tooltip-route">
        {order.route.points[0]} → {order.route.points[1]}
      </div>
      <div className="tooltip-date">
        {new Date(order.route.dateTime).toLocaleDateString('ru', { 
          day: 'numeric',
          month: 'long'
        })}
      </div>
    </div>
  );

  // Обновляем функцию форматирования маршрута
  const formatRoute = (points) => {
    if (!points || points.length === 0) return '';
    
    return (
      <div className="route-points">
        {points.map((point, index) => (
          <div key={index} className="route-point">
            <span className="route-bullet"></span>
            <span className="route-text">{point}</span>
          </div>
        ))}
      </div>
    );
  };

  // Создаем отдельную функцию для рендеринга событий в недельном представлении
  const renderWeekDayEvents = (day) => {
    const dayOrders = filteredOrders.filter(order => {
      if (!order.route?.dateTime || order.status === 'cancelled') return false;
      const orderTime = new Date(order.route.dateTime);
      const dayDate = new Date(day.fullDate);
      const hours = orderTime.getHours();
      
      return orderTime.getDate() === dayDate.getDate() &&
             orderTime.getMonth() === dayDate.getMonth() &&
             orderTime.getFullYear() === dayDate.getFullYear() &&
             hours >= 8 && hours <= 17;
    });

    // Группируем события по пересечениям
    const eventGroups = groupOverlappingEvents(dayOrders);
    
    return dayOrders.map(order => {
      const orderTime = new Date(order.route.dateTime);
      const hours = orderTime.getHours() - 8;
      const minutes = orderTime.getMinutes();
      const position = hours * 80 + minutes * 1.33;
      
      // Находим группу для текущего события
      const group = eventGroups.find(g => g.includes(order));
      
      // Если событие одно в группе - занимает всю ширину
      // Если в группе несколько событий - используем позиционирование
      const pos = group.length > 1 ? calculateEventPositions(group).get(order.id) : { column: 0, totalColumns: 1 };
      
      return (
        <div
          key={order.id}
          className="timeline-event"
          style={{
            backgroundColor: getStatusColor(order.status),
            top: `${position}px`,
            left: `${pos.column * (100 / pos.totalColumns)}%`,
            width: `${100 / pos.totalColumns}%`
          }}
          onClick={() => handleOrderClick(order)}
        >
          <div className="timeline-event-time">
            {orderTime.toLocaleTimeString('ru', {
              hour: '2-digit',
              minute: '2-digit'
            })}
          </div>
        </div>
      );
    });
  };

  // Вспомогательная функция для группировки пересекающихся событий
  const groupOverlappingEvents = (events) => {
    const groups = [];
    
    events.forEach(event => {
      const eventTime = new Date(event.route.dateTime);
      const eventEnd = new Date(eventTime.getTime() + 30 * 60000); // +30 минут
      
      // Ищем группу, где есть пересечение по времени
      const overlappingGroup = groups.find(group => 
        group.some(groupEvent => {
          const groupTime = new Date(groupEvent.route.dateTime);
          const groupEnd = new Date(groupTime.getTime() + 30 * 60000);
          return eventTime < groupEnd && groupTime < eventEnd;
        })
      );
      
      if (overlappingGroup) {
        overlappingGroup.push(event);
      } else {
        groups.push([event]);
      }
    });
    
    return groups;
  };

  // Возвращаем оригинальную функцию для месячного представления
  const renderDayEvents = (day) => {
    const dayOrders = getDayOrders(day);
    const visibleOrders = dayOrders.slice(0, 3);
    const remainingCount = dayOrders.length - 3;

    return (
      <div className="day-events">
        {visibleOrders.map(order => (
          <div 
            key={order.id} 
            className="calendar-event-item"
            style={{ backgroundColor: getStatusColor(order.status) }}
            onClick={() => handleOrderClick(order)}
          >
            <span className="event-time-only">
              {new Date(order.route.dateTime).toLocaleTimeString('ru', { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </span>
            <div className="event-tooltip-wrapper">
              <div className="event-tooltip">
                <div className="tooltip-time">
                  {new Date(order.route.dateTime).toLocaleTimeString('ru', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </div>
                <div className="tooltip-route">
                  {formatRoute(order.route.points)}
                </div>
                <div className="tooltip-date">
                  {new Date(order.route.dateTime).toLocaleDateString('ru', { 
                    day: 'numeric',
                    month: 'long'
                  })}
                </div>
              </div>
            </div>
          </div>
        ))}
        {remainingCount > 0 && (
          <div className="more-events">
            +{remainingCount} ещё
          </div>
        )}
      </div>
    );
  };

  // eslint-disable-next-line no-unused-vars
  const getTimeSlots = () => {
    const slots = [];
    // Генерируем слоты с 8:00 до 17:00
    for (let hour = 8; hour <= 17; hour++) {
      slots.push({
        time: `${hour.toString().padStart(2, '0')}:00`,
        hour: hour
      });
    }
    return slots;
  };

  // Добавим функцию для расчета позиций пересекающихся событий
  const calculateEventPositions = (events) => {
    // Сортируем события по времени начала
    const sortedEvents = [...events].sort((a, b) => {
      return new Date(a.route.dateTime) - new Date(b.route.dateTime);
    });

    const positions = new Map(); // Хранит позиции событий
    const columns = []; // Хранит колонки с событиями

    sortedEvents.forEach(event => {
      const eventStart = new Date(event.route.dateTime);
      let column = 0;

      // Ищем первую свободную колонку
      while (columns[column]?.some(existingEvent => {
        const existingStart = new Date(existingEvent.route.dateTime);
        // Считаем, что события пересекаются, если разница во времени меньше 30 минут
        return Math.abs(existingStart - eventStart) < 30 * 60 * 1000;
      })) {
        column++;
      }

      // Создаем колонку, если её нет
      if (!columns[column]) {
        columns[column] = [];
      }

      columns[column].push(event);
      positions.set(event.id, { column, totalColumns: 0 });
    });

    // Устанавливаем общее количество колонок для каждого события
    positions.forEach((pos) => {
      pos.totalColumns = columns.length;
    });

    return positions;
  };

  // Обновляем рендер временной шкалы
  const renderDayTimeline = () => {
    if (!selectedDay) return null;

    const dayOrders = filteredOrders.filter(order => {
      if (!order.route?.dateTime || order.status === 'cancelled') return false;
      const orderTime = new Date(order.route.dateTime);
      const selectedDate = new Date(
        currentDate.getFullYear(),
        selectedDay.month !== undefined ? selectedDay.month : currentDate.getMonth(),
        selectedDay.date
      );
      const hours = orderTime.getHours();
      
      return orderTime.getDate() === selectedDate.getDate() &&
             orderTime.getMonth() === selectedDate.getMonth() &&
             orderTime.getFullYear() === selectedDate.getFullYear() &&
             hours >= 8 && hours <= 17;
    });

    // Группируем события по пересечениям
    const eventGroups = groupOverlappingEvents(dayOrders);

    return (
      <div className="timeline-grid">
        <div className="timeline-labels">
          {Array.from({ length: 19 }).map((_, index) => (
            <div key={index} className="timeline-label">
              {index % 2 === 0 ? `${Math.floor(index / 2) + 8}:00` : ''}
            </div>
          ))}
        </div>
        <div className="timeline-cells">
          {dayOrders.map(order => {
            const orderTime = new Date(order.route.dateTime);
            const hours = orderTime.getHours() - 8;
            const minutes = orderTime.getMinutes();
            const position = hours * 80 + minutes * 1.33;

            // Находим группу для текущего события
            const group = eventGroups.find(g => g.includes(order));
            
            // Если событие одно в группе - занимает всю ширину
            // Если в группе несколько событий - используем позиционирование
            const pos = group.length > 1 ? calculateEventPositions(group).get(order.id) : { column: 0, totalColumns: 1 };
            
            return (
              <div
                key={order.id}
                className="timeline-event"
                style={{
                  backgroundColor: getStatusColor(order.status),
                  top: `${position}px`,
                  left: `${pos.column * (100 / pos.totalColumns)}%`,
                  width: `${100 / pos.totalColumns}%`
                }}
                onClick={() => handleOrderClick(order)}
              >
                <div className="timeline-event-time">
                  {orderTime.toLocaleTimeString('ru', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Обработчик клика по заказу
  const handleOrderClick = (order) => {
    setSelectedOrder(order);
  };

  const openEditOrderModal = (orderData) => {
    if (!orderData || !orderData.id) {
      console.error('Отсутствуют необходимые данные заказа:', orderData);
      return;
    }

    try {
      const editData = {
        id: orderData.id,
        vehicleTypeId: orderData.vehicleTypeId,
        vehicle: {
          id: orderData.vehicleTypeId,
          name: orderData.vehicleType?.name || 'Неизвестный тип'
        },
        customerInfo: {
          id: orderData.customerId,
          fullName: orderData.customerName || user.fullName,
          contact: orderData.customerPhone || user.contact,
          position: orderData.customerPosition || user.position,
          subdivision: orderData.customerDepartment || user.subdivision,
          email: orderData.customerEmail || user.email
        },
        route: {
          points: orderData.route?.points || [],
          dateTime: orderData.route?.dateTime,
          estimatedEndTime: orderData.route?.estimatedEndTime
        },
        documents: {
          waybill: orderData.documents?.[0] || null,
          waybillName: orderData.documents?.[0]?.originalName || '',
          removeWaybill: false,
          comment: orderData.comment || ''
        },
        comment: orderData.comment || '',
        isEditing: true
      };
      
      console.log('Prepared edit data:', editData);
      setOrderToEdit(editData);
      setShowEditOrder(true);
    } catch (error) {
      console.error('Ошибка при подготовке данных для редактирования:', error);
    }
  };

  const handleEditOrderSubmit = async (updatedOrderData) => {
    try {
      if (!orderToEdit || !orderToEdit.id) {
        throw new Error('Отсутствует ID заказа для обновления');
      }

      const formData = new FormData();
      
      formData.append('vehicleTypeId', updatedOrderData.vehicleTypeId);
      formData.append('customerId', user.id);
      formData.append('customerName', updatedOrderData.customerInfo.fullName);
      formData.append('customerPhone', updatedOrderData.customerInfo.contact);
      formData.append('customerPosition', updatedOrderData.customerInfo.position);
      formData.append('customerDepartment', updatedOrderData.customerInfo.subdivision);
      formData.append('customerEmail', updatedOrderData.customerInfo.email);
      
      const routeData = {
        startPoint: updatedOrderData.route.startPoint,
        endPoints: updatedOrderData.route.endPoints || [],
        dateTime: updatedOrderData.route.dateTime,
        estimatedEndTime: updatedOrderData.route.estimatedEndTime
      };
      formData.append('route', JSON.stringify(routeData));
      
      formData.append('comment', updatedOrderData.comment || '');

      if (updatedOrderData.documents?.waybill instanceof File) {
        formData.append('waybill', updatedOrderData.documents.waybill);
      } else if (updatedOrderData.documents?.waybill) {
        formData.append('existingWaybill', updatedOrderData.documents.waybill.id || '');
      } else if (updatedOrderData.documents?.removeWaybill) {
        formData.append('removeWaybill', 'true');
      }

      await dispatch(updateOrder({ orderId: orderToEdit.id, orderData: formData })).unwrap();
      
      setShowEditOrder(false);
      setOrderToEdit(null);
      setSelectedOrder(null);
    } catch (error) {
      console.error('Ошибка при редактировании заказа:', error);
    }
  };

  const renderWeekView = () => {
    const weekDays = getWeekDays();

    return (
      <div className="calendar-week-view">
        {/* Заголовок с днями недели */}
        <div className="week-header">
          <div className="time-column-header"></div>
          {weekDays.map((day, index) => (
            <div 
              key={index} 
              className={`week-day-header ${day.isToday ? 'today' : ''}`}
              onClick={() => handleDayClick(day)}
            >
              <div className="week-day-name">
                {day.fullDate.toLocaleString('ru', { weekday: 'short' })}
              </div>
              <div className="week-day-number">
                {day.date}
              </div>
            </div>
          ))}
        </div>

        {/* Сетка с временными слотами */}
        <div className="week-timeline-grid">
          {/* Колонка с временными метками */}
          <div className="timeline-labels">
            {Array.from({ length: 19 }).map((_, index) => (
              <div key={index} className="timeline-label">
                {index % 2 === 0 ? `${Math.floor(index / 2) + 8}:00` : ''}
              </div>
            ))}
          </div>

          {/* Колонки дней с событиями */}
          <div className="week-days-grid">
            {weekDays.map((day, index) => (
              <div key={index} className={`day-timeline-cells ${day.isToday ? 'today' : ''}`}>
                {renderWeekDayEvents(day)}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="calendar-container">
      <div className="calendar-header">
        <div className="calendar-controls">
          <button className="btn-today" onClick={handleToday}>
            Сегодня
          </button>
          <div className="calendar-nav">
            <button onClick={handlePrevious}>
              <i className="fas fa-chevron-left"></i>
            </button>
            <button onClick={handleNext}>
              <i className="fas fa-chevron-right"></i>
            </button>
          </div>
          <h2>{getHeaderText()}</h2>
        </div>
        <div className="view-controls">
          <button 
            className={view === 'week' ? 'active' : ''} 
            onClick={() => setView('week')}
          >
            Неделя
          </button>
          <button 
            className={view === 'month' ? 'active' : ''} 
            onClick={() => setView('month')}
          >
            Месяц
          </button>
        </div>
      </div>

      {view === 'month' ? (
        <div className="calendar-with-sidebar">
          <div className="calendar-month-view">
            <div className="calendar-weekdays">
              {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map(day => (
                <div key={day} className="weekday">{day}</div>
              ))}
            </div>
            <div className="calendar-days">
              {getDaysInMonth().map((day, index) => (
                <div 
                  key={index} 
                  className={`calendar-day 
                    ${!day.isCurrentMonth ? 'other-month' : ''} 
                    ${day.isToday ? 'today' : ''}
                    ${isSelectedDay(day) ? 'selected' : ''}`}
                  onClick={() => handleDayClick(day)}
                >
                  <span className="day-number">{day.date}</span>
                  <div className="day-events">
                    {renderDayEvents(day)}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="day-details-sidebar">
            <div className="day-details-header">
              <h3>{formatSelectedDay()}</h3>
            </div>
            <div className="day-timeline">
              {renderDayTimeline()}
            </div>
          </div>
        </div>
      ) : (
        renderWeekView()
      )}

      {/* Модальное окно с карточкой заказа */}
      <Modal 
        isOpen={selectedOrder !== null} 
        onClose={() => setSelectedOrder(null)}
        type="task"
      >
        {selectedOrder && (
          <TaskCard 
            task={selectedOrder}
            userRole={user.role}
            onEditOrder={openEditOrderModal}
            onClose={() => setSelectedOrder(null)}
          />
        )}
      </Modal>

      {/* Модальное окно редактирования заказа */}
      <Modal 
        isOpen={showEditOrder} 
        onClose={() => {
          setShowEditOrder(false);
          setOrderToEdit(null);
        }}
      >
        <OrderWizard
          initialData={orderToEdit}
          onSubmit={handleEditOrderSubmit}
          onCancel={() => {
            setShowEditOrder(false);
            setOrderToEdit(null);
          }}
          isEditing={true}
        />
      </Modal>
    </div>
  );
};

export default TripCalendar; 