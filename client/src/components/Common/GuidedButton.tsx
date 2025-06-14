import React from 'react';
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Box,
} from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

interface GuidedButtonProps {
  title: string;
  description: string;
  path: string;
  icon?: React.ReactNode;
}

const GuidedButton: React.FC<GuidedButtonProps> = ({
  title,
  description,
  path,
  icon,
}) => {
  const [open, setOpen] = React.useState(false);
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleClick = () => {
    if (!isAuthenticated) {
      // Navigate to login while saving the intended destination
      navigate('/login', { state: { from: { pathname: path } } });
    } else {
      navigate(path);
    }
  };

  const handleRegister = () => {
    setOpen(false);
    navigate('/register');
  };

  const handleLogin = () => {
    setOpen(false);
    navigate('/login');
  };

  return (
    <>
      <Button
        variant="contained"
        onClick={handleClick}
        startIcon={icon}
        sx={{
          width: '100%',
          py: 2,
          backgroundColor: '#2c3e50',
          '&:hover': {
            backgroundColor: '#34495e',
            transform: 'translateY(-2px)',
            transition: 'all 0.3s ease',
          },
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
        }}
      >
        <Box sx={{ textAlign: 'left', width: '100%' }}>
          <Typography variant="h6" component="div">
            {title}
          </Typography>
          <Typography variant="body2" color="rgba(255,255,255,0.7)">
            {description}
          </Typography>
        </Box>
      </Button>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Authentication Required</DialogTitle>
        <DialogContent>
          <Typography>
            To access {title}, you need to have an account. Would you like to register
            or login?
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button onClick={() => setOpen(false)} color="inherit">
            Cancel
          </Button>
          <Button onClick={handleLogin} variant="outlined">
            Login
          </Button>
          <Button onClick={handleRegister} variant="contained">
            Register
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default GuidedButton; 