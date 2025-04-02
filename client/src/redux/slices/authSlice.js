import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance from '../../utils/axios';
import socketService from '../../services/socket';

export const login = createAsyncThunk(
  'auth/login',
  async (credentials) => {
    const response = await axiosInstance.post('/auth/signin', credentials);
    localStorage.setItem('token', response.data.accessToken);
    return response.data;
  }
);

export const logout = createAsyncThunk(
  'auth/logout',
  async () => {
    localStorage.removeItem('token');
    socketService.disconnect();
  }
);

export const updateProfile = createAsyncThunk(
  'auth/updateProfile',
  async (profileData) => {
    const response = await axiosInstance.put('/auth/profile', profileData);
    return response.data;
  }
);

export const changePassword = createAsyncThunk(
  'auth/changePassword',
  async (passwordData) => {
    const response = await axiosInstance.put('/auth/change-password', passwordData);
    return response.data;
  }
);

export const initAuth = createAsyncThunk(
  'auth/initAuth',
  async (_, { dispatch }) => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        // Проверяем валидность токена через API
        const response = await axiosInstance.get('/auth/verify');
        return response.data;
      } catch (error) {
        // Если токен невалидный, очищаем localStorage
        localStorage.removeItem('token');
        localStorage.removeItem('userData');
        throw error;
      }
    }
    return null;
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: null,
    loading: false,
    error: null,
    isAuthenticated: false,
    profileUpdateSuccess: false,
    passwordChangeSuccess: false
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearSuccessFlags: (state) => {
      state.profileUpdateSuccess = false;
      state.passwordChangeSuccess = false;
    }
  },
  extraReducers: (builder) => {
    builder
      // Обработка login
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
        localStorage.setItem('userData', JSON.stringify(action.payload));
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      // Обработка logout
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.isAuthenticated = false;
        localStorage.removeItem('userData');
      })
      // Обработка updateProfile
      .addCase(updateProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.profileUpdateSuccess = false;
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.user = { ...state.user, ...action.payload };
        state.profileUpdateSuccess = true;
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
        state.profileUpdateSuccess = false;
      })
      // Обработка changePassword
      .addCase(changePassword.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.passwordChangeSuccess = false;
      })
      .addCase(changePassword.fulfilled, (state) => {
        state.loading = false;
        state.passwordChangeSuccess = true;
      })
      .addCase(changePassword.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
        state.passwordChangeSuccess = false;
      })
      // Обработка initAuth
      .addCase(initAuth.pending, (state) => {
        state.loading = true;
      })
      .addCase(initAuth.fulfilled, (state, action) => {
        if (action.payload) {
          state.user = action.payload;
          state.isAuthenticated = true;
        }
        state.loading = false;
      })
      .addCase(initAuth.rejected, (state) => {
        state.user = null;
        state.isAuthenticated = false;
        state.loading = false;
      });
  }
});

export const { clearError, clearSuccessFlags } = authSlice.actions;
export default authSlice.reducer; 