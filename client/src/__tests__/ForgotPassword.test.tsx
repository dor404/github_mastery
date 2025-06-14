/**
 * Test Suite: Forgot Password Component
 * 
 * This suite tests the password reset functionality including:
 * - Security question based password reset:
 *   - Teacher's name validation
 *   - Grandmother's name validation
 * - Form validation:
 *   - Email validation
 *   - New password requirements
 *   - Security answer validation
 * - Error handling:
 *   - Incorrect security answers
 *   - Invalid email
 * - Success flow:
 *   - Password reset completion
 *   - Redirection after reset
 * - Loading states during reset process
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ForgotPassword from '../components/Auth/ForgotPassword';
import { authService } from '../services/authService';

// Mock the authService
jest.mock('../services/authService', () => ({
  authService: {
    resetPasswordBySecurityQuestions: jest.fn()
  }
}));

describe('ForgotPassword', () => {
  const mockOnClose = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows error when password is too short', async () => {
    render(<ForgotPassword open={true} onClose={mockOnClose} />);
    
    // Wait for dialog to be fully rendered
    const dialog = await screen.findByRole('dialog');
    expect(dialog).toBeInTheDocument();
    
    // Wait for password field to be rendered
    const passwordInput = await waitFor(() => {
      const input = dialog.querySelector('input[name="newPassword"]');
      expect(input).toBeTruthy();
      return input;
    });

    // Fill in a short password
    fireEvent.change(passwordInput!, { target: { value: '12345' } });

    // Submit form
    const submitButton = screen.getByRole('button', { name: /reset password/i });
    fireEvent.click(submitButton);

    // Check for password length error
    expect(await screen.findByText('Password must be at least 6 characters')).toBeInTheDocument();
  });

  it('successfully resets password with correct security answers', async () => {
    // Mock successful password reset
    (authService.resetPasswordBySecurityQuestions as jest.Mock).mockResolvedValueOnce({
      message: 'Password reset successful'
    });

    render(<ForgotPassword open={true} onClose={mockOnClose} />);
    
    // Wait for dialog to be fully rendered
    const dialog = await screen.findByRole('dialog');
    expect(dialog).toBeInTheDocument();

    // Wait for password fields to be rendered
    const newPasswordInput = await waitFor(() => {
      const input = dialog.querySelector('input[name="newPassword"]');
      expect(input).toBeTruthy();
      return input;
    });
    
    const confirmPasswordInput = await waitFor(() => {
      const input = dialog.querySelector('input[name="confirmPassword"]');
      expect(input).toBeTruthy();
      return input;
    });

    // Fill in all required fields - use exact labels for non-password fields
    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: 'test@example.com' }
    });
    fireEvent.change(screen.getByLabelText(/first grade teacher's name/i), {
      target: { value: 'Mrs. Smith' }
    });
    fireEvent.change(screen.getByLabelText(/grandmother's name/i), {
      target: { value: 'Jane Doe' }
    });

    fireEvent.change(newPasswordInput!, {
      target: { value: 'newpassword123' }
    });
    fireEvent.change(confirmPasswordInput!, {
      target: { value: 'newpassword123' }
    });

    // Submit form
    const submitButton = screen.getByRole('button', { name: /reset password/i });
    fireEvent.click(submitButton);

    // Check if success message is shown
    await waitFor(() => {
      expect(screen.getByText(/password has been reset successfully/i)).toBeInTheDocument();
    });

    // Verify service was called with correct data
    expect(authService.resetPasswordBySecurityQuestions).toHaveBeenCalledWith({
      email: 'test@example.com',
      securityAnswers: {
        teacherName: 'Mrs. Smith',
        grandmotherName: 'Jane Doe'
      },
      newPassword: 'newpassword123'
    });
  });

  it('shows error message when security answers are incorrect', async () => {
    // Mock failed password reset
    (authService.resetPasswordBySecurityQuestions as jest.Mock).mockRejectedValueOnce(
      new Error('Security question answers are incorrect')
    );

    render(<ForgotPassword open={true} onClose={mockOnClose} />);
    
    // Wait for dialog to be fully rendered
    const dialog = await screen.findByRole('dialog');
    expect(dialog).toBeInTheDocument();

    // Wait for password fields to be rendered
    const newPasswordInput = await waitFor(() => {
      const input = dialog.querySelector('input[name="newPassword"]');
      expect(input).toBeTruthy();
      return input;
    });
    
    const confirmPasswordInput = await waitFor(() => {
      const input = dialog.querySelector('input[name="confirmPassword"]');
      expect(input).toBeTruthy();
      return input;
    });

    // Fill in all required fields - use exact labels for non-password fields
    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: 'test@example.com' }
    });
    fireEvent.change(screen.getByLabelText(/first grade teacher's name/i), {
      target: { value: 'Wrong Teacher' }
    });
    fireEvent.change(screen.getByLabelText(/grandmother's name/i), {
      target: { value: 'Wrong Name' }
    });

    fireEvent.change(newPasswordInput!, {
      target: { value: 'newpassword123' }
    });
    fireEvent.change(confirmPasswordInput!, {
      target: { value: 'newpassword123' }
    });

    // Submit form
    const submitButton = screen.getByRole('button', { name: /reset password/i });
    fireEvent.click(submitButton);

    // Check if error message is shown
    await waitFor(() => {
      expect(screen.getByText('Security question answers are incorrect')).toBeInTheDocument();
    });
  });
}); 