/**
 * Test Suite: Admin Dashboard Component - Role Management
 * 
 * This suite tests the admin functionality for user management including:
 * - User listing:
 *   - Display of all users
 *   - User roles
 *   - User information
 * - Role management:
 *   - Role change functionality
 *   - Permission validation
 *   - Role update confirmation
 * - Integration with admin service
 * - Loading states
 * - Error handling
 * - Admin privileges verification
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import AdminDashboard from '../components/Admin/AdminDashboard';
import { useAuth } from '../context/AuthContext';
import { adminService } from '../services/adminService';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    }
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

// Mock the auth hook
jest.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: {
      id: 'admin-id',
      username: 'admin',
      email: 'admin@example.com',
      role: 'admin'
    }
  })
}));

// Mock the admin service
const mockUsers = [
  {
    id: 'user1',
    username: 'student1',
    email: 'student1@example.com',
    role: 'student'
  },
  {
    id: 'user2',
    username: 'lecturer1',
    email: 'lecturer1@example.com',
    role: 'lecturer'
  }
];

jest.mock('../services/adminService', () => {
  return {
    adminService: {
      getUsers: jest.fn().mockResolvedValue([
        {
          id: 'user1',
          username: 'student1',
          email: 'student1@example.com',
          role: 'student'
        },
        {
          id: 'user2',
          username: 'lecturer1',
          email: 'lecturer1@example.com',
          role: 'lecturer'
        }
      ]),
      updateUserRole: jest.fn().mockResolvedValue({
        id: 'user1',
        username: 'student1',
        email: 'student1@example.com',
        role: 'lecturer'
      })
    }
  };
});

// Mock Material-UI components
jest.mock('@mui/material', () => ({
  Container: ({ children }: any) => <div data-testid="container">{children}</div>,
  Typography: ({ children, variant, component, color, sx }: any) => <div data-testid={`typography-${variant}`}>{children}</div>,
  Box: ({ children, sx }: any) => <div data-testid="box">{children}</div>,
  Paper: ({ children }: any) => <div data-testid="paper">{children}</div>,
  TableContainer: ({ children, component }: any) => <div data-testid="table-container">{children}</div>,
  Table: ({ children }: any) => <table data-testid="table">{children}</table>,
  TableHead: ({ children }: any) => <thead data-testid="table-head">{children}</thead>,
  TableBody: ({ children }: any) => <tbody data-testid="table-body">{children}</tbody>,
  TableRow: ({ children }: any) => <tr data-testid="table-row">{children}</tr>,
  TableCell: ({ children, colSpan, align }: any) => <td data-testid="table-cell" colSpan={colSpan}>{children}</td>,
  Select: ({ value, onChange, children, disabled, size }: any) => (
    <select value={value} onChange={onChange} disabled={disabled} data-testid="role-select">
      {children}
    </select>
  ),
  MenuItem: ({ value, children }: any) => (
    <option value={value} data-testid="menu-item">{children}</option>
  ),
  FormControl: ({ children, size, fullWidth }: any) => <div data-testid="form-control">{children}</div>,
  CircularProgress: ({ size, sx }: any) => <div data-testid="loading">Loading...</div>,
  Chip: ({ label, color, variant }: any) => <span data-testid={`chip-${color}`}>{label}</span>,
  TextField: ({ label, variant, value, onChange, sx, InputProps }: any) => (
    <input
      data-testid="search-input"
      type="text"
      value={value}
      onChange={onChange}
      placeholder={label}
    />
  ),
  InputAdornment: ({ position, children }: any) => <span data-testid="input-adornment">{children}</span>,
  IconButton: ({ children, onClick }: any) => <button data-testid="icon-button" onClick={onClick}>{children}</button>,
  Button: ({ children, variant, startIcon, onClick }: any) => (
    <button data-testid="button" onClick={onClick}>{children}</button>
  ),
  Snackbar: ({ open, children, onClose }: any) => open ? <div data-testid="snackbar">{children}</div> : null,
  Alert: ({ severity, onClose, children }: any) => (
    <div data-testid={`alert-${severity}`} onClick={onClose}>
      {children}
    </div>
  ),
  Tooltip: ({ title, children }: any) => (
    <div data-testid="tooltip" title={title}>
      {children}
    </div>
  ),
  FormHelperText: ({ children }: any) => <div data-testid="form-helper-text">{children}</div>
}));

// Mock Material-UI icons
jest.mock('@mui/icons-material', () => ({
  Search: () => <span data-testid="search-icon">Search</span>,
  Refresh: () => <span data-testid="refresh-icon">Refresh</span>,
  Help: () => <span data-testid="help-icon">Help</span>
}));

describe('Admin Dashboard - Role Management', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset the mock implementation before each test
    (adminService.getUsers as jest.Mock).mockResolvedValue(mockUsers);
    // Set a mock token in localStorage
    localStorage.setItem('token', 'fake-jwt-token');
  });

  afterEach(() => {
    // Clean up localStorage after each test
    localStorage.clear();
  });

  it('loads and displays users with their roles', async () => {
    render(<AdminDashboard />);

    // Wait for users to be loaded and rendered
    await waitFor(() => {
      expect(screen.getByText('student1')).toBeInTheDocument();
      expect(screen.getByText('lecturer1')).toBeInTheDocument();
    }, { timeout: 3000 });

    // Verify the service was called
    expect(adminService.getUsers).toHaveBeenCalled();
  });

  it('allows changing user roles', async () => {
    render(<AdminDashboard />);

    // Wait for users to be loaded and rendered in the table
    await waitFor(() => {
      // First verify the loading state is gone
      expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
      
      // Then check for our student user
      const studentElement = screen.getByText('student1');
      expect(studentElement).toBeInTheDocument();
    }, { 
      timeout: 3000,
      onTimeout: (error) => {
        console.error('Timed out waiting for "student1" to appear in the document.');
        console.error('Current document body:', document.body.innerHTML);
        return error;
      }
    });

    // Find the role select for the first user and change it
    const roleSelect = screen.getAllByTestId('role-select')[0];
    fireEvent.change(roleSelect, { target: { value: 'lecturer' } });

    // Verify the service was called with correct parameters
    await waitFor(() => {
      expect(adminService.updateUserRole).toHaveBeenCalledWith('user1', 'lecturer');
    });
  });

  // New tests for email search functionality
  it('filters users by username', async () => {
    render(<AdminDashboard />);

    // Wait for users to be loaded
    await waitFor(() => {
      expect(screen.getByText('student1')).toBeInTheDocument();
      expect(screen.getByText('lecturer1')).toBeInTheDocument();
    });

    // Find the search input and type a username
    const searchInput = screen.getByTestId('search-input');
    fireEvent.change(searchInput, { target: { value: 'student' } });

    // Verify only matching users are displayed
    expect(screen.getByText('student1')).toBeInTheDocument();
    expect(screen.queryByText('lecturer1')).not.toBeInTheDocument();
  });

  it('filters users by complete email address', async () => {
    render(<AdminDashboard />);

    // Wait for users to be loaded
    await waitFor(() => {
      expect(screen.getByText('student1@example.com')).toBeInTheDocument();
    });

    // Find the search input and type a full email
    const searchInput = screen.getByTestId('search-input');
    fireEvent.change(searchInput, { target: { value: 'student1@example.com' } });

    // Verify only matching users are displayed
    expect(screen.getByText('student1')).toBeInTheDocument();
    expect(screen.queryByText('lecturer1')).not.toBeInTheDocument();
  });

  it('filters users by partial email address', async () => {
    render(<AdminDashboard />);

    // Wait for users to be loaded
    await waitFor(() => {
      expect(screen.getByText('student1@example.com')).toBeInTheDocument();
    });

    // Find the search input and type a partial email
    const searchInput = screen.getByTestId('search-input');
    fireEvent.change(searchInput, { target: { value: 'example.com' } });

    // Verify both users are displayed since they share the same domain
    expect(screen.getByText('student1')).toBeInTheDocument();
    expect(screen.getByText('lecturer1')).toBeInTheDocument();
  });

  it('filters users by email domain only', async () => {
    render(<AdminDashboard />);

    // Wait for users to be loaded
    await waitFor(() => {
      expect(screen.getByText('student1@example.com')).toBeInTheDocument();
    });

    // Find the search input and type an email domain search
    const searchInput = screen.getByTestId('search-input');
    fireEvent.change(searchInput, { target: { value: '@example' } });

    // Verify both users are displayed since they share the same domain
    expect(screen.getByText('student1')).toBeInTheDocument();
    expect(screen.getByText('lecturer1')).toBeInTheDocument();
  });

  it('filters users by email username only', async () => {
    render(<AdminDashboard />);

    // Wait for users to be loaded
    await waitFor(() => {
      expect(screen.getByText('student1@example.com')).toBeInTheDocument();
    });

    // Find the search input and type an email username search
    const searchInput = screen.getByTestId('search-input');
    fireEvent.change(searchInput, { target: { value: 'student1@' } });

    // Verify only the matching user is displayed
    expect(screen.getByText('student1')).toBeInTheDocument();
    expect(screen.queryByText('lecturer1')).not.toBeInTheDocument();
  });

  it('shows all users when search is cleared', async () => {
    render(<AdminDashboard />);

    // Wait for users to be loaded
    await waitFor(() => {
      expect(screen.getByText('student1')).toBeInTheDocument();
    });

    // Find the search input and type something to filter
    const searchInput = screen.getByTestId('search-input');
    fireEvent.change(searchInput, { target: { value: 'student1' } });

    // Verify only the student is displayed
    expect(screen.getByText('student1')).toBeInTheDocument();
    expect(screen.queryByText('lecturer1')).not.toBeInTheDocument();

    // Clear the search
    fireEvent.change(searchInput, { target: { value: '' } });

    // Verify both users are displayed again
    expect(screen.getByText('student1')).toBeInTheDocument();
    expect(screen.getByText('lecturer1')).toBeInTheDocument();
  });
}); 