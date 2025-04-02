import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DateTimePicker, TimePicker } from '@mui/x-date-pickers';
import dayjs from 'dayjs';
import 'dayjs/locale/ru';
import Notification from '../../common/Notification/Notification';
import { vehicles } from '../../../data/vehicles';
import './OrderSteps.css';
import TimePickerWidget, { TIME_CONSTRAINTS } from '../../common/TimePickerWidget/TimePickerWidget';

// CustomerInfo компонент
export const CustomerInfo = ({ data, onNext, onCancel }) => {
  const { user } = useSelector(state => state.auth);
  const [notification, setNotification] = useState(null);
  const [contactData, setContactData] = useState({
    fullName: user.fullName,
    position: user.position,
    subdivision: user.subdivision,
    contact: user.contact || '',
    email: user.email
  });

  const formatPhoneNumber = (value) => {
    const digits = value.replace(/\D/g, '');
    if (!digits) return '';
    if (digits.length <= 1) return `+7`;
    if (digits.length <= 4) return `+7 (${digits.slice(1)}`;
    if (digits.length <= 7) return `+7 (${digits.slice(1, 4)}) ${digits.slice(4)}`;
    if (digits.length <= 9) return `+7 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
    return `+7 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7, 9)}-${digits.slice(9, 11)}`;
  };

  const handleContactChange = (e) => {
    const value = e.target.value;
    const digits = value.replace(/\D/g, '');
    
    if (digits.length <= 11) {
      setContactData(prev => ({
        ...prev,
        contact: formatPhoneNumber(value)
      }));
    }
  };

  const handleNext = () => {
    const digitsOnly = contactData.contact.replace(/\D/g, '');
    if (digitsOnly.length !== 11) {
      setNotification({
        type: 'error',
        message: 'Введите корректный номер телефона'
      });
      return;
    }
    onNext({ customerInfo: contactData });
  };

  return (
    <div className="step-content">
      {notification && (
        <Notification
          type={notification.type}
          message={notification.message}
          onClose={() => setNotification(null)}
        />
      )}
      
      <h3>Данные заказчика</h3>
      
      <div className="form-group">
        <label>ФИО:</label>
        <input
          type="text"
          className="form-control"
          value={contactData.fullName}
          disabled
        />
      </div>

      <div className="form-group">
        <label>Должность:</label>
        <input
          type="text"
          className="form-control"
          value={contactData.position}
          disabled
        />
      </div>

      <div className="form-group">
        <label>Подразделение:</label>
        <input
          type="text"
          className="form-control"
          value={contactData.subdivision}
          disabled
        />
      </div>

      <div className="form-group">
        <label>Контактный телефон:</label>
        <input
          type="text"
          className="form-control"
          value={contactData.contact}
          onChange={handleContactChange}
          placeholder="+7 (___) ___-__-__"
        />
      </div>

      <div className="form-group">
        <label>Email:</label>
        <input
          type="email"
          className="form-control"
          value={contactData.email}
          disabled
        />
      </div>

      <div className="step-navigation">
        <button className="btn btn-secondary" onClick={onCancel}>
          <i className="fas fa-times"></i>
          Отмена
        </button>
        <button className="btn btn-primary" onClick={handleNext}>
          <i className="fas fa-arrow-right"></i>
          Далее
        </button>
      </div>
    </div>
  );
};

// VehicleSelection компонент
export const VehicleSelection = ({ data, onNext, onBack }) => {
  const [selectedVehicle, setSelectedVehicle] = useState(
    data.vehicleTypeId ? 
    vehicles.find(v => v.id === Number(data.vehicleTypeId)) || data.vehicle : 
    null
  );
  const [notification, setNotification] = useState(null);

  const handleNext = () => {
    if (!selectedVehicle) {
      setNotification({
        type: 'error',
        message: 'Выберите транспортное средство'
      });
      return;
    }
    const updatedData = {
      vehicleTypeId: selectedVehicle.id,
      vehicle: selectedVehicle,
      documents: {
        ...data.documents,
        // Для легкового всегда удаляем накладную
        waybill: selectedVehicle.type === 'passenger' ? null : data.documents?.waybill,
        // Устанавливаем флаг удаления для легкового
        removeWaybill: selectedVehicle.type === 'passenger'
      }
    };
    
    onNext(updatedData);
  };

  return (
    <div className="step-content">
      {notification && (
        <Notification
          type={notification.type}
          message={notification.message}
          onClose={() => setNotification(null)}
        />
      )}
      
      <h3>Выбор транспорта</h3>
      
      <div className="vehicles-grid">
        {vehicles.map(vehicle => (
          <div 
            key={vehicle.id}
            className={`vehicle-card ${selectedVehicle?.id === vehicle.id ? 'selected' : ''}`}
            onClick={() => setSelectedVehicle(vehicle)}
          >
            <img src={vehicle.image} alt={vehicle.name} />
            <h4>{vehicle.name}</h4>
            <p>{vehicle.description}</p>
            <div className="specs">
              <h5>Характеристики:</h5>
              <ul>
                {vehicle.type === 'passenger' ? (
                  <li>Вместимость: {vehicle.specs.capacity}</li>
                ) : (
                  <>
                    <li>Грузоподъёмность: {vehicle.specs.capacity}</li>
                    <li>Объем: {vehicle.specs.volume}</li>
                  </>
                )}
                {vehicle.specs.features.map((feature, index) => (
                  <li key={index}>{feature}</li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>

      <div className="step-navigation">
        <button className="btn btn-secondary" onClick={onBack}>
          <i className="fas fa-arrow-left"></i>
          Назад
        </button>
        <button className="btn btn-primary" onClick={handleNext}>
          <i className="fas fa-arrow-right"></i>
          Далее
        </button>
      </div>
    </div>
  );
};

// RouteSelection компонент
export const RouteSelection = ({ data, onNext, onBack }) => {
  const isValidDate = (date) => {
    const currentDate = dayjs().startOf('day');
    const checkDate = dayjs(date).startOf('day');
    
    if (checkDate.isBefore(currentDate)) {
      return {
        isValid: false,
        error: 'Нельзя выбрать прошедшую дату'
      };
    }

    const dayOfWeek = checkDate.day();
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      return {
        isValid: false,
        error: 'В выходные дни заказ невозможен'
      };
    }

    return { isValid: true };
  };

  const [routeData, setRouteData] = useState(() => {
    let validDateTime = data.route?.dateTime ? dayjs(data.route.dateTime) : dayjs();
    
    // Добавляем 20 минут к текущему времени
    const minDateTime = dayjs().add(20, 'minutes');
    
    // Если выбранное время меньше минимального, используем минимальное
    if (validDateTime.isBefore(minDateTime)) {
      validDateTime = minDateTime;
    }
    
    // Округляем минуты до ближайшего десятка
    const currentMinute = validDateTime.minute();
    const roundedMinutes = Math.ceil(currentMinute / 10) * 10;
    
    if (roundedMinutes <= 50) {
      validDateTime = validDateTime.minute(roundedMinutes);
    } else {
      validDateTime = validDateTime.add(1, 'hour').minute(0);
    }
    
    const dateValidation = isValidDate(validDateTime);
    if (!dateValidation.isValid) {
      let nextDate = validDateTime.add(1, 'day').hour(8).minute(0);
      while (!isValidDate(nextDate).isValid) {
        nextDate = nextDate.add(1, 'day');
      }
      validDateTime = nextDate;
    }

    const hour = validDateTime.hour();
    if (hour < 8) {
      validDateTime = validDateTime.hour(8).minute(0);
    } else if (hour >= 17) {
      let nextDate = validDateTime.add(1, 'day').hour(8).minute(0);
      while (!isValidDate(nextDate).isValid) {
        nextDate = nextDate.add(1, 'day');
      }
      validDateTime = nextDate;
    }

    let endDateTime;
    const endMinutes = validDateTime.minute();
    if (endMinutes <= 40) {
      endDateTime = validDateTime.minute(endMinutes + 20);
    } else {
      endDateTime = validDateTime.add(1, 'hour').minute(0);
    }

    return {
      startPoint: data.route?.startPoint || '',
      endPoints: data.route?.endPoints || [''],
      dateTime: validDateTime,
      estimatedEndTime: data.route?.estimatedEndTime ? 
        dayjs(data.route.estimatedEndTime) : 
        endDateTime
    };
  });

  const [errors, setErrors] = useState({});
  const [notification, setNotification] = useState(null);

  const buildings = [
    'Корпус 1', 'Корпус 2', 'Корпус 3',
    'Модуль 1', 'Модуль 2',
  ];

  const getAvailableBuildingsForPoint = (index) => {
    const unavailableBuildings = new Set();
    
    if (index === 0) {
      unavailableBuildings.add(routeData.startPoint);
    }
    
    if (index > 0) {
      unavailableBuildings.add(routeData.endPoints[index - 1]);
    }
    
    if (index < routeData.endPoints.length - 1) {
      unavailableBuildings.add(routeData.endPoints[index + 1]);
    }

    return buildings.filter(building => !unavailableBuildings.has(building));
  };

  const getAvailableBuildingsForStart = () => {
    return buildings.filter(building => building !== routeData.endPoints[0]);
  };

  const handleAddEndPoint = () => {
    setRouteData(prev => ({
      ...prev,
      endPoints: [...prev.endPoints, '']
    }));
  };

  const handleRemoveEndPoint = (index) => {
    setRouteData(prev => ({
      ...prev,
      endPoints: prev.endPoints.filter((_, i) => i !== index)
    }));
  };

  const handleNext = () => {
    setNotification(null);
    
    const fieldErrors = {};
    let errorMessage = '';
    
    if (!routeData.startPoint) {
      fieldErrors.startPoint = true;
      errorMessage = 'Выберите начальную точку маршрута';
    }
    
    const hasEmptyEndPoint = routeData.endPoints.some(point => !point);
    if (hasEmptyEndPoint) {
      fieldErrors.endPoints = true;
      errorMessage = errorMessage || 'Выберите все конечные точки маршрута';
    }
    
    if (!routeData.dateTime) {
      fieldErrors.dateTime = true;
      errorMessage = errorMessage || 'Выберите дату и время';
    }
    
    if (!routeData.estimatedEndTime) {
      fieldErrors.estimatedEndTime = true;
      errorMessage = errorMessage || 'Выберите предполагаемое время окончания';
    }
    
    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors);
      setNotification({
        type: 'error',
        message: errorMessage
      });
      return;
    }

    onNext({ route: routeData });
  };

  // Оставляем функции для работы с временем
  const handleStartHourClick = (hour) => {
    const newDateTime = routeData.dateTime.hour(hour);
    setRouteData(prev => ({
      ...prev,
      dateTime: newDateTime
    }));
  };

  const handleStartMinuteClick = (minute) => {
    const newDateTime = routeData.dateTime.minute(minute);
    setRouteData(prev => ({
      ...prev,
      dateTime: newDateTime
    }));
  };

  const handleEndHourClick = (hour) => {
    const newEndTime = routeData.estimatedEndTime.hour(hour);
    setRouteData(prev => ({
      ...prev,
      estimatedEndTime: newEndTime
    }));
  };

  const handleEndMinuteClick = (minute) => {
    const newEndTime = routeData.estimatedEndTime.minute(minute);
    setRouteData(prev => ({
      ...prev,
      estimatedEndTime: newEndTime
    }));
  };

  const validateEndTime = (endTime) => {
    if (!endTime || !endTime.isValid()) {
      return routeData.estimatedEndTime;
    }

    let validDateTime = endTime;
    const minEndTime = routeData.dateTime.add(20, 'minutes');
    const maxEndTime = dayjs().hour(17).minute(0);

    // Проверяем минимальное время (время начала + 10 минут)
    if (validDateTime.isBefore(minEndTime)) {
      validDateTime = minEndTime;
    }

    // Округляем минуты до ближайшего десятка
    const currentMinute = validDateTime.minute();
    const roundedMinutes = Math.ceil(currentMinute / 10) * 10;

    if (roundedMinutes <= 50) {
      validDateTime = validDateTime.minute(roundedMinutes);
    } else {
      validDateTime = validDateTime.add(1, 'hour').minute(0);
    }

    // Проверяем, не превышает ли время 17:00
    if (validDateTime.hour() > 17 || (validDateTime.hour() === 17 && validDateTime.minute() > 0)) {
      validDateTime = validDateTime.hour(17).minute(0);
    }

    return validDateTime;
  };

  const handleDateTimeChange = (newValue) => {
    setRouteData(prev => ({
      ...prev,
      dateTime: newValue
    }));
  };

  return (
    <div className="step-content">
      {notification && (
        <Notification
          type={notification.type}
          message={notification.message}
          onClose={() => setNotification(null)}
        />
      )}
      
      <h3>Маршрут</h3>

      <div className="form-group">
        <label>Начальная точка:</label>
        <select
          value={routeData.startPoint}
          onChange={(e) => setRouteData(prev => ({ ...prev, startPoint: e.target.value }))}
          className={`form-select ${errors.startPoint ? 'error' : ''}`}
        >
          <option value="">Выберите здание</option>
          {getAvailableBuildingsForStart().map(building => (
            <option key={building} value={building}>
              {building}
            </option>
          ))}
        </select>
      </div>

      <div className="form-group end-points-container">
        <label>Конечная точка:</label>
        
        <div className="end-points-list">
          {routeData.endPoints.map((point, index) => (
            <div key={index} className="end-point-row">
              <select
                value={point}
                onChange={(e) => {
                  const newEndPoints = [...routeData.endPoints];
                  newEndPoints[index] = e.target.value;
                  setRouteData(prev => ({ ...prev, endPoints: newEndPoints }));
                }}
                className={`form-select ${errors.endPoints ? 'error' : ''}`}
              >
                <option value="">Выберите здание</option>
                {getAvailableBuildingsForPoint(index).map(building => (
                  <option key={building} value={building}>
                    {building}
                  </option>
                ))}
              </select>
              
              {index === 0 && (
                <button
                  className="btn-icon btn-route-action"
                  onClick={handleAddEndPoint}
                  title="Добавить точку"
                  disabled={routeData.endPoints.length >= 3}
                >
                  <i className="fas fa-plus"></i>
                </button>
              )}
              
              {index > 0 && (
                <button
                  className="btn-icon btn-route-action btn-remove"
                  onClick={() => handleRemoveEndPoint(index)}
                  title="Удалить точку"
                >
                  <i className="fas fa-times"></i>
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="form-group">
        <label>Дата и время:</label>
        <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="ru">
          <DateTimePicker
            value={routeData.dateTime}
            onChange={handleDateTimeChange}
            className={errors.dateTime ? 'error' : ''}
            minutesStep={20}
            ampm={false}
            shouldDisableDate={TIME_CONSTRAINTS.shouldDisableBusinessDate}
            views={['year', 'month', 'day', 'hours', 'minutes']}
            viewRenderers={{
              hours: () => (
                <TimePickerWidget
                  type="start"
                  selectedHour={routeData.dateTime.hour()}
                  selectedMinute={routeData.dateTime.minute()}
                  onHourChange={handleStartHourClick}
                  onMinuteChange={handleStartMinuteClick}
                  constraints={{
                    ...TIME_CONSTRAINTS.BUSINESS_HOURS,
                    minDateTime: dayjs()
                  }}
                  selectedDate={routeData.dateTime}
                />
              )
            }}
            slotProps={{
              textField: {
                variant: "outlined",
                error: !!errors.dateTime,
                helperText: errors.dateTime,
                fullWidth: true,
                required: true,
                onBlur: () => {
                  if (routeData.dateTime && routeData.dateTime.isValid()) {
                    const validDateTime = validateEndTime(routeData.dateTime);
                    setRouteData(prev => ({
                      ...prev,
                      dateTime: validDateTime
                    }));
                  }
                },
                onKeyDown: (e) => {
                  if (e.key === 'Enter' && routeData.dateTime && routeData.dateTime.isValid()) {
                    const validDateTime = validateEndTime(routeData.dateTime);
                    setRouteData(prev => ({
                      ...prev,
                      dateTime: validDateTime
                    }));
                  }
                }
              }
            }}
          />
        </LocalizationProvider>
      </div>

      <div className="form-group">
        <label>Предполагаемое время окончания:</label>
        <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="ru">
          <TimePicker
            value={routeData.estimatedEndTime}
            onChange={(newValue) => {
              setRouteData(prev => ({
                ...prev,
                estimatedEndTime: newValue
              }));
            }}
            className={errors.estimatedEndTime ? 'error' : ''}
            minutesStep={20}
            ampm={false}
            views={['hours', 'minutes']}
            viewRenderers={{
              hours: () => (
                <TimePickerWidget
                  type="end"
                  selectedHour={routeData.estimatedEndTime.hour()}
                  selectedMinute={routeData.estimatedEndTime.minute()}
                  onHourChange={handleEndHourClick}
                  onMinuteChange={handleEndMinuteClick}
                  constraints={TIME_CONSTRAINTS.BUSINESS_HOURS}
                  referenceTime={routeData.dateTime}
                />
              )
            }}
            slotProps={{
              textField: {
                variant: "outlined",
                error: !!errors.estimatedEndTime,
                helperText: errors.estimatedEndTime,
                fullWidth: true,
                required: true,
                onBlur: () => {
                  if (routeData.estimatedEndTime && routeData.estimatedEndTime.isValid()) {
                    const validEndTime = validateEndTime(routeData.estimatedEndTime);
                    setRouteData(prev => ({
                      ...prev,
                      estimatedEndTime: validEndTime
                    }));
                  }
                },
                onKeyDown: (e) => {
                  if (e.key === 'Enter' && routeData.estimatedEndTime && routeData.estimatedEndTime.isValid()) {
                    const validEndTime = validateEndTime(routeData.estimatedEndTime);
                    setRouteData(prev => ({
                      ...prev,
                      estimatedEndTime: validEndTime
                    }));
                  }
                }
              }
            }}
          />
        </LocalizationProvider>
      </div>

      <div className="step-navigation">
        <button className="btn btn-secondary" onClick={onBack}>
          <i className="fas fa-arrow-left"></i>
          Назад
        </button>
        <button className="btn btn-primary" onClick={handleNext}>
          <i className="fas fa-arrow-right"></i>
          Далее
        </button>
      </div>
    </div>
  );
};

// DocumentsInfo компонент
export const DocumentsInfo = ({ data, onNext, onBack }) => {
  const MAX_COMMENT_LENGTH = 500;
  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

  const [documents, setDocuments] = useState({
    comment: data.documents?.comment || data.comment || '',
    waybill: data.documents?.waybill || null,
    waybillName: data.documents?.waybillName || (data.documents?.waybill?.name) || '',
    removeWaybill: false
  });
  const [notification, setNotification] = useState(null);
  const [error, setError] = useState(null);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      setError(null);
      setNotification(null);
      
      const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!allowedTypes.includes(file.type)) {
        setError('Неподдерживаемый формат файла');
        return;
      }

      if (file.size > MAX_FILE_SIZE) {
        setError('Размер файла превышает 5MB');
        return;
      }
      
      setDocuments(prev => ({
        ...prev,
        waybill: file,
        waybillName: file.name
      }));
    }
  };

  const handleCommentChange = (e) => {
    const value = e.target.value;
    if (value.length <= MAX_COMMENT_LENGTH) {
      setDocuments(prev => ({ ...prev, comment: value }));
    }
  };

  const handleNext = () => {
    const isCargoType = data.vehicle?.type === 'cargo' || 
                       data.vehicleType?.type === 'cargo' ||
                       data.vehicle?.vehicleType?.type === 'cargo';
    
    const hasWaybill = documents.waybill || 
                      (data.documents?.waybill && !documents.removeWaybill) ||
                      (data.documents?.[0] && !documents.removeWaybill);
    
    if (isCargoType && !hasWaybill) {
      setNotification({
        type: 'error',
        message: 'Для грузового транспорта необходимо прикрепить накладную'
      });
      return;
    }

    onNext({
      documents: {
        ...documents,
        waybill: documents.waybill || 
                (!documents.removeWaybill ? (data.documents?.waybill || data.documents?.[0]) : null),
        waybillName: documents.waybillName || 
                    (!documents.removeWaybill ? (data.documents?.waybillName || data.documents?.[0]?.originalName) : '')
      }
    });
  };

  return (
    <div className="step-content">
      {notification && (
        <Notification
          type={notification.type}
          message={notification.message}
          onClose={() => setNotification(null)}
        />
      )}
      
      {error && (
        <div className="error-message alert alert-danger">
          {error}
        </div>
      )}
      
      <h3>Дополнительная информация</h3>

      <div className="form-group">
        <label>
          Комментарий к заказу:
          <span className="comment-counter">
            {documents.comment.length}/{MAX_COMMENT_LENGTH}
          </span>
        </label>
        <textarea
          className="form-textarea"
          value={documents.comment}
          onChange={handleCommentChange}
          placeholder="Укажите дополнительную информацию по заказу"
          rows={4}
          maxLength={MAX_COMMENT_LENGTH}
        />
      </div>

      {data.vehicle?.type === 'cargo' && (
        <div className="form-group">
          <label>Накладная на груз:</label>
          <div className="file-upload-container">
            {documents.waybillName ? (
              <div className="existing-file">
                <i className="fas fa-file-pdf"></i>
                <span>{documents.waybillName}</span>
                <button 
                  className="btn-icon"
                  onClick={() => setDocuments(prev => ({ 
                    ...prev, 
                    waybill: null, 
                    waybillName: '',
                    removeWaybill: true
                  }))}
                  title="Удалить файл"
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>
            ) : (
              <>
                <input
                  type="file"
                  id="waybill"
                  className="file-input"
                  accept=".pdf,.doc,.docx"
                  onChange={handleFileChange}
                  required={!documents.waybill}
                />
                <label htmlFor="waybill" className="file-upload-label">
                  <div className="file-upload-label-content">
                    <i className="fas fa-cloud-upload-alt"></i>
                    <span>Выберите файл</span>
                  </div>
                </label>
              </>
            )}
            <small className="file-hint">
              Поддерживаемые форматы: PDF, DOC, DOCX. Максимальный размер: 5MB
            </small>
          </div>
        </div>
      )}

      <div className="step-navigation">
        <button className="btn btn-secondary" onClick={onBack}>
          <i className="fas fa-arrow-left"></i>
          Назад
        </button>
        <button className="btn btn-primary" onClick={handleNext}>
          <i className="fas fa-arrow-right"></i>
          Далее
        </button>
      </div>
    </div>
  );
};

// OrderSummary компонент
export const OrderSummary = ({ data, onBack, onSubmit }) => {
  const formatTime = (dateTimeStr) => {
    const date = new Date(dateTimeStr);
    return date.toLocaleString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="step-content">
      <h3>Подтверждение заказа</h3>

      <div className="summary-section card p-4">
        <h4>
          <i className="fas fa-user"></i>
          {data.customerInfo.fullName}
        </h4>
        <div className="d-flex align-center gap-2 mt-2">
          <i className="fas fa-phone"></i>
          {data.customerInfo.contact}
        </div>
      </div>

      <div className="summary-section card p-4">
        <h4>
          <i className="fas fa-truck"></i>
          Транспортное средство
        </h4>
        <div className="vehicle-info">
          {data.vehicle.name}
        </div>
      </div>

      <div className="summary-section card p-4">
        <h4>
          <i className="fas fa-route"></i>
          Маршрут и время
        </h4>
        <div className="route-summary">
          {data.route.startPoint}
          {data.route.endPoints.map((point, index) => (
            <React.Fragment key={index}>
              <span className="route-arrow">→</span>
              {point}
            </React.Fragment>
          ))}
        </div>
        <div className="time-details">
          <i className="far fa-clock"></i>
          <span>
            {new Date(data.route.dateTime).toLocaleString('ru-RU', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric'
            })}
            {' '}
            {formatTime(data.route.dateTime)} - {formatTime(data.route.estimatedEndTime)}
          </span>
        </div>
      </div>

      {(data.documents?.comment || data.documents?.waybill) && (
        <div className="summary-section card p-4">
          <h4>
            <i className="fas fa-file-alt"></i>
            Дополнения
          </h4>
          {data.documents?.comment && (
            <div className="comment-text" style={{
              wordBreak: 'break-word',
              whiteSpace: 'pre-wrap',
              overflowWrap: 'break-word',
              maxHeight: '200px',
              overflowY: 'auto'
            }}>
              {data.documents.comment}
            </div>
          )}
          {data.documents?.waybill && (
            <div className="waybill-info">
              <i className="fas fa-file-pdf"></i>
              <span>{data.documents.waybillName || data.documents.waybill.name}</span>
            </div>
          )}
        </div>
      )}

      <div className="step-navigation">
        <button className="btn btn-secondary" onClick={onBack}>
          <i className="fas fa-arrow-left"></i>
          Назад
        </button>
        <button className="btn btn-success" onClick={onSubmit}>
          <i className="fas fa-check"></i>
          Сохранить
        </button>
      </div>
    </div>
  );
}; 