import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

interface LecturerRouteProps {
  children: React.ReactNode;
}

const LecturerRoute: React.FC<LecturerRouteProps> = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    // Redirect to login while saving the attempted path
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (user?.role !== 'lecturer' && user?.role !== 'admin') {
    // If user is not a lecturer or admin, redirect to home page
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default LecturerRoute; 