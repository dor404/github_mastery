const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware to verify JWT token
const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    console.log('Auth middleware - Token received:', token ? 'Yes' : 'No');
    
    if (!token) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Auth middleware - Token decoded:', decoded);
    
    const user = await User.findById(decoded.userId);

    if (!user) {
      console.log('Auth middleware - User not found for ID:', decoded.userId);
      return res.status(401).json({ message: 'User not found' });
    }

    console.log('Auth middleware - User authenticated:', user.username, 'Role:', user.role);
    req.user = user;
    req.token = token;
    next();
  } catch (error) {
    console.error('Auth middleware - Error:', error.message);
    res.status(401).json({ message: 'Please authenticate' });
  }
};

// Middleware to check user role
const checkRole = (...roles) => {
  return (req, res, next) => {
    console.log('checkRole middleware - Required roles:', roles);
    console.log('checkRole middleware - User role:', req.user?.role);
    
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    if (!roles.includes(req.user.role)) {
      console.log('checkRole middleware - Access denied for user:', req.user.username);
      return res.status(403).json({ message: 'Access denied' });
    }

    console.log('checkRole middleware - Access granted for user:', req.user.username);
    next();
  };
};

module.exports = {
  auth,
  checkRole
}; 