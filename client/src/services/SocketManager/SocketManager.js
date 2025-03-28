import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import socketService from '../../services/socket';

const SocketManager = () => {
  const isAuthenticated = useSelector(state => state.auth.isAuthenticated);

  useEffect(() => {
    if (isAuthenticated) {
      socketService.connect();
    } else {
      socketService.disconnect();
    }

    return () => {
      socketService.disconnect();
    };
  }, [isAuthenticated]);

  return null;
};

export default SocketManager; 