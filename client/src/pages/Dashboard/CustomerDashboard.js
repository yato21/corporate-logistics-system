import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchOrders, createOrder, updateOrder } from '../../redux/slices/orderSlice';
import OrderList from '../../components/order/OrderList/OrderList';
import OrderWizard from '../../components/order/OrderWizard/OrderWizard';
import Modal from '../../components/common/Modal/Modal';
import './Dashboard.css';

const CustomerDashboard = () => {
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);
  const dispatch = useDispatch();
  const { items: orders, loading, error } = useSelector(state => state.orders);
  const { user } = useSelector(state => state.auth);

  useEffect(() => {
    dispatch(fetchOrders());
  }, [dispatch]);

  // Обработчик для редактирования заказа
  const handleEditOrder = (orderData) => {
    // Проверяем, что заказ еще не редактируется
    if (!editingOrder) {
      setEditingOrder(orderData);
      setShowOrderForm(true);
    }
  };

  const handleOrderSubmit = async (orderData) => {
    try {
      if (editingOrder) {
        await dispatch(updateOrder({
          orderId: editingOrder.id,
          orderData: { 
            ...orderData, 
            customerId: user.id,
            customerInfo: orderData.customerInfo
          }
        })).unwrap();
      } else {
        const orderPayload = {
          ...orderData,
          customerId: user.id,
          customerInfo: orderData.customerInfo,
          vehicleTypeId: typeof orderData.vehicleTypeId === 'object' ? 
            orderData.vehicleTypeId.id : 
            orderData.vehicleTypeId,
          comment: orderData.documents?.comment || orderData.comment || '',
        };
        
        await dispatch(createOrder(orderPayload)).unwrap();
      }
      setShowOrderForm(false);
      setEditingOrder(null);
    } catch (error) {
      console.error('Ошибка при обработке заказа:', error);
      // Добавить уведомление об ошибке для пользователя
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-center align-center" style={{ height: '200px' }}>
        <i className="fas fa-spinner fa-spin"></i>
        <span className="ml-2">Загрузка...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-danger text-center">
        Ошибка: {error}
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="card">
        <div className="d-flex justify-between align-center mb-4 border-b pb-3">
          <h1 className="text-xl font-semibold">Панель заказчика</h1>
          <div className="d-flex gap-3">
            <button 
              className="btn btn-primary" 
              onClick={() => setShowOrderForm(true)}
            >
              <i className="fas fa-plus"></i>
              Создать заказ
            </button>
          </div>
        </div>

        <OrderList 
          orders={orders.filter(order => order.customerId === user.id)} 
          onEditOrder={handleEditOrder}
          userRole={user.role}
        />
      </div>

      <Modal 
        isOpen={showOrderForm} 
        onClose={() => {
          setShowOrderForm(false);
          setEditingOrder(null);
        }}
      >
        <OrderWizard
          initialData={editingOrder}
          onSubmit={handleOrderSubmit}
          onCancel={() => {
            setShowOrderForm(false);
            setEditingOrder(null);
          }}
        />
      </Modal>
    </div>
  );
};

export default CustomerDashboard; 