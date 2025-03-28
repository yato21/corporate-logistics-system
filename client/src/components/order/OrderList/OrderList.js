import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import TaskCard from '../../common/TaskCard/TaskCard';
import './OrderList.css';

const getRouteString = (order) => {
  if (!order.route) return '—';
  const points = order.route.points || [];
  if (points.length === 0) return '—';
  return points.join(' → ');
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

const OrderList = ({ orders, userRole, onAssignTransport, onEditOrder }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(userRole === 'dispatcher' ? 'pending' : 'active');
  const [openTasks, setOpenTasks] = useState([]);
  
  // Отдельные фильтры для каждой вкладки
  const [filters, setFilters] = useState({
    pending: {
      search: '',
      dateFrom: '',
      dateTo: ''
    },
    active: {
      search: '',
      status: '',
      dateFrom: '',
      dateTo: ''
    },
    completed: {
      search: '',
      status: '',
      dateFrom: '',
      dateTo: ''
    }
  });

  // Получаем текущие фильтры для активной вкладки
  const currentFilters = filters[activeTab] || {};

  // Обновляем фильтры только для активной вкладки
  const updateFilters = (updates) => {
    setFilters(prev => ({
      ...prev,
      [activeTab]: {
        ...prev[activeTab],
        ...updates
      }
    }));
  };

  // Сброс фильтров только для активной вкладки
  const resetFilters = () => {
    setFilters(prev => ({
      ...prev,
      [activeTab]: {
        search: '',
        status: '',
        dateFrom: '',
        dateTo: ''
      }
    }));
  };

  const [sortConfig, setSortConfig] = useState({
    key: null,
    direction: 'asc'
  });

  // Функция сортировки
  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getFilteredOrders = () => {
    if (userRole === 'dispatcher') {
      switch (activeTab) {
        case 'pending':
          return orders.filter(order => order.status === 'pending');
        case 'active':
          return orders.filter(order => ['assigned', 'in_progress'].includes(order.status));
        case 'completed':
          return orders.filter(order => ['completed', 'cancelled'].includes(order.status));
        default:
          return orders;
      }
    } else {
      // Для заказчика
      switch (activeTab) {
        case 'active':
          return orders.filter(order => !['completed', 'cancelled'].includes(order.status));
        case 'completed':
          return orders.filter(order => ['completed', 'cancelled'].includes(order.status));
        default:
          return orders;
      }
    }
  };

  const getTabs = () => {
    if (userRole === 'dispatcher') {
      return [
        { id: 'pending', label: 'Необработанные' },
        { id: 'active', label: 'Активные' },
        { id: 'completed', label: 'Завершенные' }
      ];
    }
    return [
      { id: 'active', label: 'Активные' },
      { id: 'completed', label: 'Завершенные' }
    ];
  };

  // Применяем фильтры поиска
  const filteredOrders = getFilteredOrders().filter(order => {
    const matchesSearch = order.id.toString().includes(currentFilters.search?.toLowerCase() || '') ||
      getRouteString(order).toLowerCase().includes(currentFilters.search?.toLowerCase() || '');
    
    const matchesStatus = !currentFilters.status || order.status === currentFilters.status;
    
    const matchesDate = (!currentFilters.dateFrom || new Date(order.route?.dateTime) >= new Date(currentFilters.dateFrom)) &&
      (!currentFilters.dateTo || new Date(order.route?.dateTime) <= new Date(currentFilters.dateTo));

    return matchesSearch && matchesStatus && matchesDate;
  });

  // Сортировка отфильтрованных заказов
  const sortedOrders = [...filteredOrders].sort((a, b) => {
    if (!sortConfig.key) return 0;

    let aValue, bValue;

    switch (sortConfig.key) {
      case 'route':
        aValue = getRouteString(a);
        bValue = getRouteString(b);
        break;
      case 'dateTime':
        aValue = a.route?.dateTime || '';
        bValue = b.route?.dateTime || '';
        break;
      default:
        aValue = a[sortConfig.key];
        bValue = b[sortConfig.key];
    }

    if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  const handleRowClick = (orderId) => {
    const task = orders.find(order => order.id === orderId);
    if (!openTasks.find(t => t.id === orderId)) {
      setOpenTasks(prev => [...prev, task]);
    }
    setActiveTab(`task-${orderId}`);
  };

  const handleCloseTask = (taskId, e) => {
    e.stopPropagation();
    setOpenTasks(prev => prev.filter(task => task.id !== taskId));
    if (activeTab === `task-${taskId}`) {
      const remainingTasks = openTasks.filter(task => task.id !== taskId);
      if (remainingTasks.length > 0) {
        setActiveTab(`task-${remainingTasks[remainingTasks.length - 1].id}`);
      } else {
        setActiveTab('active');
      }
    }
  };

  // Функция для получения опций статусов в зависимости от вкладки и роли
  const getStatusOptions = (tabId) => {
    if (userRole === 'dispatcher') {
      switch (tabId) {
        case 'active':
          return [
            { value: 'assigned', label: 'Назначен' },
            { value: 'in_progress', label: 'В процессе' }
          ];
        case 'completed':
          return [
            { value: 'completed', label: 'Завершен' },
            { value: 'cancelled', label: 'Отменен' }
          ];
        default:
          return [];
      }
    } else {
      // Для заказчика
      switch (tabId) {
        case 'active':
          return [
            { value: 'pending', label: 'Ожидает обработки' },
            { value: 'assigned', label: 'Назначен' },
            { value: 'in_progress', label: 'В процессе' }
          ];
        case 'completed':
          return [
            { value: 'completed', label: 'Завершен' },
            { value: 'cancelled', label: 'Отменен' }
          ];
        default:
          return [];
      }
    }
  };

  const [scrollPosition, setScrollPosition] = useState(0);
  const tabsListRef = useRef(null);
  const tabsWrapperRef = useRef(null);

  const handleScroll = (direction) => {
    const tabWidth = 200; // Ширина одной вкладки
    const newPosition = direction === 'left' 
      ? Math.max(scrollPosition - tabWidth, 0)
      : scrollPosition + tabWidth;
    
    const maxScroll = tabsListRef.current.scrollWidth - tabsWrapperRef.current.clientWidth;
    setScrollPosition(Math.min(newPosition, maxScroll));
  };

  const canScrollLeft = scrollPosition > 0;
  const canScrollRight = tabsListRef.current 
    ? scrollPosition < tabsListRef.current.scrollWidth - tabsWrapperRef.current.clientWidth
    : false;

  // Передаем onEditOrder в TaskCard
  const renderTaskCard = (task) => (
    <TaskCard 
      key={task.id} 
      task={task}
      onEditOrder={onEditOrder}
      userRole={userRole}
      onClose={() => handleCloseTask(task.id, { stopPropagation: () => {} })}
    />
  );

  const getSortIcon = (key) => {
    if (sortConfig.key === key) {
      return sortConfig.direction === 'asc' ? '↑' : '↓';
    }
    return '';
  };

  return (
    <div className="orders-list">
      <div className="tabs-container">
        {/* Основные вкладки */}
        <ul className="main-tabs">
          {getTabs().map(tab => (
            <li 
              key={tab.id}
              className={`tab-item ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </li>
          ))}
        </ul>

        {/* Прокручиваемые вкладки заказов */}
        {openTasks.length > 0 && (
          <div className="scrollable-tabs">
            <button 
              className="btn-icon scroll-button"
              onClick={() => handleScroll('left')}
              disabled={!canScrollLeft}
            >
              <i className="fas fa-chevron-left"></i>
            </button>
            
            <div className="tabs-wrapper" ref={tabsWrapperRef}>
              <ul 
                className="tabs-list" 
                ref={tabsListRef}
                style={{ transform: `translateX(-${scrollPosition}px)` }}
              >
                {openTasks.map(task => (
                  <li 
                    key={task.id}
                    className={`tab-item ${activeTab === `task-${task.id}` ? 'active' : ''}`}
                    data-status={task.status}
                    onClick={() => setActiveTab(`task-${task.id}`)}
                  >
                    Заказ №{task.id}
                    <button 
                      className="close-tab"
                      onClick={(e) => handleCloseTask(task.id, e)}
                    >
                      <i className="fas fa-times"></i>
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <button 
              className="btn-icon scroll-button"
              onClick={() => handleScroll('right')}
              disabled={!canScrollRight}
            >
              <i className="fas fa-chevron-right"></i>
            </button>
          </div>
        )}
      </div>

      <div className="order-list-content">
        {activeTab.startsWith('task-') ? (
          renderTaskCard(openTasks.find(task => `task-${task.id}` === activeTab))
        ) : (
          <>
            <div className="filters-container">
              <div className="search-box">
                <i className="fas fa-search"></i>
                <input
                  type="text"
                  placeholder="Поиск заказов..."
                  value={currentFilters.search || ''}
                  onChange={(e) => updateFilters({ search: e.target.value })}
                  className="form-control"
                />
              </div>

              <div className="filter-group">
                {activeTab !== 'pending' && (
                  <select
                    className="form-select filter-select"
                    value={currentFilters.status || ''}
                    onChange={(e) => updateFilters({ status: e.target.value })}
                  >
                    <option value="">Все статусы</option>
                    {getStatusOptions(activeTab).map(status => (
                      <option key={status.value} value={status.value}>
                        {status.label}
                      </option>
                    ))}
                  </select>
                )}

                <div className="date-range">
                  <input
                    type="date"
                    className="form-control date-input"
                    value={currentFilters.dateFrom || ''}
                    onChange={(e) => updateFilters({ dateFrom: e.target.value })}
                  />
                  <span className="date-separator">—</span>
                  <input
                    type="date"
                    className="form-control date-input"
                    value={currentFilters.dateTo || ''}
                    onChange={(e) => updateFilters({ dateTo: e.target.value })}
                  />
                </div>
              </div>

              <button
                className="btn-icon reset-button"
                onClick={resetFilters}
                title="Сбросить все фильтры"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>

            <div className="order-table-container">
              {sortedOrders.length > 0 ? (
                <table className="order-table">
                  <thead>
                    <tr>
                      <th onClick={() => handleSort('id')}>
                        <span>№</span>
                        <span className="sort-icon">
                          <i className="fas fa-sort"></i>
                          {getSortIcon('id')}
                        </span>
                      </th>
                      <th onClick={() => handleSort('route')}>
                        <span>Маршрут</span>
                        <span className="sort-icon">
                          <i className="fas fa-sort"></i>
                          {getSortIcon('route')}
                        </span>
                      </th>
                      <th onClick={() => handleSort('dateTime')}>
                        <span>Время</span>
                        <span className="sort-icon">
                          <i className="fas fa-sort"></i>
                          {getSortIcon('dateTime')}
                        </span>
                      </th>
                      <th onClick={() => handleSort('status')}>
                        <span>Статус</span>
                        <span className="sort-icon">
                          <i className="fas fa-sort"></i>
                          {getSortIcon('status')}
                        </span>
                      </th>
                      <th>Транспорт</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedOrders.map(order => (
                      <tr 
                        key={order.id} 
                        onClick={() => handleRowClick(order.id)}
                        className="clickable-row"
                      >
                        <td>{order.id}</td>
                        <td>{getRouteString(order)}</td>
                        <td>{order.route?.dateTime ? new Date(order.route.dateTime).toLocaleString() : '—'}</td>
                        <td>
                          <span className={`status-badge status-${order.status}`}>
                            {getStatusText(order.status)}
                          </span>
                        </td>
                        <td>{order.assignedTransport?.vehicleNumber || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="no-orders text-center p-5">
                  <i className="fas fa-inbox mb-3" style={{ fontSize: '2rem', color: 'var(--gray-400)' }}></i>
                  <h4>Заказы не найдены</h4>
                  <p className="text-gray-500">По выбранным фильтрам не найдено ни одного заказа</p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default OrderList; 