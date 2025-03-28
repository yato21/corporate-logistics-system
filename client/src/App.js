import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Provider, useDispatch, useSelector } from 'react-redux';
import { store } from './redux/store';
import { initAuth } from './redux/slices/authSlice';
import Login from './pages/Auth/Login';
import Layout from './components/layout/Layout';
import CustomerDashboard from './pages/Dashboard/CustomerDashboard';
import DispatcherDashboard from './pages/Dashboard/DispatcherDashboard';
import DriverDashboard from './pages/Dashboard/DriverDashboard';
import Profile from './pages/Profile/Profile';
import TaskCard from './components/common/TaskCard/TaskCard';
import TripCalendar from './pages/Calendar/TripCalendar';
import SocketManager from './services/SocketManager/SocketManager';
import SocketDebug from './components/SocketDebug';

const ProtectedRoute = ({ children, roles }) => {
  const { user, isAuthenticated } = useSelector(state => state.auth);
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (roles && !roles.includes(user.role)) {
    // Редирект на соответствующую роли страницу
    switch (user.role) {
      case 'customer':
        return <Navigate to="/customer" replace />;
      case 'driver':
        return <Navigate to="/driver" replace />;
      case 'dispatcher':
        return <Navigate to="/dispatcher" replace />;
      default:
        return <Navigate to="/login" replace />;
    }
  }

  return children;
};

const AppContent = () => {
  const dispatch = useDispatch();
  const { isAuthenticated } = useSelector(state => state.auth);
  const location = useLocation();

  useEffect(() => {
    dispatch(initAuth());
  }, [dispatch]);

  // Добавляем редирект на логин если пользователь не аутентифицирован
  if (!isAuthenticated && location.pathname !== '/login') {
    return <Navigate to="/login" replace />;
  }

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      
      <Route element={<Layout />}>
        <Route 
          path="/customer" 
          element={
            <ProtectedRoute roles={['customer']}>
              <CustomerDashboard />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/dispatcher" 
          element={
            <ProtectedRoute roles={['dispatcher']}>
              <DispatcherDashboard />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/driver" 
          element={
            <ProtectedRoute roles={['driver']}>
              <DriverDashboard />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/profile" 
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/calendar" 
          element={
            <ProtectedRoute roles={['customer', 'driver']}>
              <TripCalendar />
            </ProtectedRoute>
          } 
        />
      </Route>

      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />

      <Route 
        path="/tasks/:taskId" 
        element={
          <ProtectedRoute>
            <TaskCard />
          </ProtectedRoute>
        } 
      />
    </Routes>
  );
};

function App() {
  return (
    <Provider store={store}>
      <Router>
        <SocketManager />
        {process.env.NODE_ENV === 'development' && <SocketDebug />}
        <AppContent />
      </Router>
    </Provider>
  );
}

export default App;
