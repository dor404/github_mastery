import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../../store/slices/authSlice';

const initialState = {
  auth: {
    user: null,
    isAuthenticated: false,
    loading: false,
    error: null
  }
};

export const mockStore = configureStore({
  reducer: {
    auth: authReducer,
  },
  preloadedState: initialState
});

export type RootState = ReturnType<typeof mockStore.getState>;
export type AppDispatch = typeof mockStore.dispatch; 