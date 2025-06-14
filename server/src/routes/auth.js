const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { auth, checkRole } = require('../middleware/auth');
const sendEmail = require('../utils/email');
const crypto = require('crypto');
const mongoose = require('mongoose');

const router = express.Router();

// Register route
router.post('/register', async (req, res) => {
  try {
    console.log('Registration request received');
    const { username, email, password, role, securityQuestions } = req.body;
    
    // Debug logging for security questions
    console.log('Security questions provided in request:', !!securityQuestions);
    if (securityQuestions) {
      console.log('Security question fields:', Object.keys(securityQuestions));
      console.log('Teacher name provided:', !!securityQuestions.teacherName);
      console.log('Grandmother name provided:', !!securityQuestions.grandmotherName);
    }
    
    // Validation checks
    if (!username || !email || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }

    // Check if user already exists
    const userExists = await User.findOne({ $or: [{ email }, { username }] });
    if (userExists) {
      return res.status(400).json({ message: 'User with this email or username already exists' });
    }

    // Create initial user data
    const userData = {
      username,
      email: email.toLowerCase(),
      password,
      role: role || 'student'
    };

    // Add security questions if provided
    if (securityQuestions && 
        typeof securityQuestions.teacherName === 'string' && 
        typeof securityQuestions.grandmotherName === 'string' &&
        securityQuestions.teacherName.trim() &&
        securityQuestions.grandmotherName.trim()) {
      
      console.log('Creating security questions structure');
      
      // Create security questions structure
      userData.securityQuestions = {
        teacherName: {
          question: "What is your first grade teacher's name?",
          answer: securityQuestions.teacherName.trim()
        },
        grandmotherName: {
          question: "What is your grandmother's name?",
          answer: securityQuestions.grandmotherName.trim()
        }
      };
      
      console.log('Security questions added to userData');
    } else {
      console.log('No valid security questions provided');
    }

    // Create and save user with mongoose
    const user = new User(userData);
    
    // Log the user object before saving
    console.log('User object before saving has securityQuestions:', 
      !!user.securityQuestions, 
      user.securityQuestions ? Object.keys(user.securityQuestions) : []
    );
    
    // Save the user to the database
    const savedUserDoc = await user.save();
    
    // Immediately query the database for the user to verify storage
    const verifiedUser = await User.findById(savedUserDoc._id);
    
    console.log('User saved with ID:', verifiedUser._id.toString());
    console.log('Verified user has securityQuestions:', !!verifiedUser.securityQuestions);
    
    if (verifiedUser.securityQuestions) {
      console.log('Security questions structure in database:', 
        JSON.stringify(verifiedUser.securityQuestions, (key, value) => 
          key === 'answer' ? '[REDACTED]' : value, 2)
      );
      
      // Double check all required fields exist
      const hasTeacherQuestion = verifiedUser.securityQuestions.teacherName && 
                                verifiedUser.securityQuestions.teacherName.question;
      const hasTeacherAnswer = verifiedUser.securityQuestions.teacherName && 
                              verifiedUser.securityQuestions.teacherName.answer;
      const hasGrandmotherQuestion = verifiedUser.securityQuestions.grandmotherName && 
                                    verifiedUser.securityQuestions.grandmotherName.question;
      const hasGrandmotherAnswer = verifiedUser.securityQuestions.grandmotherName && 
                                  verifiedUser.securityQuestions.grandmotherName.answer;
      
      console.log('Security questions completeness check:', {
        teacherQuestion: hasTeacherQuestion,
        teacherAnswer: hasTeacherAnswer,
        grandmotherQuestion: hasGrandmotherQuestion,
        grandmotherAnswer: hasGrandmotherAnswer
      });
    } else {
      console.warn('WARNING: Security questions not found in saved user');
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: verifiedUser._id, role: verifiedUser.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: verifiedUser._id,
        username: verifiedUser.username,
        email: verifiedUser.email,
        role: verifiedUser.role
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Registration failed', error: error.message });
  }
});

// Login route
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Check password
    const isValidPassword = await user.comparePassword(password);
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Create JWT token
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Error during login' });
  }
});

