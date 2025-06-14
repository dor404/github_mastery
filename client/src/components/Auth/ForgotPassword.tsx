import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Typography,
  Box,
  Divider
} from '@mui/material';
import { authService, SecurityQuestionsData } from '../../services/authService';

interface ForgotPasswordProps {
  open: boolean;
  onClose: () => void;
}

interface ExtendedSecurityQuestionsData extends SecurityQuestionsData {
  confirmPassword: string;
}

const ForgotPassword: React.FC<ForgotPasswordProps> = ({ open, onClose }) => {
  const [securityData, setSecurityData] = useState<ExtendedSecurityQuestionsData>({
    email: '',
    securityAnswers: {
      teacherName: '',
      grandmotherName: ''
    },
    newPassword: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSecurityInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    if (name === 'teacherName' || name === 'grandmotherName') {
      setSecurityData(prev => ({
        ...prev,
        securityAnswers: {
          ...prev.securityAnswers,
          [name]: value
        }
      }));
    } else {
      setSecurityData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSecuritySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    // Validate form
    if (!securityData.email.trim()) {
      setError('Email is required');
      return;
    }

    if (!securityData.securityAnswers.teacherName.trim()) {
      setError('Teacher name answer is required');
      return;
    }

    if (!securityData.securityAnswers.grandmotherName.trim()) {
      setError('Grandmother name answer is required');
      return;
    }

    if (!securityData.newPassword.trim()) {
      setError('New password is required');
      return;
    }

    if (securityData.newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (!securityData.confirmPassword.trim()) {
      setError('Please confirm your password');
      return;
    }

    if (securityData.newPassword !== securityData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      setLoading(true);
      // Log the request for debugging
      console.log('Sending security question reset request:', {
        email: securityData.email,
        teacherNameProvided: !!securityData.securityAnswers.teacherName,
        grandmotherNameProvided: !!securityData.securityAnswers.grandmotherName,
        newPasswordProvided: !!securityData.newPassword
      });

      console.log('Request structure being sent:', {
        email: securityData.email,
        securityAnswers: {
          teacherName: '[REDACTED]',
          grandmotherName: '[REDACTED]'
        },
        newPassword: '[REDACTED]'
      });
      
      // Extract the original SecurityQuestionsData without confirmPassword
      const { confirmPassword, ...resetData } = securityData;
      await authService.resetPasswordBySecurityQuestions(resetData);
      setSuccess(true);
      // Reset form
      setSecurityData({
        email: '',
        securityAnswers: {
          teacherName: '',
          grandmotherName: ''
        },
        newPassword: '',
        confirmPassword: ''
      });
    } catch (err: any) {
      console.error('Security question reset error:', err);
      setError(err.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setError('');
    setSuccess(false);
    setSecurityData({
      email: '',
      securityAnswers: {
        teacherName: '',
        grandmotherName: ''
      },
      newPassword: '',
      confirmPassword: ''
    });
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Reset Password with Security Questions</DialogTitle>
      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            Password has been reset successfully. You can now log in with your new password.
          </Alert>
        )}

        <Typography variant="body1" sx={{ mb: 2 }}>
          Answer your security questions to reset your password.
        </Typography>
        <form onSubmit={handleSecuritySubmit}>
          <TextField
            margin="dense"
            required
            label="Email Address"
            type="email"
            fullWidth
            name="email"
            value={securityData.email}
            onChange={handleSecurityInputChange}
            disabled={loading}
            autoFocus
          />
          
          <Divider sx={{ my: 2 }} />
          <Typography variant="subtitle1" gutterBottom>
            Security Questions
          </Typography>
          
          <TextField
            margin="dense"
            required
            label="What is your first grade teacher's name?"
            fullWidth
            name="teacherName"
            value={securityData.securityAnswers.teacherName}
            onChange={handleSecurityInputChange}
            disabled={loading}
          />
          
          <TextField
            margin="dense"
            required
            label="What is your grandmother's name?"
            fullWidth
            name="grandmotherName"
            value={securityData.securityAnswers.grandmotherName}
            onChange={handleSecurityInputChange}
            disabled={loading}
          />
          
          <Divider sx={{ my: 2 }} />
          
          <TextField
            margin="dense"
            required
            label="New Password"
            type="password"
            fullWidth
            name="newPassword"
            value={securityData.newPassword}
            onChange={handleSecurityInputChange}
            disabled={loading}
            helperText="Password must be at least 6 characters"
          />
          
          <TextField
            margin="dense"
            required
            label="Confirm New Password"
            type="password"
            fullWidth
            name="confirmPassword"
            value={securityData.confirmPassword}
            onChange={handleSecurityInputChange}
            disabled={loading}
            helperText="Enter the same password again"
          />
          
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
            <Button onClick={handleClose} disabled={loading} sx={{ mr: 1 }}>
              Close
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={loading}
              sx={{ minWidth: 100 }}
            >
              {loading ? <CircularProgress size={24} /> : 'Reset Password'}
            </Button>
          </Box>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ForgotPassword; 