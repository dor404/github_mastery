/**
 * Test Suite: Registration Component
 * 
 * This suite tests the user registration functionality including:
 * - Form rendering and validation
 * - Input field validations:
 *   - Email format validation
 *   - Password length requirements
 *   - Password matching
 *   - Required fields validation
 * - Security questions handling
 * - Loading states during form submission
 * - Successful registration flow
 * - Error handling scenarios
 * - Navigation after successful registration
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import Register from '../pages/Auth/Register';
import { authService } from '../services/authService';
import type { RegisterData } from '../services/authService';

// Mock the auth service
jest.mock('../services/authService', () => ({
  authService: {
    register: jest.fn()
  }
}));

// Mock useNavigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate
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

describe('Register component', () => {
  let store: ReturnType<typeof createMockStore>;
  const onRegister = jest.fn();

  beforeEach(() => {
    store = createMockStore();
    jest.clearAllMocks();
  });

  const renderRegister = () => {
    return render(
      <Provider store={store}>
        <BrowserRouter>
          <Register onRegister={onRegister} />
        </BrowserRouter>
      </Provider>
    );
  };

  const fillForm = (data: Partial<RegisterData> = {}) => {
    const defaultData = {
      username: 'testuser',
      email: 'test@example.com',
      password: 'Password123!',
      confirmPassword: 'Password123!',
      securityQuestions: {
        teacherName: 'Mrs. Smith',
        grandmotherName: 'Jane Doe'
      },
      ...data
    };

    fireEvent.change(screen.getByLabelText(/username/i), {
      target: { value: defaultData.username }
    });
    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: defaultData.email }
    });
    fireEvent.change(screen.getByLabelText('Password *'), {
      target: { value: defaultData.password }
    });
    fireEvent.change(screen.getByLabelText('Confirm Password *'), {
      target: { value: defaultData.confirmPassword }
    });
    fireEvent.change(screen.getByLabelText(/teacher.*name/i), {
      target: { value: defaultData.securityQuestions?.teacherName }
    });
    fireEvent.change(screen.getByLabelText(/grandmother.*name/i), {
      target: { value: defaultData.securityQuestions?.grandmotherName }
    });

    return defaultData;
  };

  it('renders registration form', () => {
    renderRegister();
    
    expect(screen.getByRole('heading', { name: /create account/i })).toBeInTheDocument();
    expect(screen.getByTestId('register-form')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /already have an account/i })).toBeInTheDocument();
  });

  it('shows error for invalid email format', async () => {
    renderRegister();

    // Fill form with invalid email
    fillForm({ email: 'invalid-email' });

    fireEvent.click(screen.getByRole('button', { name: /register/i }));

    await waitFor(() => {
      expect(screen.getByTestId('email-helper-text')).toHaveTextContent(/email is invalid/i);
    });
  });

  it('shows error when password is too short', async () => {
    renderRegister();

    // Fill form with short password
    fillForm({
      password: '12345',
      confirmPassword: '12345'
    });

    fireEvent.click(screen.getByRole('button', { name: /register/i }));

    await waitFor(() => {
      expect(screen.getByTestId('password-helper-text')).toHaveTextContent(/password must be at least 6 characters/i);
    });
  });

  it('shows error when passwords do not match', async () => {
    renderRegister();

    // Fill form with mismatched passwords
    const formData = fillForm({
      password: 'Password123!',
      confirmPassword: 'DifferentPassword123!'
    });

    // Submit form
    fireEvent.click(screen.getByRole('button', { name: /register/i }));

    // Wait for error message
    await waitFor(() => {
      const helperText = screen.getByTestId('confirmPassword-helper-text');
      expect(helperText).toHaveTextContent(/passwords do not match/i);
    });
  });

  it('shows loading state during form submission', async () => {
    // Mock a delayed registration
    (authService.register as jest.Mock).mockImplementationOnce(() => 
      new Promise(resolve => setTimeout(resolve, 100))
    );

    renderRegister();
    fillForm();

    fireEvent.click(screen.getByRole('button', { name: /register/i }));

    // Check for loading indicator
    expect(screen.getByRole('progressbar')).toBeInTheDocument();

    // Wait for submission to complete
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });
  });

  it('successfully submits form with valid data', async () => {
    renderRegister();

    const formData = fillForm();

    fireEvent.click(screen.getByRole('button', { name: /register/i }));

    await waitFor(() => {
      // Check if register was called with correct data
      expect(authService.register).toHaveBeenCalledWith({
        username: formData.username,
        email: formData.email,
        password: formData.password,
        role: 'student',
        securityQuestions: {
          teacherName: formData.securityQuestions?.teacherName,
          grandmotherName: formData.securityQuestions?.grandmotherName
        }
      });

      // Check if onRegister callback was called
      expect(onRegister).toHaveBeenCalled();

      // Check if navigation occurred
      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });
  });

  it('handles registration error', async () => {
    const errorMessage = 'Registration failed';
    (authService.register as jest.Mock).mockRejectedValueOnce(new Error(errorMessage));

    renderRegister();
    fillForm();

    // Submit form
    fireEvent.click(screen.getByRole('button', { name: /register/i }));

    // Wait for error alert
    await waitFor(() => {
      const alert = screen.getByRole('alert');
      expect(alert).toBeInTheDocument();
      expect(alert).toHaveTextContent(errorMessage);
    });
  });
});