// Get current user profile
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching profile', error: error.message });
  }
});

// Helper function to validate image URL
const isValidImageUrl = (url) => {
  if (!url) return true; // Empty URLs are considered valid (no avatar)
  
  // Check if it's a data URL for images
  if (url.startsWith('data:image/') && url.includes('base64,')) {
    return true;
  }
  
  // Check if it's a valid web URL
  try {
    const urlObj = new URL(url);
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
  } catch {
    return false;
  }
};

// Update user profile
router.patch('/profile', auth, async (req, res) => {
  try {
    // Enhanced debugging
    console.log('Profile update request received');
    console.log('Body content type:', typeof req.body);
    console.log('Request body keys:', Object.keys(req.body));
    
    // Check for non-string values that might cause issues
    Object.entries(req.body).forEach(([key, value]) => {
      console.log(`Field ${key} type:`, typeof value);
      if (typeof value === 'object') {
        console.log(`Field ${key} contains an object instead of a string`);
      }
    });

    const updates = Object.keys(req.body);
    const allowedUpdates = ['username', 'email', 'password', 'avatar'];
    
    // Log for debugging
    console.log('Requested updates:', updates);
    
    // Validate update fields
    const invalidUpdates = updates.filter(update => !allowedUpdates.includes(update));
    if (invalidUpdates.length > 0) {
      console.log('Invalid updates detected:', invalidUpdates);
      return res.status(400).json({ 
        message: 'Invalid updates', 
        details: `Fields not allowed: ${invalidUpdates.join(', ')}` 
      });
    }
    
    // Validate email format if being updated
    if (req.body.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(req.body.email)) {
        return res.status(400).json({ 
          message: 'Invalid email format'
        });
      }
    }
    
    // Validate username if being updated
    if (req.body.username) {
      if (req.body.username.length < 3 || req.body.username.length > 50) {
        return res.status(400).json({ 
          message: 'Username must be between 3 and 50 characters'
        });
      }
    }
    
    // Check if avatar is too large
    if (req.body.avatar && req.body.avatar.length > 600000) { // Increased to ~600KB limit
      return res.status(400).json({ 
        message: 'Avatar image is too large. Please use a smaller image or lower quality.'
      });
    }
    
    // Validate avatar URL if provided
    if (req.body.avatar && !isValidImageUrl(req.body.avatar)) {
      console.log('Avatar validation failed, avatar starts with:', req.body.avatar.substring(0, 30));
      return res.status(400).json({ 
        message: 'Invalid avatar URL. Please provide a valid image URL or data URL.'
      });
    }

    // Apply updates
    updates.forEach(update => {
      if (update === 'email') {
        req.user[update] = req.body[update].toLowerCase();
      } else {
        req.user[update] = req.body[update];
      }
    });
    
    await req.user.save();
    
    res.json({
      message: 'Profile updated successfully',
      user: {
        id: req.user._id,
        username: req.user.username,
        email: req.user.email,
        role: req.user.role,
        avatar: req.user.avatar
      }
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(400).json({ 
      message: 'Error updating profile', 
      error: error.message 
    });
  }
});

// Forgot password route
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ message: 'No account with that email exists' });
    }

    // Generate reset token
    const resetToken = user.generatePasswordResetToken();
    await user.save();

    // Create reset URL
    const resetUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/reset-password/${resetToken}`;

    // Create email content
    const message = `
      <h1>Password Reset Request</h1>
      <p>You requested to reset your password. Click the link below to reset it:</p>
      <a href="${resetUrl}" style="
        display: inline-block;
        padding: 10px 20px;
        background-color: #2196f3;
        color: white;
        text-decoration: none;
        border-radius: 5px;
        margin: 20px 0;
      ">Reset Password</a>
      <p>If you didn't request this, please ignore this email.</p>
      <p>This link will expire in 1 hour.</p>
    `;

    try {
      await sendEmail({
        email: user.email,
        subject: 'Password Reset Request',
        html: message,
      });

      res.json({
        message: 'Password reset email sent successfully',
        info: process.env.NODE_ENV === 'development' ? 'Check the console for the test email URL' : undefined
      });
    } catch (emailError) {
      console.error('Error sending password reset email:', emailError);
      
      // Reset the token fields
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;
      await user.save();

      throw new Error('Failed to send password reset email. Please try again later.');
    }
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: error.message || 'Error processing password reset request' });
  }
});

// Reset password route
router.post('/reset-password/:token', async (req, res) => {
  try {
    const { password } = req.body;
    const resetToken = crypto
      .createHash('sha256')
      .update(req.params.token)
      .digest('hex');

    // Find user with valid reset token and token not expired
    const user = await User.findOne({
      resetPasswordToken: resetToken,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        message: 'Password reset token is invalid or has expired'
      });
    }

    // Set new password and clear reset token fields
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    // Create new JWT token
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Password reset successful',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Error resetting password' });
  }
});

// Reset password with security questions
router.post('/reset-by-security-questions', async (req, res) => {
  try {
    console.log('Received reset by security questions request');
    const { email, securityAnswers, newPassword } = req.body;

    // Log request data for debugging (without displaying sensitive data)
    console.log('Reset request email:', email);
    console.log('Security answers provided:', JSON.stringify({
      teacherName: securityAnswers?.teacherName ? 'provided' : 'missing',
      grandmotherName: securityAnswers?.grandmotherName ? 'provided' : 'missing'
    }));
    console.log('New password provided:', newPassword ? 'Yes' : 'No');

    // Validate required fields
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }
    
    if (!securityAnswers) {
      return res.status(400).json({ message: 'Security answers are required' });
    }
    
    if (!newPassword) {
      return res.status(400).json({ message: 'New password is required' });
    }

    // Validate security answers structure
    if (!securityAnswers.teacherName || !securityAnswers.grandmotherName) {
      console.log('Security answers incomplete:', {
        hasTeacherName: !!securityAnswers.teacherName,
        hasGrandmotherName: !!securityAnswers.grandmotherName
      });
      return res.status(400).json({ 
        message: 'Both security answers must be provided'
      });
    }

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      console.log('No user found with email:', email);
      return res.status(404).json({ message: 'No account with that email exists' });
    }

    // Log user document details to diagnose issues
    console.log('User found with fields:', Object.keys(user._doc || user));
    console.log('User has securityQuestions:', !!user.securityQuestions);
    
    // Detailed check for security questions structure
    if (!user.securityQuestions) {
      console.log('Security questions not found in user document');
      return res.status(400).json({ 
        message: 'Security questions not set up for this account' 
      });
    }
    
    // Log the exact structure of security questions to diagnose the issue
    console.log('Security questions structure in DB:', 
      JSON.stringify(user.securityQuestions, (key, value) => 
        key === 'answer' ? '[REDACTED]' : value, 2)
    );
    
    // Check for specific object structure to catch MongoDB issues
    const hasTeacherName = user.securityQuestions && user.securityQuestions.teacherName;
    const hasGrandmotherName = user.securityQuestions && user.securityQuestions.grandmotherName;
    
    if (!hasTeacherName || !hasGrandmotherName) {
      console.log('Security questions missing required properties:', {
        hasTeacherName,
        hasGrandmotherName
      });
      return res.status(400).json({ 
        message: 'Security questions not properly set up (missing required fields)'
      });
    }
    
    // Check if answer fields exist in security questions
    const hasTeacherAnswer = hasTeacherName && user.securityQuestions.teacherName.answer;
    const hasGrandmotherAnswer = hasGrandmotherName && user.securityQuestions.grandmotherName.answer;
    
    if (!hasTeacherAnswer || !hasGrandmotherAnswer) {
      console.log('Security question answers missing:', {
        hasTeacherAnswer,
        hasGrandmotherAnswer
      });
      return res.status(400).json({ 
        message: 'Security question answers not set up properly'
      });
    }

    // Validate security answers (case insensitive comparison)
    const isTeacherAnswerCorrect = 
      user.securityQuestions.teacherName.answer.toLowerCase() === 
      securityAnswers.teacherName.toLowerCase();
    
    const isGrandmotherAnswerCorrect = 
      user.securityQuestions.grandmotherName.answer.toLowerCase() === 
      securityAnswers.grandmotherName.toLowerCase();

    console.log('Security answer validation:', {
      teacherAnswer: isTeacherAnswerCorrect ? 'correct' : 'incorrect',
      grandmotherAnswer: isGrandmotherAnswerCorrect ? 'correct' : 'incorrect'
    });

    if (!isTeacherAnswerCorrect || !isGrandmotherAnswerCorrect) {
      return res.status(400).json({ 
        message: 'Security question answers are incorrect'
      });
    }

    // Set new password
    user.password = newPassword;
    // Clear any existing reset tokens
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();
    console.log('Password updated successfully for user:', email);

    // Create new JWT token
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Password reset successful',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Security question reset error:', error);
    res.status(500).json({ 
      message: 'Error resetting password with security questions',
      error: error.message 
    });
  }
});

// Get all users (admin only)
router.get('/users', auth, checkRole('admin'), async (req, res) => {
  try {
    const users = await User.find({})
      .select('-password -resetPasswordToken -resetPasswordExpires')
      .sort('username');
    
    // Transform user objects to ensure proper ID format
    const formattedUsers = users.map(user => ({
      id: user._id.toString(),
      username: user.username,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    }));
    
    res.json(formattedUsers);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching users', error: error.message });
  }
});

// Update user role (admin only)
router.patch('/users/:id/role', auth, checkRole('admin'), async (req, res) => {
  try {
    const { role } = req.body;
    console.log('Update role request - User ID:', req.params.id, 'New role:', role);
    console.log('Request from admin user:', req.user.username, 'with ID:', req.user._id);
    
    // Better input validation - log the exact format we received
    console.log('Update role - ID type:', typeof req.params.id, 'Value:', req.params.id);
    
    // Try to handle the ID format more gracefully
    let userId = req.params.id;
    // Remove any non-alphanumeric characters that might cause problems with ObjectId
    userId = userId.replace(/[^a-fA-F0-9]/g, '');
    
    if (!userId || userId.length !== 24 || !mongoose.Types.ObjectId.isValid(userId)) {
      console.log('Update role - Invalid user ID format (after cleanup):', userId);
      return res.status(400).json({ message: 'Invalid user ID format' });
    }
    
    if (!role || !['student', 'lecturer', 'admin'].includes(role)) {
      console.log('Update role - Invalid role:', role);
      return res.status(400).json({ message: 'Invalid role' });
    }
    
    // Check if user is trying to change their own role
    if (userId === req.user._id.toString()) {
      console.log('Update role - Admin trying to change their own role');
      return res.status(403).json({ message: 'You cannot change your own role' });
    }
    
    // Use the cleaned userId for the query
    const user = await User.findById(userId);
    
    if (!user) {
      console.log('Update role - User not found:', userId);
      return res.status(404).json({ message: 'User not found' });
    }
    
    console.log('Update role - Found user:', user.username, 'Current role:', user.role, 'New role:', role);
    
    // Check if role is already set to the requested value
    if (user.role === role) {
      console.log('Update role - Role already set to', role, 'for user:', user.username);
      return res.json({
        message: 'User already has this role',
        user: {
          id: user._id.toString(),
          username: user.username,
          email: user.email,
          role: user.role
        }
      });
    }
    
    // Update the role
    user.role = role;
    await user.save();
    
    console.log('Update role - Role updated successfully for user:', user.username);
    
    res.json({
      message: 'User role updated successfully',
      user: {
        id: user._id.toString(),
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Update role - Error:', error.message, error.stack);
    res.status(500).json({ message: 'Error updating user role', error: error.message });
  }
});

module.exports = router; 