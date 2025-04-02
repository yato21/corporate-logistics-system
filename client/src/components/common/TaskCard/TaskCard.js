import React, { useState, useRef, useEffect } from 'react';
import './TaskCard.css';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { cancelOrder, updateOrderStatus } from '../../../redux/slices/orderSlice';
import dayjs from 'dayjs';
import OrderManagementModal from '../../dispatcher/OrderManagementModal';
import Modal from '../Modal/Modal';
import { fetchChatMessages, setActiveChatUI, selectUnreadMessages } from '../../../redux/slices/chatSlice';
import Chat from '../Chat/Chat';
import axiosInstance from '../../../utils/axios';

const TaskCard = ({ task: initialTask, onEditOrder, userRole, onClose }) => {
  const [task, setTask] = useState(initialTask);
  const orders = useSelector(state => state.orders.items);
  const { user } = useSelector(state => state.auth);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [showManagementModal, setShowManagementModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);
  const [showChat, setShowChat] = useState(false);
  const activeChatUI = useSelector(state => state.chat.activeChats[task?.id]);
  const unreadMessages = useSelector(state => 
    task?.id ? selectUnreadMessages(state, task.id) : 0
  );
  const [error, setError] = useState(null);

  // Обновляем данные карточки при изменении заказа
  useEffect(() => {
    // Проверяем, что initialTask существует и имеет id
    if (initialTask?.id) {
      const updatedTask = orders.find(order => order.id === initialTask.id);
      if (updatedTask) {
        console.log('Обновление данных заказа в TaskCard:', updatedTask);
        setTask(updatedTask);
      }
    } else {
      console.warn('TaskCard: initialTask не определен или не имеет id');
    }
  }, [orders, initialTask]);

  // Закрытие выпадающего меню при клике вне его
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    }
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  console.log('Task data:', {
    vehicleType: task.vehicleType,
    assignedTransport: task.assignedTransport,
    features: task.vehicleType?.features,
    documents: task.documents,
    waybill: task.documents?.waybill,
    isCargoType: task.vehicleType?.type === 'cargo'
  });

  if (!task) {
    return <div className="task-card-loading">Загрузка...</div>;
  }

  const formatDateTime = (dateTimeStr) => {
    if (!dateTimeStr) return '—';
    const date = new Date(dateTimeStr);
    return date.toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDate = (dateTimeStr) => {
    if (!dateTimeStr) return '—';
    const date = new Date(dateTimeStr);
    return date.toLocaleString('ru-RU', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  const formatTime = (dateTimeStr) => {
    if (!dateTimeStr) return '—';
    const date = new Date(dateTimeStr);
    return date.toLocaleString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusText = (status) => {
    const statusMap = {
      pending: 'Ожидает обработки',
      assigned: 'Назначен',
      in_progress: 'В процессе',
      completed: 'Завершен',
      cancelled: 'Отменен'
    };
    return statusMap[status] || status;
  };

  const calculateProgress = (start, end) => {
    const now = new Date().getTime();
    const startTime = new Date(start).getTime();
    const endTime = new Date(end).getTime();
    const progress = ((now - startTime) / (endTime - startTime)) * 100;
    return Math.min(Math.max(progress, 0), 100);
  };

  const getHistoryIcon = (type) => {
    const icons = {
      status_change: 'exchange-alt',
      driver_assigned: 'user-check',
      comment_added: 'comment',
      document_added: 'file-upload',
      created: 'plus-circle'
    };
    return icons[type] || 'circle';
  };

  const getVehicleStatusText = (status) => {
    const statusMap = {
      available: 'Доступен',
      in_use: 'Используется',
      maintenance: 'На обслуживании'
    };
    return statusMap[status] || status;
  };

  const handleDownloadDocument = async (doc) => {
    try {
      const serverUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const token = localStorage.getItem('token');
      const url = `${serverUrl}/uploads/${encodeURIComponent(doc.filePath)}`;
      
      console.log('Скачивание документа:', {
        url: url,
        originalName: doc.originalName
      });
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Ошибка при скачивании: ${response.status}`);
      }
      
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = downloadUrl;
      // Используем декодированное имя файла
      link.download = decodeURIComponent(escape(doc.originalName));
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      window.URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      console.error('Ошибка при скачивании документа:', err);
      setError('Не удалось скачать документ: ' + err.message);
    }
  };

  const handleEditOrder = (e) => {
    e.stopPropagation();
    
    if (onEditOrder) {
      const orderData = {
        id: task.id,
        vehicleTypeId: task.vehicleType?.id,
        route: {
          startPoint: task.route?.points[0],
          endPoints: task.route?.points.slice(1),
          dateTime: task.route?.dateTime,
          estimatedEndTime: task.route?.estimatedEndTime
        },
        documents: {
          waybill: task.documents?.[0] || null,
          waybillName: task.documents?.[0]?.originalName || '',
          removeWaybill: false
        },
        comment: task.comment,
        customerInfo: {
          id: task.customerId,
          fullName: task.customerName,
          contact: task.customerPhone,
          position: task.customerPosition,
          subdivision: task.customerDepartment,
          email: task.customerEmail
        },
        isEditing: true
      };
      
      console.log('Editing order data:', orderData);
      onEditOrder(orderData);
    }
  };

  const handleCancelOrder = (orderId) => {
    setShowConfirmModal(true);
  };

  const confirmCancelOrder = () => {
    dispatch(cancelOrder(task.id));
    setShowConfirmModal(false);
  };

  // Функция для проверки, прошло ли время заказа
  const isOrderExpired = () => {
    const orderDateTime = dayjs(task.route.dateTime);
    const currentDateTime = dayjs();
    return orderDateTime.isBefore(currentDateTime);
  };

  // Функция для проверки доступности действий с заказом
  const canManageOrder = () => {
    return ['pending', 'assigned'].includes(task.status);
  };

  // Добавляем общую функцию для обновления статуса заказа
  const handleUpdateOrderStatus = async (status) => {
    try {
      setLoading(true);
      const comment = 
        status === 'in_progress' ? 'Заказ взят в работу' : 
        status === 'completed' ? 'Заказ выполнен' : 
        `Статус изменен на: ${getStatusText(status)}`;
        
      await dispatch(updateOrderStatus({
        orderId: task.id,
        status,
        comment
      })).unwrap();
      
      // Закрываем карточку после успешного обновления
      onClose();
    } catch (error) {
      console.error(`Ошибка при обновлении статуса заказа на ${status}:`, error);
    } finally {
      setLoading(false);
    }
  };

  // Обновляем существующие функции, чтобы они использовали handleUpdateOrderStatus
  const handleStartOrder = async () => {
    try {
      setLoading(true);
      // Проверяем наличие task и его id перед отправкой
      if (!task?.id) {
        console.error('Невозможно начать выполнение заказа: отсутствует id');
        return;
      }

      await dispatch(updateOrderStatus({
        orderId: task.id,
        status: 'in_progress',
        actualStartTime: new Date().toISOString()
      })).unwrap();
    } catch (error) {
      console.error('Ошибка при начале выполнения заказа:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteOrder = async () => {
    try {
      setLoading(true);
      // Проверяем наличие task и его id перед отправкой
      if (!task?.id) {
        console.error('Невозможно завершить заказ: отсутствует id');
        return;
      }

      await dispatch(updateOrderStatus({
        orderId: task.id,
        status: 'completed',
        actualEndTime: new Date().toISOString()
      })).unwrap();
    } catch (error) {
      console.error('Ошибка при завершении заказа:', error);
    } finally {
      setLoading(false);
    }
  };

  // Добавляем рендер кнопок действий для водителя
  const renderDriverActions = () => {
    if (userRole !== 'driver') return null;

    switch (task.status) {
      case 'assigned':
        return (
          <button
            className="btn btn-success"
            onClick={handleStartOrder}
            disabled={loading}
          >
            <i className="fas fa-play"></i>
            {loading ? 'Загрузка...' : 'Начать выполнение'}
          </button>
        );
      case 'in_progress':
        return (
          <button
            className="btn btn-primary"
            onClick={handleCompleteOrder}
            disabled={loading}
          >
            <i className="fas fa-check"></i>
            {loading ? 'Загрузка...' : 'Завершить заказ'}
          </button>
        );
      default:
        return null;
    }
  };

  // Функция для переключения отображения чата
  const toggleChat = () => {
    setShowChat(!showChat);
    
    // Если чат открывается, устанавливаем активный статус
    if (!showChat) {
      dispatch(setActiveChatUI({ orderId: task.id, active: true }));
    }
  };

  // Проверка доступности чата
  const isChatAvailable = () => {
    return ['assigned', 'in_progress'].includes(task.status) && 
           (userRole === 'customer' || userRole === 'driver');
  };

  // Функция для рендеринга действий в зависимости от роли пользователя и статуса задачи
  const renderActions = () => {
    return (
      <>
        {renderDriverActions()}
        <>
          {/* Кнопка управления заказом только для диспетчера при статусе "pending" или "assigned" */}
          {userRole === 'dispatcher' && (task.status === 'pending' || task.status === 'assigned') && (
            <button
              className="btn btn-primary action-btn"
              onClick={() => setShowManagementModal(true)}
            >
              <i className="fas fa-cog"></i>
              {task.status === 'pending' ? 'Назначить' : 'Редактировать'}
            </button>
          )}
          
          {/* Кнопка редактирования только для заказчика при статусе "pending" */}
          {userRole === 'customer' && task.status === 'pending' && (
            <button
              className="btn btn-warning action-btn"
              onClick={handleEditOrder}
              disabled={!canManageOrder()}
            >
              <i className="fas fa-edit"></i>
              Редактировать
            </button>
          )}
          
          {/* Кнопка отмены для заказчика и диспетчера при статусах "pending" и "assigned" */}
          {(userRole === 'customer' || userRole === 'dispatcher') && 
            ['pending', 'assigned'].includes(task.status) && (
              <button
                className="btn btn-danger action-btn"
                onClick={() => handleCancelOrder(task.id)}
                disabled={!canManageOrder()}
              >
                <i className="fas fa-times"></i>
                Отменить
              </button>
            )}
          
          {/* Добавляем кнопку чата, если заказ в соответствующем статусе */}
          {isChatAvailable() && (
            <button
              className="btn btn-primary action-btn chat-btn"
              onClick={toggleChat}
            >
              <i className="fas fa-comments"></i>
              Чат
              {unreadMessages > 0 && (
                <span className="unread-badge">{unreadMessages}</span>
              )}
            </button>
          )}
        </>
      </>
    );
  };

  // Функция для рендеринга выпадающего меню
  const renderDropdownMenu = () => {
    // Проверяем, доступны ли действия водителя
    const hasDriverActions = userRole === 'driver' && 
      (task.status === 'assigned' || task.status === 'in_progress');
    
    // Проверяем, доступны ли действия диспетчера
    const hasDispatcherActions = userRole === 'dispatcher' && 
      (task.status === 'pending' || task.status === 'assigned');
    
    // Проверяем, доступны ли действия заказчика для редактирования
    const hasCustomerEditAction = userRole === 'customer' && task.status === 'pending';
    
    // Проверяем, доступно ли действие отмены
    const hasCancelAction = (userRole === 'customer' || userRole === 'dispatcher') && 
      ['pending', 'assigned'].includes(task.status);
    
    // Определяем, нужен ли первый разделитель
    const showFirstDivider = hasDriverActions && (hasDispatcherActions || hasCustomerEditAction);
    
    // Определяем, нужен ли второй разделитель перед кнопкой отмены
    const showSecondDivider = hasCancelAction && (hasDriverActions || hasDispatcherActions || hasCustomerEditAction);

    return (
      <div className="dropdown-container" ref={dropdownRef}>
        <button 
          className="btn btn-primary dropdown-toggle" 
          onClick={() => setShowDropdown(!showDropdown)}
        >
          <i className="fas fa-ellipsis-v"></i>
          Действия
        </button>
        
        {showDropdown && (
          <div className="dropdown-menu">
            {/* Действия водителя */}
            {userRole === 'driver' && task.status === 'assigned' && (
              <button 
                className="dropdown-item success" 
                onClick={() => handleUpdateOrderStatus('in_progress')}
                disabled={loading}
              >
                <i className="fas fa-play"></i>
                Начать
              </button>
            )}
            
            {userRole === 'driver' && task.status === 'in_progress' && (
              <button 
                className="dropdown-item primary" 
                onClick={() => handleUpdateOrderStatus('completed')}
                disabled={loading}
              >
                <i className="fas fa-check"></i>
                Завершить
              </button>
            )}
            
            {/* Первый разделитель - показываем только если есть действия и для водителя и для других ролей */}
            {showFirstDivider && <div className="dropdown-divider"></div>}
            
            {/* Действия диспетчера */}
            {userRole === 'dispatcher' && (task.status === 'pending' || task.status === 'assigned') && (
              <button 
                className="dropdown-item primary"
                onClick={() => setShowManagementModal(true)}
              >
                <i className="fas fa-cog"></i>
                {task.status === 'pending' ? 'Назначить' : 'Редактировать'}
              </button>
            )}
            
            {/* Действия заказчика */}
            {userRole === 'customer' && task.status === 'pending' && (
              <button 
                className="dropdown-item edit"
                onClick={handleEditOrder}
                disabled={!canManageOrder()}
              >
                <i className="fas fa-edit"></i>
                Редактировать
              </button>
            )}
            
            {/* Второй разделитель - показываем только если есть другие действия перед кнопкой отмены */}
            {showSecondDivider && <div className="dropdown-divider"></div>}
            
            {/* Кнопка отмены */}
            {hasCancelAction && (
              <button 
                className="dropdown-item danger"
                onClick={() => handleCancelOrder(task.id)}
                disabled={!canManageOrder()}
              >
                <i className="fas fa-times"></i>
                Отменить
              </button>
            )}

            {isChatAvailable() && (
              <button
                className="dropdown-item primary"
                onClick={toggleChat}
            >
              <i className="fas fa-comments"></i>
              Чат
              {unreadMessages > 0 && (
                <span className="unread-badge">{unreadMessages}</span>
              )}
            </button>
          )}
          
          </div>
        )}
      </div>
    );
  };

  // Вынесем фильтрацию документов в отдельную функцию
  const getWaybillDocuments = () => {
    if (!task.documents || task.documents.length === 0) {
      return [];
    }
    
    // Фильтруем документы, оставляя только накладные (waybill) и документы без связи с сообщениями
    return task.documents.filter(doc => 
      (doc.type === 'waybill' || !doc.type) && !doc.messageId
    );
  };

  // Функция для отображения документов с правильной кодировкой
  const renderDocuments = () => {
    const waybillDocs = getWaybillDocuments();
    
    // Если нет накладных, возвращаем null
    if (waybillDocs.length === 0) {
      return null;
    }
    
    return (
      <div className="d-flex flex-column gap-2 w-full">
        {waybillDocs.map((doc) => (
          <div
            key={doc.id}
            className="d-flex align-center gap-3 p-2 rounded border clickable"
            onClick={() => handleDownloadDocument(doc)}
          >
            <div className="document-icon">
              <i className={`fas ${getDocumentIcon(doc.mimeType)}`}></i>
            </div>
            <div className="flex-1">
              <span className="text-truncate">
                {decodeURIComponent(escape(doc.originalName))}
              </span>
            </div>
            <div>
              <i className="fas fa-download"></i>
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Функция для определения иконки документа по mimetype
  const getDocumentIcon = (mimeType) => {
    if (!mimeType) return 'fa-file';
    
    if (mimeType.includes('pdf')) {
      return 'fa-file-pdf';
    } else if (mimeType.includes('word') || mimeType.includes('doc')) {
      return 'fa-file-word';
    } else if (mimeType.includes('excel') || mimeType.includes('spreadsheet') || mimeType.includes('xls')) {
      return 'fa-file-excel';
    } else if (mimeType.includes('image')) {
      return 'fa-file-image';
    } else {
      return 'fa-file-alt';
    }
  };

  return (
    <>
      <div className="task-card" data-status={task.status}>
        <div className="task-card-header">
          <div className="task-card-title">
            <div className="task-card-title-left">
              <h2>Заказ №{task.id}</h2>
              <div className="task-card-meta">
                <span className="meta-item">
                  <i className="far fa-clock"></i>
                  {formatDateTime(task.createdAt)}
                </span>
                <div className="d-flex gap-3">
                  {/* Десктопные кнопки (показываются на экранах больше 426px) */}
                  <div className="desktop-actions">
                    {renderActions()}
                  </div>
                  
                  {/* Мобильный выпадающий список (показывается на экранах меньше 426px) */}
                  <div className="mobile-actions">
                    {renderDropdownMenu()}
                  </div>
                  
                  <span className={`status-badge status-${task.status}`}>
                    {getStatusText(task.status)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="task-card-body">
          <div className="info-section customer-section">
            <h3>
              <i className="fas fa-user-circle"></i>
              Заказчик
            </h3>
            <div className="section-content">
              <div className="customer-info-list">
                <div className="info-row">
                  <i className="fas fa-user"></i>
                  <div className="info-row-content">
                    <span className="info-label">ФИО</span>
                    <span className="info-value">{task.customerName}</span>
                  </div>
                </div>
                <div className="info-row">
                  <i className="fas fa-phone"></i>
                  <div className="info-row-content">
                    <span className="info-label">Телефон</span>
                    <span className="info-value">{task.customerPhone}</span>
                  </div>
                </div>
                {task.customerPosition && (
                  <div className="info-row">
                    <i className="fas fa-briefcase"></i>
                    <div className="info-row-content">
                      <span className="info-label">Должность</span>
                      <span className="info-value">{task.customerPosition}</span>
                    </div>
                  </div>
                )}
                {task.customerDepartment && (
                  <div className="info-row">
                    <i className="fas fa-building"></i>
                    <div className="info-row-content">
                      <span className="info-label">Подразделение</span>
                      <span className="info-value">{task.customerDepartment}</span>
                    </div>
                  </div>
                )}
                {task.customerEmail && (
                  <div className="info-row">
                    <i className="fas fa-envelope"></i>
                    <div className="info-row-content">
                      <span className="info-label">Email</span>
                      <span className="info-value">{task.customerEmail}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="info-section route-info">
            <h3>
              <i className="fas fa-route"></i>
              Маршрут и время
            </h3>
            <div className="section-content">
              <div className="d-flex gap-3 mb-3">
                <div className="info-row">
                  <i className="far fa-calendar-alt"></i>
                  <div className="info-row-content">
                    <span className="info-value">{formatDate(task.route?.dateTime)}</span>
                  </div>
                </div>
                <div className="info-row">
                  <i className="far fa-clock"></i>
                  <div className="info-row-content">
                    <span className="info-value">
                      {formatTime(task.route?.dateTime)} - {formatTime(task.route?.estimatedEndTime)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="d-flex flex-column gap-2">
                {task.route?.points?.map((point, index) => (
                  <div key={index} className="info-row">
                    <i className={index === 0 ? "fas fa-map-marker-alt text-primary" : "fas fa-flag-checkered text-success"}></i>
                    <div className="info-row-content">
                      <div className="d-flex flex-column">
                        <span className="info-value">{point}</span>
                        {index < task.route.points.length - 1 && (
                          <div className="border-l border-dashed h-4 ml-2 my-1"></div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="info-section transport-info">
            <h3><i className="fas fa-truck"></i>Транспорт</h3>
            <div className="section-content">
              <div className="transport-info-list">
                <div className="info-row">
                  <i className="fas fa-truck"></i>
                  <div className="info-row-content">
                    <span className="info-label">Тип транспорта</span>
                    <span className="info-value">{task.vehicleType?.name || '—'}</span>
                  </div>
                </div>
                
                {task.vehicleType?.capacity && (
                  <div className="info-row">
                    <i className={`fas ${task.vehicleType.type === 'passenger' ? 'fa-users' : 'fa-weight'}`}></i>
                    <div className="info-row-content">
                      <span className="info-label">
                        {task.vehicleType.type === 'passenger' ? 'Вместимость' : 'Грузоподъемность'}
                      </span>
                      <span className="info-value">
                        {task.vehicleType.capacity} {task.vehicleType.type === 'passenger' ? 'чел.' : 'т.'}
                      </span>
                    </div>
                  </div>
                )}

                {task.vehicleType?.volume && (
                  <div className="info-row">
                    <i className="fas fa-box"></i>
                    <div className="info-row-content">
                      <span className="info-label">Объем</span>
                      <span className="info-value">{task.vehicleType.volume} м³</span>
                    </div>
                  </div>
                )}

                {task.vehicleType?.features && (
                  <div className="info-row">
                    <i className="fas fa-list"></i>
                    <div className="info-row-content">
                      <span className="info-label">Характеристики</span>
                      <span className="info-value features-list">
                        {Array.isArray(task.vehicleType.features) 
                          ? task.vehicleType.features.join(', ')
                          : typeof task.vehicleType.features === 'string'
                            ? task.vehicleType.features
                            : JSON.parse(task.vehicleType.features).join(', ')}
                      </span>
                    </div>
                  </div>
                )}

                <div className="border-t mt-3 mb-3"></div>

                {task.assignedTransport ? (
                  <>
                    <div className="info-row">
                      <i className="fas fa-hashtag"></i>
                      <div className="info-row-content">
                        <span className="info-label">Номер ТС</span>
                        <span className="info-value">{task.assignedTransport.vehicleNumber}</span>
                      </div>
                    </div>
                    <div className="info-row">
                      <i className="fas fa-info-circle"></i>
                      <div className="info-row-content">
                        <span className="info-label">Статус</span>
                        <span className="info-value">{getVehicleStatusText(task.assignedTransport.status)}</span>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="info-row not-assigned">
                    <i className="fas fa-clock"></i>
                    <div className="info-row-content">
                      <span className="info-value">Транспорт еще не назначен</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="info-section driver-section">
            <h3>
              <i className="fas fa-id-card"></i>
              Водитель
            </h3>
            <div className="section-content">
              {task.driver ? (
                <>
                <div className="info-row">
                  <i className="fas fa-user"></i>
                  <div className="info-row-content column">
                    <span className="info-value">{task.driver.fullName}</span>
                  </div>
                </div>
                <div className="info-row">
                  <i className="fas fa-phone"></i>
                  <div className="info-row-content column">
                    <span>{task.driver.contact || 'Телефон не указан'}</span>
                  </div>
                </div>
                </>
              ) : (
                <div className="info-row">
                  <i className="fas fa-user-clock"></i>
                  <div className="info-row-content">
                    <span className="info-value">Водитель еще не назначен</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Блок дополнительной информации */}
          {(task.comment || getWaybillDocuments().length > 0) && (
            <div className="info-section additional-info-section">
              <h3>
                <i className="fas fa-info-circle"></i>
                Дополнительная информация
              </h3>
              <div className="section-content">
                <div className="additional-info-list">
                  {task.comment && (
                    <div className="info-row">
                      <i className="fas fa-comment"></i>
                      <div className="info-row-content column">
                        <span className="info-label">Комментарий</span>
                        <span className="info-value" style={{ wordBreak: 'break-word', whiteSpace: 'normal', overflowWrap: 'break-word' }}>
                          {task.comment}
                        </span>
                      </div>
                    </div>
                  )}
                  
                  {getWaybillDocuments().length > 0 && (
                    <div className="info-row">
                      <i className="fas fa-file-alt"></i>
                      <div className="info-row-content column">
                        <span className="info-label">Накладная</span>
                        {renderDocuments()}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {task.history && task.history.length > 0 && (
            <div className="info-section history-section">
              <h3>
                <i className="fas fa-history"></i>
                История изменений
              </h3>
              <div className="section-content">
                <div className="d-flex flex-column gap-3">
                  {task.history.map((event, index) => (
                    <div key={index} className="d-flex gap-3 p-2 border-b">
                      <div className="text-center">
                        <i className={`fas fa-${getHistoryIcon(event.type)}`}></i>
                      </div>
                      <div className="flex-1">
                        <div className="mb-1">{event.description}</div>
                        <div className="d-flex justify-between text-truncate">
                          <span className="text-gray-500">{formatDateTime(event.timestamp)}</span>
                          {event.user && <span className="text-gray-500">{event.user}</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {showManagementModal && (
        <OrderManagementModal
          order={task}
          onClose={() => setShowManagementModal(false)}
        />
      )}

      <Modal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={confirmCancelOrder}
        title="Подтвердите действие"
        message="Вы уверены, что хотите отменить заказ?"
        type="confirmation"
      />
      
      {/* Модальное окно для чата */}
      <Modal
        isOpen={showChat}
        onClose={toggleChat}
        title={`Чат по заказу #${task.id}`}
        type="custom"
        className="chat-modal"
      >
        <Chat orderId={task.id} onClose={toggleChat} isInModal={true} />
      </Modal>
    </>
  );
};

export default TaskCard; 