/**
 * User roles available in the system
 */
export type UserRole = 'student' | 'lecturer' | 'admin';

/**
 * Interface for user model
 */
export interface User {
  _id?: string;
  username: string;
  email: string;
  role: UserRole;
  firstName?: string;
  lastName?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Interface for login credentials
 */
export interface LoginCredentials {
  email: string;
  password: string;
}

/**
 * Interface for registration data
 */
export interface RegisterData {
  username: string;
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

/**
 * Interface for auth state
 */
export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  loading: boolean;
  error: string | null;
} 