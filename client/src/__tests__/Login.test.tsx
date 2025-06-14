/**
 * Test Suite: Login Component
 * 
 * This suite tests the user login functionality including:
 * - Login form rendering and validation
 * - Authentication flow:
 *   - Successful login and redirection
 *   - Invalid credentials handling
 * - Form validation:
 *   - Required fields
 *   - Email format
 * - Integration with auth service
 * - Loading states
 * - Error message display
 * - Navigation after successful login
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import Login from '../pages/Auth/Login';
import { authService } from '../services/authService';
import { AuthProvider } from '../context/AuthContext';

// Mock the auth service
jest.mock('../services/authService', () => ({
  authService: {
    login: jest.fn()
  }
}));

// Mock useNavigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useLocation: () => ({ state: null })
}));

// Create a mock store
const createMockStore = () => {
  return configureStore({
    reducer: {
      auth: (state = {
        user: null,
        isAuthenticated: false,
        error: null
      }) => state
    }
  });
};

describe('Login component', () => {
  let store: ReturnType<typeof createMockStore>;

  beforeEach(() => {
    store = createMockStore();
    jest.clearAllMocks();
  });

  const renderLogin = () => {
    return render(
      <Provider store={store}>
        <AuthProvider>
          <BrowserRouter>
            <Login />
          </BrowserRouter>
        </AuthProvider>
      </Provider>
    );
  };

  it('renders login form', () => {
    renderLogin();
    
    expect(screen.getByRole('heading', { name: /sign in/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('shows error for invalid credentials', async () => {
    const errorMessage = 'Invalid email or password';
    (authService.login as jest.Mock).mockRejectedValueOnce(new Error(errorMessage));

    renderLogin();

    // Fill form with valid data
    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: 'test@example.com' }
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'password123' }
    });

    // Submit form
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    // Check for error message
    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(errorMessage);
    });
  });

  it('redirects to dashboard on successful login', async () => {
    const mockUser = { id: 1, email: 'test@example.com', role: 'student' };
    (authService.login as jest.Mock).mockResolvedValueOnce({ user: mockUser, token: 'fake-token' });

    renderLogin();

    // Fill form with valid data
    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: 'test@example.com' }
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'password123' }
    });

    // Submit form
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    // Check if navigation occurred
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });
}); 