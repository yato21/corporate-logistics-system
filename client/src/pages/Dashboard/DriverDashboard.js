import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchOrders } from '../../redux/slices/orderSlice';
import OrderList from '../../components/order/OrderList/OrderList';
import './Dashboard.css';

const DriverDashboard = () => {
  const dispatch = useDispatch();
  const { items: orders, loading } = useSelector(state => state.orders);
  const { user } = useSelector(state => state.auth);

  useEffect(() => {
    dispatch(fetchOrders());
  }, [dispatch]);

  if (loading) {
    return (
      <div className="d-flex justify-center align-center" style={{ height: '200px' }}>
        <i className="fas fa-spinner fa-spin"></i>
        <span className="ml-2">Загрузка...</span>
      </div>
    );
  }

  // Фильтруем заказы только для текущего водителя
  const driverOrders = orders.filter(order => order.driverId === user.id);

  return (
    <div className="dashboard">
      <div className="card">
        <div className="d-flex justify-between align-center mb-4 border-b pb-3">
          <h1 className="text-xl font-semibold">Панель водителя</h1>
        </div>

        <OrderList 
          orders={driverOrders}
          userRole="driver"
        />
      </div>
    </div>
  );
};

export default DriverDashboard; 