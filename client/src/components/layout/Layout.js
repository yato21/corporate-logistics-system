import { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { logout } from '../../redux/slices/authSlice';
import Modal from '../common/Modal/Modal';
import OrderWizard from '../order/OrderWizard/OrderWizard';
import { createOrder } from '../../redux/slices/orderSlice';
import './Layout.css';

const Layout = () => {
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(window.innerWidth <= 768);
  const [showCreateOrder, setShowCreateOrder] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef(null);
  const { user } = useSelector(state => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  // Обработка изменения размера окна
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 768) {
        setSidebarCollapsed(true);
      }
    };
    
    window.addEventListener('resize', handleResize);
    handleResize(); // Проверяем сразу при загрузке
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Обработчик клика вне меню для его закрытия
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const handleProfileClick = () => {
    navigate('/profile');
    setShowUserMenu(false);
  };

  const toggleSidebar = () => {
    setSidebarCollapsed(!isSidebarCollapsed);
  };
  
  // Закрываем сайдбар при клике на оверлей
  const handleOverlayClick = () => {
    if (window.innerWidth <= 768) {
      setSidebarCollapsed(true);
    }
  };

  const handleCreateOrderSubmit = async (orderData) => {
    try {
      await dispatch(createOrder({ ...orderData, customerId: user.id })).unwrap();
      setShowCreateOrder(false);
    } catch (error) {
      console.error('Ошибка при создании заказа:', error);
    }
  };

  const getMenuItems = () => {
    if (!user) return [];
    
    const items = [];
    
    switch (user.role) {
      case 'customer':
        items.push({ 
          icon: 'fas fa-clipboard-list',
          text: 'Управление заказами',
          path: '/customer'
        },
        { 
          icon: 'fas fa-calendar-alt',
          text: 'Календарь поездок',
          path: '/calendar'
        });
        break;
      case 'dispatcher':
        items.push({ 
          icon: 'fas fa-tasks',
          text: 'Панель диспетчера',
          path: '/dispatcher'
        });
        break;
      case 'driver':
        items.push({ 
          icon: 'fas fa-truck',
          text: 'Панель водителя',
          path: '/driver'
        },
        { 
          icon: 'fas fa-calendar-alt',
          text: 'Календарь поездок',
          path: '/calendar'
        });
        break;
    }

    items.push({ 
      icon: 'fas fa-user',
      text: 'Профиль',
      path: '/profile'
    });

    return items;
  };

  const getUserName = () => {
    if (!user) return '';
    const fullName = user.firstName || user.name || user.fullName || user.username || '';
    const names = fullName.split(' ');
    const name = names.length >= 2 ? names[1] : names[0];
    return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
  };

  const getUserInitials = () => {
    if (!user) return '';
    const fullName = user.firstName || user.name || user.fullName || user.username || '';
    const names = fullName.split(' ');
    if (names.length >= 2) {
      return `${names[0][0]}${names[1][0]}`.toUpperCase();
    }
    return names[0][0].toUpperCase();
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'Доброе утро!';
    if (hour >= 12 && hour < 18) return 'Добрый день!';
    if (hour >= 18 && hour < 24) return 'Добрый вечер!';
    return 'Доброй ночи!';
  };

  if (!user) {
    return null;
  }

  return (
    <div className="layout">
      {/* Затемнение фона при открытом сайдбаре на мобильных */}
      <div 
        className={`sidebar-overlay ${!isSidebarCollapsed && window.innerWidth <= 768 ? 'active' : ''}`} 
        onClick={handleOverlayClick}
      />
      
      <header className={`header ${isSidebarCollapsed ? 'header-collapsed' : 'header-expanded'}`}>
        <div className="header-left">
          <div className="header-buttons">
            <button className="btn-icon menu-toggle" onClick={toggleSidebar}>
              <i className={`fas ${isSidebarCollapsed ? 'fa-bars' : 'fa-outdent'}`}></i>
            </button>
            {user.role === 'customer' && (
              <button className="btn-icon add-order-btn" onClick={() => setShowCreateOrder(true)}>
                <i className="fas fa-plus"></i>
              </button>
            )}
          </div>
          <span className="header-title">
            {getGreeting()}, <span className="gradient-text">{getUserName()}</span>
          </span>
        </div>
        <div className="header-actions" ref={userMenuRef}>
          <div 
            className="user-avatar clickable" 
            onClick={() => setShowUserMenu(!showUserMenu)}
          >
            <span className="user-initials">{getUserInitials()}</span>
          </div>
          
          {showUserMenu && (
            <div className="user-menu">
              <button className="user-menu-item" onClick={handleProfileClick}>
                <i className="fas fa-user"></i>
                Профиль
              </button>
              <div className="user-menu-divider"></div>
              <button className="user-menu-item" onClick={handleLogout}>
                <i className="fas fa-sign-out-alt"></i>
                Выйти
              </button>
            </div>
          )}
        </div>
      </header>

      <aside className={`sidebar ${isSidebarCollapsed ? 'sidebar-collapsed' : 'active'}`}>
        <div className="sidebar-header">
          <button className="btn-icon" onClick={toggleSidebar}>
            <i className="fas fa-outdent"></i>
          </button>
          {user.role === 'customer' && (
            <button className="btn-icon" onClick={() => setShowCreateOrder(true)}>
              <i className="fas fa-plus"></i>
            </button>
          )}
        </div>

        <nav className="sidebar-nav">
          {getMenuItems().map(item => (
            <NavLink 
              key={item.path}
              to={item.path}
              className={({ isActive }) => 
                `nav-item ${isActive ? 'active' : ''}`
              }
              onClick={() => window.innerWidth <= 768 && setSidebarCollapsed(true)}
            >
              <i className={item.icon}></i>
              <span>{item.text}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button className="logout-btn" onClick={handleLogout}>
            <i className="fas fa-sign-out-alt"></i>
            <span>Выйти</span>
          </button>
        </div>
      </aside>

      <main className={`main-content ${isSidebarCollapsed ? 'main-content-expanded' : ''}`}>
        <Outlet />
      </main>

      <Modal isOpen={showCreateOrder} onClose={() => setShowCreateOrder(false)}>
        <OrderWizard
          onSubmit={handleCreateOrderSubmit}
          onCancel={() => setShowCreateOrder(false)}
        />
      </Modal>
    </div>
  );
};

export default Layout; 