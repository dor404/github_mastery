import axios from 'axios';

const API_URL = 'http://localhost:5001/api';

// Make sure to include the auth token in requests
const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  
  if (!token) {
    console.warn('No authentication token found in localStorage');
    throw new Error('Authentication required. Please log in again.');
  }
  
  console.log('Token found, length:', token.length);
  
  return {
    headers: {
      Authorization: `Bearer ${token}`
    }
  };
};

export interface User {
  id: string;
  username: string;
  email: string;
  role: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuditLog {
  timestamp: string;
  action: string;
  resourceType: string;
  resourceId: string;
  user: {
    id: string;
    username: string;
    role: string;
  };
  details?: any;
}

export interface PaginatedLogs {
  logs: AuditLog[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export const adminService = {
  // Get all users
  async getUsers(): Promise<User[]> {
    try {
      const response = await axios.get(`${API_URL}/auth/users`, getAuthHeader());
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch users');
    }
  },

  // Update user role
  async updateUserRole(userId: string, role: 'student' | 'lecturer' | 'admin'): Promise<User> {
    try {
      // Validate userId format - it should be a 24-character hex string
      if (!userId || typeof userId !== 'string') {
        throw new Error('Invalid user ID: ID is missing or not a string');
      }

      // Clean up the userId to ensure it's in the correct format for MongoDB
      const cleanedUserId = userId.replace(/[^a-fA-F0-9]/g, '');
      
      if (cleanedUserId.length !== 24) {
        throw new Error(`Invalid user ID format: Expected 24 hex characters, got ${cleanedUserId.length}`);
      }
      
      console.log('Updating user role:', cleanedUserId, 'to', role);
      
      // Make sure we have auth headers
      const headers = getAuthHeader();
      console.log('Authorization header ready');
      
      const response = await axios.patch(
        `${API_URL}/auth/users/${cleanedUserId}/role`, 
        { role }, 
        headers
      );
      
      console.log('Update role API response:', response.data);
      
      // The server sends a response with { message, user } structure
      if (response.data && response.data.user) {
        return response.data.user;
      }
      throw new Error('Invalid server response format');
    } catch (error: any) {
      console.error('Error updating user role:', error);
      console.error('Error response data:', error.response?.data);
      console.error('Error status:', error.response?.status);
      
      // More specific error messages
      if (error.response?.status === 401) {
        throw new Error('Authentication failed. Please log in again.');
      } else if (error.response?.status === 403) {
        throw new Error('Access denied. You do not have admin privileges.');
      } else if (error.response?.status === 404) {
        throw new Error('User not found.');
      } else if (error.response?.status === 400 && error.response?.data?.message?.includes('Invalid user ID')) {
        throw new Error('Invalid user ID format. Please contact support.');
      }
      
      throw new Error(error.response?.data?.message || 'Failed to update user role');
    }
  },

  /**
   * Get audit logs (admin only)
   */
  getAuditLogs: async (page: number = 1, limit: number = 50): Promise<PaginatedLogs> => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('Authentication token not found. Please log in again.');
      }
      
      const response = await axios.get(`${API_URL}/admin/audit-logs`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { page, limit }
      });
      
      return response.data;
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      throw error;
    }
  }
};

export default adminService; 