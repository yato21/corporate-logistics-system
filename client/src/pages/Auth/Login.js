import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { login, clearError } from '../../redux/slices/authSlice';
import './Login.css';

const Login = () => {
  const [credentials, setCredentials] = useState({
    employeeId: '',
    password: ''
  });

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error, isAuthenticated, user } = useSelector(state => state.auth);

  useEffect(() => {
    dispatch(clearError());
  }, [dispatch]);

  useEffect(() => {
    if (isAuthenticated && user) {
      switch (user.role) {
        case 'customer':
          navigate('/customer');
          break;
        case 'dispatcher':
          navigate('/dispatcher');
          break;
        case 'driver':
          navigate('/driver');
          break;
        default:
          navigate('/');
      }
    }
  }, [isAuthenticated, user, navigate]);

  const handleChange = (e) => {
    setCredentials({
      ...credentials,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    dispatch(login(credentials));
  };

  return (
    <div className="login-container d-flex align-center justify-center">
      <form onSubmit={handleSubmit} className="card p-4">
        <div className="text-center mb-4">
          <h1 className="gradient-text">Вход в систему</h1>
        </div>
        
        <div className="form-group">
          <label htmlFor="employeeId">Табельный номер:</label>
          <input
            type="text"
            id="employeeId"
            name="employeeId"
            value={credentials.employeeId}
            onChange={handleChange}
            required
            className="form-control"
            disabled={loading}
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="password">Пароль:</label>
          <input
            type="password"
            id="password"
            name="password"
            value={credentials.password}
            onChange={handleChange}
            required
            className="form-control"
            disabled={loading}
          />
        </div>
        
        {error && (
          <div className="form-error text-center mb-3">
            {error}
          </div>
        )}
        
        <button 
          type="submit" 
          className="btn btn-primary w-full" 
          disabled={loading}
        >
          {loading ? (
            <>
              <i className="fas fa-spinner fa-spin"></i>
              Вход...
            </>
          ) : (
            'Войти'
          )}
        </button>
      </form>
    </div>
  );
};

export default Login; 