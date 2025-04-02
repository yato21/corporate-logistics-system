import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { updateOrderStatus } from '../../../redux/slices/orderSlice';
import './AssignTransport.css';
import dayjs from 'dayjs';

const AssignTransport = ({ order, onClose }) => {
  const [transportData, setTransportData] = useState({
    vehicleId: '',
    driverId: '',
    estimatedStartTime: '',
    estimatedEndTime: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const dispatch = useDispatch();

  const handleChange = (e) => {
    setTransportData({
      ...transportData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const startTime = dayjs(transportData.estimatedStartTime);
      const endTime = dayjs(transportData.estimatedEndTime);

      await dispatch(updateOrderStatus({
        orderId: order.id,
        status: 'assigned',
        driverId: transportData.driverId,
        assignedTransportId: transportData.vehicleId,
        startTime: startTime.isValid() ? startTime.toISOString() : null,
        endTime: endTime.isValid() ? endTime.toISOString() : null
      })).unwrap();
      
      onClose();
    } catch (error) {
      console.error('Ошибка при назначении транспорта:', error);
      setError('Произошла ошибка при назначении транспорта');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="assign-transport-overlay">
      <div className="assign-transport-modal">
        <h2>Назначение транспорта</h2>
        <div className="order-info">
          <p><strong>Заказ №{order.id}</strong></p>
          <p>Маршрут: {order.pickupLocation} → {order.deliveryLocation}</p>
          <p>Груз: {order.cargoType}</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Транспортное средство:</label>
            <select
              name="vehicleId"
              value={transportData.vehicleId}
              onChange={handleChange}
              required
            >
              <option value="">Выберите транспорт</option>
              {/* Здесь будет список доступных ТС */}
            </select>
          </div>

          <div className="form-group">
            <label>Водитель:</label>
            <select
              name="driverId"
              value={transportData.driverId}
              onChange={handleChange}
              required
            >
              <option value="">Выберите водителя</option>
              {/* Здесь будет список доступных водителей */}
            </select>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Планируемое время начала:</label>
              <input
                type="datetime-local"
                name="estimatedStartTime"
                value={transportData.estimatedStartTime}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Планируемое время завершения:</label>
              <input
                type="datetime-local"
                name="estimatedEndTime"
                value={transportData.estimatedEndTime}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-actions">
            <button type="button" onClick={onClose} className="cancel-btn">
              Отмена
            </button>
            <button type="submit" className="submit-btn">
              Назначить
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AssignTransport; 