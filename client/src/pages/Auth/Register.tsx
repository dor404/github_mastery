import React, { useState } from 'react';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  Link,
  Alert,
  CircularProgress,
  Divider,
  FormHelperText,
  FormHelperTextProps,
} from '@mui/material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { authService, RegisterData } from '../../services/authService';

interface SecurityQuestionErrors {
  teacherName?: string;
  grandmotherName?: string;
}

interface RegisterProps {
  onRegister?: (data: RegisterData) => void;
}

interface ExtendedFormHelperTextProps extends FormHelperTextProps {
  'data-testid'?: string;
}

const Register: React.FC<RegisterProps> = ({ onRegister }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<RegisterData>({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'student',
    securityQuestions: {
      teacherName: '',
      grandmotherName: '',
    }
  });
  const [errors, setErrors] = useState<Partial<RegisterData & SecurityQuestionErrors>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    if (name === 'teacherName' || name === 'grandmotherName') {
      // Handle security question fields
      setFormData((prev) => ({
        ...prev,
        securityQuestions: {
          ...prev.securityQuestions!,
          [name]: value
        }
      }));
      
      // Clear error when user starts typing
      if (errors[name]) {
        setErrors((prev) => ({ ...prev, [name]: '' }));
      }
    } else {
      // Handle regular fields
      setFormData((prev) => ({ ...prev, [name]: value }));
      
      // Clear error when user starts typing
      if (errors[name as keyof RegisterData]) {
        setErrors((prev) => ({ ...prev, [name]: '' }));
      }
    }
  };

  const handleRoleChange = (e: any) => {
    setFormData((prev) => ({ ...prev, role: e.target.value }));
  };

  const validateForm = () => {
    const newErrors: Partial<RegisterData & SecurityQuestionErrors> = {};

    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    // Validate security questions
    if (!formData.securityQuestions?.teacherName.trim()) {
      newErrors.teacherName = 'Answer is required';
    }

    if (!formData.securityQuestions?.grandmotherName.trim()) {
      newErrors.grandmotherName = 'Answer is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      
      // Create a clean copy without confirmPassword and log it
      const { confirmPassword, ...registerData } = formData;
      
      // Validate security questions specifically
      if (!registerData.securityQuestions?.teacherName.trim() || 
          !registerData.securityQuestions?.grandmotherName.trim()) {
        console.warn('Security questions incomplete - registration might fail later');
      } else {
        console.log('Security questions provided and valid');
      }
      
      // Log what we're sending
      console.log('Sending registration with data:', {
        username: registerData.username,
        email: registerData.email,
        securityQuestionsProvided: !!registerData.securityQuestions,
        securityQuestionsValid: 
          !!registerData.securityQuestions?.teacherName.trim() && 
          !!registerData.securityQuestions?.grandmotherName.trim()
      });
      
      // Perform registration
      await authService.register(registerData);
      if (onRegister) {
        onRegister(registerData);
      }
      navigate('/login');
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          marginTop: 8,
          marginBottom: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper
          elevation={3}
          sx={{
            padding: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            width: '100%',
          }}
          data-testid="register-form"
        >
          <Typography component="h1" variant="h4" gutterBottom>
            Create Account
          </Typography>

          {error && (
            <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="username"
              label="Username"
              name="username"
              autoComplete="username"
              autoFocus
              value={formData.username}
              onChange={handleInputChange}
              error={!!errors.username}
              helperText={errors.username}
              FormHelperTextProps={{ 'data-testid': 'username-helper-text' } as ExtendedFormHelperTextProps}
            />

            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email Address"
              name="email"
              autoComplete="email"
              value={formData.email}
              onChange={handleInputChange}
              error={!!errors.email}
              helperText={errors.email}
              FormHelperTextProps={{ 'data-testid': 'email-helper-text' } as ExtendedFormHelperTextProps}
            />

            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Password"
              type="password"
              id="password"
              autoComplete="new-password"
              value={formData.password}
              onChange={handleInputChange}
              error={!!errors.password}
              helperText={errors.password}
              FormHelperTextProps={{ 'data-testid': 'password-helper-text' } as ExtendedFormHelperTextProps}
            />

            <TextField
              margin="normal"
              required
              fullWidth
              name="confirmPassword"
              label="Confirm Password"
              type="password"
              id="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              error={!!errors.confirmPassword}
              helperText={errors.confirmPassword}
              FormHelperTextProps={{ 'data-testid': 'confirmPassword-helper-text' } as ExtendedFormHelperTextProps}
            />

            <Divider sx={{ my: 3 }} />
            
            <Typography variant="h6" gutterBottom>
              Security Questions
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              These questions will help you recover your account if you forget your password.
            </Typography>

            <TextField
              margin="normal"
              required
              fullWidth
              label="What is your first grade teacher's name?"
              name="teacherName"
              value={formData.securityQuestions?.teacherName || ''}
              onChange={handleInputChange}
              error={!!errors.teacherName}
              helperText={errors.teacherName || 'This answer will be used to verify your identity'}
              FormHelperTextProps={{ 'data-testid': 'teacherName-helper-text' } as ExtendedFormHelperTextProps}
            />

            <TextField
              margin="normal"
              required
              fullWidth
              label="What is your grandmother's name?"
              name="grandmotherName"
              value={formData.securityQuestions?.grandmotherName || ''}
              onChange={handleInputChange}
              error={!!errors.grandmotherName}
              helperText={errors.grandmotherName || 'This answer will be used to verify your identity'}
              FormHelperTextProps={{ 'data-testid': 'grandmotherName-helper-text' } as ExtendedFormHelperTextProps}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : 'Register'}
            </Button>

            <Box sx={{ textAlign: 'center' }}>
              <Link component={RouterLink} to="/login" variant="body2">
                Already have an account? Sign in
              </Link>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default Register; 