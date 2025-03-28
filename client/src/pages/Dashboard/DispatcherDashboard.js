import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchOrders } from '../../redux/slices/orderSlice';
import OrderList from '../../components/order/OrderList/OrderList';
import AssignTransport from '../../components/dispatcher/AssignTransport/AssignTransport';
import './Dashboard.css';

const DispatcherDashboard = () => {
  const [selectedOrder, setSelectedOrder] = useState(null);
  const dispatch = useDispatch();
  const { items: orders, loading } = useSelector(state => state.orders);

  useEffect(() => {
    dispatch(fetchOrders());
  }, [dispatch]);

  const handleAssignTransport = (orderId) => {
    setSelectedOrder(orders.find(order => order.id === orderId));
  };

  if (loading) {
    return (
      <div className="d-flex justify-center align-center" style={{ height: '200px' }}>
        <i className="fas fa-spinner fa-spin"></i>
        <span className="ml-2">Загрузка...</span>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="card">
        <div className="d-flex justify-between align-center mb-4 border-b pb-3">
          <h1 className="text-xl font-semibold">Панель диспетчера</h1>
        </div>

        <OrderList 
          orders={orders}
          userRole="dispatcher"
          onAssignTransport={handleAssignTransport}
        />

        {selectedOrder && (
          <AssignTransport 
            order={selectedOrder}
            onClose={() => setSelectedOrder(null)}
          />
        )}
      </div>
    </div>
  );
};

export default DispatcherDashboard; 