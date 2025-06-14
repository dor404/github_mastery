import axios from 'axios';

// Get the base URL from environment variables or use a default
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

// Create axios instance with default config
const axiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  // Add timeout
  timeout: 10000,
  // Enable credentials
  withCredentials: true
});

// Add request interceptor
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('Response error:', error);
    if (error.code === 'ECONNABORTED') {
      throw new Error('Request timed out. Please try again.');
    }
    if (!error.response) {
      throw new Error('Network error. Please check your connection.');
    }
    throw error;
  }
);

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  confirmPassword?: string;  // Optional since it's only used in the form
  role: 'student' | 'lecturer' | 'admin';
  securityQuestions?: {
    teacherName: string;
    grandmotherName: string;
  };
}

export interface LoginData {
  email: string;
  password: string;
}

export interface ForgotPasswordData {
  email: string;
}

export interface SecurityQuestionsData {
  email: string;
  securityAnswers: {
    teacherName: string;
    grandmotherName: string;
  };
  newPassword: string;
}

export interface ResetPasswordData {
  password: string;
  token?: string;
}

export interface UpdateProfileData {
  username?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  avatar?: string;
  securityQuestions?: {
    teacherName: string;
    grandmotherName: string;
  };
}

// Function to get auth header with token
const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  if (!token) {
    console.warn('No authentication token found in localStorage');
    throw new Error('Authentication required. Please log in again.');
  }
  return {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  };
};

export const authService = {
  register: async (data: RegisterData) => {
    try {
      // Log registration data for debugging
      console.log('Register data received:', {
        username: data.username,
        email: data.email,
        hasSecurityQuestions: !!data.securityQuestions,
        securityQuestionFields: data.securityQuestions ? 
          Object.keys(data.securityQuestions) : []
      });
      
      // Format the request data to match server expectations
      const requestData: {
        username: string;
        email: string;
        password: string;
        role: string;
        securityQuestions?: {
          teacherName: string;
          grandmotherName: string;
        } | null;
      } = {
        username: data.username,
        email: data.email,
        password: data.password,
        role: data.role,
        securityQuestions: null
      };
      
      // Only include security questions if both answers are provided
      if (data.securityQuestions && 
          data.securityQuestions.teacherName && 
          data.securityQuestions.teacherName.trim() && 
          data.securityQuestions.grandmotherName && 
          data.securityQuestions.grandmotherName.trim()) {
        
        // Format security questions properly
        requestData.securityQuestions = {
          teacherName: data.securityQuestions.teacherName.trim(),
          grandmotherName: data.securityQuestions.grandmotherName.trim()
        };
        
        console.log('Including security questions in registration request');
      } else {
        console.log('Security questions incomplete or missing - not including in request');
      }
      
      // Log the final request structure
      console.log('Sending registration with structure:', {
        fields: Object.keys(requestData),
        securityQuestionsIncluded: !!requestData.securityQuestions
      });
      
      const response = await axios.post(`${API_URL}/auth/register`, requestData);
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
      }
      return response.data;
    } catch (error: any) {
      console.error('Registration error:', error.response?.data || error);
      throw new Error(error.response?.data?.message || 'Registration failed');
    }
  },

  login: async (data: LoginData) => {
    try {
      const response = await axios.post(`${API_URL}/auth/login`, data);
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
      }
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Login failed');
    }
  },

  logout: () => {
    localStorage.removeItem('token');
  },

  getCurrentUser: () => {
    const token = localStorage.getItem('token');
    if (token) {
      // You can decode the JWT token here if needed
      return token;
    }
    return null;
  },

  getProfile: async () => {
    try {
      const response = await axios.get(`${API_URL}/auth/profile`, getAuthHeader());
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch profile');
    }
  },

  updateProfile: async (data: UpdateProfileData) => {
    try {
      // Log the incoming data
      console.log('Update request fields:', Object.keys(data));
      
      // Create a new object for sending
      const requestData: Record<string, string> = {};
      
      // Add only the fields we want to update
      if (typeof data.username === 'string' && data.username.trim()) {
        requestData.username = data.username.trim();
      }
      
      if (typeof data.email === 'string' && data.email.trim()) {
        requestData.email = data.email.trim();
      }
      
      if (typeof data.password === 'string' && data.password.trim()) {
        requestData.password = data.password.trim();
      }
      
      // Special handling for avatar to ensure it's valid Base64
      if (typeof data.avatar === 'string' && data.avatar) {
        const avatarSizeKB = Math.round(data.avatar.length/1024);
        console.log(`Avatar size: ${avatarSizeKB}KB`);
        
        // Size check
        if (data.avatar.length > 550000) {
          throw new Error('Avatar exceeds size limit (550KB). Please try a smaller image.');
        }
        
        // Validate basic structure of image data URL
        if (data.avatar.startsWith('data:image/') && data.avatar.includes('base64,')) {
          requestData.avatar = data.avatar;
        } else if (data.avatar.match(/^https?:\/\//)) {
          // Allow regular URLs
          requestData.avatar = data.avatar;
        } else {
          throw new Error('Invalid avatar format. Must be a data URL or web URL.');
        }
      }
      
      // Check if we have any fields to update
      if (Object.keys(requestData).length === 0) {
        throw new Error('No valid fields to update');
      }
      
      console.log('Sending fields:', Object.keys(requestData));
      
      // Make the API request
      const response = await axios.patch(
        `${API_URL}/auth/profile`, 
        requestData, 
        getAuthHeader()
      );
      
      // Handle the response
      if (!response.data) {
        throw new Error('No response data received from server');
      }
      
      if (!response.data.user) {
        throw new Error('No user data in response');
      }
      
      // Update local storage
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      const updatedUser = { ...currentUser, ...response.data.user };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      return response.data;
    } catch (error: any) {
      console.error('Profile update error:', error);
      console.error('Response data:', error.response?.data);
      console.error('Status:', error.response?.status);
      
      // More specific error messages based on status codes
      if (error.response?.status === 401) {
        throw new Error('Authentication failed. Please log in again.');
      } else if (error.response?.status === 400) {
        throw new Error(error.response.data.message || error.response.data.details || 'Invalid data provided');
      }
      
      throw new Error(error.response?.data?.message || error.response?.data?.details || error.message || 'Failed to update profile');
    }
  },

  forgotPassword: async (data: ForgotPasswordData) => {
    try {
      const response = await axios.post(`${API_URL}/auth/forgot-password`, data);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to send password reset email');
    }
  },

  resetPasswordBySecurityQuestions: async (data: SecurityQuestionsData) => {
    try {
      console.log('Calling resetPasswordBySecurityQuestions with email:', data.email);

      // Log request structure (excluding actual answers for security)
      console.log('Request structure:', {
        email: data.email,
        securityAnswers: {
          teacherName: data.securityAnswers.teacherName ? 'provided' : 'missing',
          grandmotherName: data.securityAnswers.grandmotherName ? 'provided' : 'missing'
        },
        newPassword: data.newPassword ? 'provided' : 'missing'
      });

      const response = await axios.post(`${API_URL}/auth/reset-by-security-questions`, {
        email: data.email,
        securityAnswers: {
          teacherName: data.securityAnswers.teacherName,
          grandmotherName: data.securityAnswers.grandmotherName
        },
        newPassword: data.newPassword
      });
      
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
      }
      
      return response.data;
    } catch (error: any) {
      console.error('Security questions reset error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Failed to reset password with security questions');
    }
  },

  resetPassword: async (token: string, password: string) => {
    try {
      const response = await axios.post(`${API_URL}/auth/reset-password/${token}`, { password });
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
      }
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to reset password');
    }
  },
}; 