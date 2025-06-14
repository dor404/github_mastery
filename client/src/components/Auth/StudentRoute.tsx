import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

interface StudentRouteProps {
  children: React.ReactNode;
}

const StudentRoute: React.FC<StudentRouteProps> = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    // Redirect to login while saving the attempted path
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (user?.role !== 'student') {
    // If user is not a student, redirect to home page
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default StudentRoute; 