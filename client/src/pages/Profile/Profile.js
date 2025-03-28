import { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { updateProfile, changePassword } from '../../redux/slices/authSlice';
import Notification from '../../components/common/Notification/Notification';
import './Profile.css';

const Profile = () => {
  const { user } = useSelector(state => state.auth);
  const dispatch = useDispatch();

  const [isEditingContact, setIsEditingContact] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [contactData, setContactData] = useState({
    contact: user.contact || ''
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

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
      setContactData({
        ...contactData,
        [e.target.name]: formatPhoneNumber(value)
      });
    }
  };

  const handleContactSubmit = async (e) => {
    e.preventDefault();
    const digitsOnly = contactData.contact.replace(/\D/g, '');
    if (digitsOnly.length !== 11) {
      setError('Введите корректный номер телефона');
      return;
    }
    try {
      await dispatch(updateProfile(contactData)).unwrap();
      setIsEditingContact(false);
      setSuccess('Номер телефона успешно обновлен');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Ошибка при обновлении номера');
      setTimeout(() => setError(null), 3000);
    }
  };

  const handlePasswordChange = (e) => {
    setPasswordData({
      ...passwordData,
      [e.target.name]: e.target.value
    });
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('Пароли не совпадают');
      return;
    }
    try {
      await dispatch(changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      })).unwrap();
      setShowPasswordForm(false);
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setSuccess('Пароль успешно изменен');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Ошибка при смене пароля');
      setTimeout(() => setError(null), 3000);
    }
  };

  return (
    <div className="p-4">
      {error && <Notification type="error" message={error} onClose={() => setError(null)} />}
      {success && <Notification type="success" message={success} onClose={() => setSuccess(null)} />}
      
      <div className="card mb-4">
        <div className="d-flex justify-between align-center border-b pb-3 mb-4">
          <h2 className="text-xl font-semibold m-0">Личные данные</h2>
        </div>

        <div className="d-flex flex-column gap-4">
          <div className="d-flex flex-column gap-3">
            <div className="info-row">
              <strong>Табельный номер</strong>
              <span className="form-control bg-gray-50">{user.employeeId}</span>
            </div>
            <div className="info-row">
              <strong>ФИО</strong>
              <span className="form-control bg-gray-50">{user.fullName}</span>
            </div>
            <div className="info-row">
              <strong>Должность</strong>
              <span className="form-control bg-gray-50">{user.position}</span>
            </div>
          </div>

          <div className="d-flex flex-column gap-3">
            <div className="info-row">
              <strong>Электронная почта</strong>
              <span className="form-control bg-gray-50">{user.email || 'Не указана'}</span>
            </div>
            <div className="info-row">
              <strong>Подразделение</strong>
              <span className="form-control bg-gray-50">{user.subdivision || 'Не указано'}</span>
            </div>
          </div>

          <div className="d-flex flex-column gap-3">
            <div className="info-row">
              <strong>Мобильный телефон</strong>
              {isEditingContact ? (
                <form onSubmit={handleContactSubmit} className="d-flex gap-2 flex-1">
                  <input
                    type="text"
                    name="contact"
                    value={contactData.contact}
                    onChange={handleContactChange}
                    placeholder="+7 (___) ___-__-__"
                    required
                    className="form-control flex-1"
                  />
                  <button type="button" className="btn btn-secondary" onClick={() => {
                    setIsEditingContact(false);
                    setContactData({ contact: user.contact || '' });
                  }}>
                    <i className="fas fa-times"></i>
                    Отмена
                  </button>
                  <button type="submit" className="btn btn-success">
                    <i className="fas fa-check"></i>
                    Сохранить
                  </button>
                </form>
              ) : (
                <div className="d-flex align-center justify-between form-control bg-gray-50">
                  <span>{user.contact || 'Не указан'}</span>
                  <button className="btn-icon" onClick={() => setIsEditingContact(true)}>
                    <i className="fas fa-edit"></i>
                  </button>
                </div>
              )}
            </div>
            <div className="info-row">
              <strong>Стационарный телефон</strong>
              <span className="form-control bg-gray-50">{user.officePhone || 'Не указан'}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className={`d-flex justify-between align-center ${showPasswordForm ? 'border-b pb-3 mb-4' : ''}`}>
          <h2 className="text-xl font-semibold m-0">Безопасность</h2>
          {!showPasswordForm && (
            <button 
              className="btn btn-secondary"
              onClick={() => setShowPasswordForm(true)}
            >
              <i className="fas fa-key"></i>
              Сменить пароль
            </button>
          )}
        </div>

        {showPasswordForm && (
          <form onSubmit={handlePasswordSubmit} className="d-flex flex-column gap-4">
            <div className="form-group">
              <label>Текущий пароль:</label>
              <input
                type="password"
                name="currentPassword"
                value={passwordData.currentPassword}
                onChange={handlePasswordChange}
                required
                className="form-control"
              />
            </div>

            <div className="form-group">
              <label>Новый пароль:</label>
              <input
                type="password"
                name="newPassword"
                value={passwordData.newPassword}
                onChange={handlePasswordChange}
                required
                className="form-control"
              />
            </div>

            <div className="form-group">
              <label>Подтвердите новый пароль:</label>
              <input
                type="password"
                name="confirmPassword"
                value={passwordData.confirmPassword}
                onChange={handlePasswordChange}
                required
                className="form-control"
              />
            </div>

            <div className="d-flex justify-end gap-2">
              <button type="button" className="btn btn-secondary" onClick={() => setShowPasswordForm(false)}>
                <i className="fas fa-times"></i>
                Отмена
              </button>
              <button type="submit" className="btn btn-success">
                <i className="fas fa-check"></i>
                Сохранить
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default Profile; 