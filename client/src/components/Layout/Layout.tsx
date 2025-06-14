import React, { useState, useEffect } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import {
  AppBar,
  Box,
  Button,
  IconButton,
  Toolbar,
  Typography,
  useScrollTrigger,
  Slide,
  CssBaseline,
  Menu,
  MenuItem,
  Avatar,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  AccountCircle as AccountCircleIcon,
  Edit as EditIcon,
  AdminPanelSettings as AdminIcon,
  Logout as LogoutIcon,
  EmojiEvents as LeaderboardIcon,
  Book as BookIcon,
  Assignment as AssignmentIcon,
  Dashboard as DashboardIcon,
  Visibility as VisibilityIcon,
  EmojiEvents as TrophyIcon,
} from '@mui/icons-material';
import Footer from './Footer';
import { useAuth } from '../../context/AuthContext';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const [userMenuAnchor, setUserMenuAnchor] = useState<null | HTMLElement>(null);
  const userMenuOpen = Boolean(userMenuAnchor);
  const [scrollThreshold, setScrollThreshold] = useState(0);
  
  // Set the scroll threshold on mount and when window resizes
  useEffect(() => {
    const calculateThreshold = () => {
      // 1/10 of the page height
      setScrollThreshold(window.innerHeight / 10);
    };
    
    calculateThreshold();
    window.addEventListener('resize', calculateThreshold);
    
    return () => {
      window.removeEventListener('resize', calculateThreshold);
    };
  }, []);
  
  // Custom scroll trigger that uses our specific threshold
  const trigger = useScrollTrigger({
    threshold: scrollThreshold,
    disableHysteresis: false,
  });

  const handleUserMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setUserMenuAnchor(event.currentTarget);
  };

  const handleUserMenuClose = () => {
    setUserMenuAnchor(null);
  };

  const handleLogout = () => {
    logout();
    handleUserMenuClose();
    navigate('/login');
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <CssBaseline />
      <Slide appear={false} direction="down" in={!trigger}>
        <AppBar 
          position="fixed"
          style={{ backgroundColor: '#f50133', background: '#f50133 !important' }}
          sx={{
            background: '#f50133 !important',
            backgroundImage: 'none !important',
            boxShadow: '0px 2px 10px rgba(0,0,0,0.3)',
          }}
        >
          <Toolbar>
            <Typography
              variant="h3"
              noWrap
              component={RouterLink}
              to="/"
              sx={{
                flexGrow: 1,
                textDecoration: 'none',
                color: 'inherit',
                fontWeight: 700,
                fontSize: { xs: '1.5rem', sm: '2rem' },
              }}
            >
              Git Mastery
            </Typography>

            {isAuthenticated ? (
              <>
                <IconButton
                  color="inherit"
                  component={RouterLink}
                  to="/leaderboard"
                  sx={{ 
                    mr: 1,
                    '&:hover': {
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    },
                  }}
                >
                  <LeaderboardIcon sx={{ fontSize: 28 }} />
                </IconButton>
                <IconButton
                  color="inherit"
                  onClick={handleUserMenuClick}
                  sx={{ ml: 2 }}
                >
                  <Avatar 
                    sx={{ 
                      bgcolor: 'primary.dark',
                      height: 32,
                      width: 32,
                      fontSize: '1rem',
                      fontWeight: 500,
                    }}
                    src={user?.avatar}
                  >
                    {!user?.avatar && user?.username?.charAt(0).toUpperCase()}
                  </Avatar>
                </IconButton>
                <Menu
                  anchorEl={userMenuAnchor}
                  open={userMenuOpen}
                  onClose={handleUserMenuClose}
                  onClick={handleUserMenuClose}
                  PaperProps={{
                    elevation: 3,
                    sx: {
                      mt: 1.5,
                      minWidth: 200,
                    },
                  }}
                  transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                  anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                >
                  <MenuItem onClick={() => navigate('/dashboard')}>
                    <ListItemIcon>
                      <DashboardIcon />
                    </ListItemIcon>
                    <ListItemText primary="My Progress" />
                  </MenuItem>
                  <MenuItem onClick={() => navigate('/profile')}>
                    <ListItemIcon>
                      <AccountCircleIcon />
                    </ListItemIcon>
                    <ListItemText primary="My Profile" secondary={user?.username} />
                  </MenuItem>
                  <MenuItem onClick={() => navigate('/achievements')}>
                    <ListItemIcon>
                      <TrophyIcon />
                    </ListItemIcon>
                    <ListItemText primary="My Achievements" />
                  </MenuItem>
                  {(user?.role === 'lecturer' || user?.role === 'admin') && (
                    <MenuItem onClick={() => navigate('/exercises/manage')}>
                      <ListItemIcon>
                        <EditIcon />
                      </ListItemIcon>
                      <ListItemText primary="Manage Exercises" />
                    </MenuItem>
                  )}
                  {(user?.role === 'lecturer' || user?.role === 'admin') && (
                    <MenuItem onClick={() => navigate('/modules/manage')}>
                      <ListItemIcon>
                        <BookIcon />
                      </ListItemIcon>
                      <ListItemText primary="Manage Modules" />
                    </MenuItem>
                  )}
                  {(user?.role === 'lecturer' || user?.role === 'admin') && (
                    <MenuItem onClick={() => navigate('/quizzes/manage')}>
                      <ListItemIcon>
                        <AssignmentIcon />
                      </ListItemIcon>
                      <ListItemText primary="Manage Quizzes" />
                    </MenuItem>
                  )}
                  {(user?.role === 'lecturer' || user?.role === 'admin') && (
                    <MenuItem onClick={() => navigate('/class-monitoring')}>
                      <ListItemIcon>
                        <VisibilityIcon />
                      </ListItemIcon>
                      <ListItemText primary="Class Monitoring" />
                    </MenuItem>
                  )}
                  {user?.role === 'admin' && (
                    <MenuItem onClick={() => navigate('/admin')}>
                      <ListItemIcon>
                        <AdminIcon />
                      </ListItemIcon>
                      <ListItemText primary="Admin Dashboard" />
                    </MenuItem>
                  )}
                  <MenuItem onClick={handleLogout}>
                    <ListItemIcon>
                      <LogoutIcon />
                    </ListItemIcon>
                    <ListItemText primary="Logout" />
                  </MenuItem>
                </Menu>
              </>
            ) : (
              <>
                <Button
                  color="inherit"
                  component={RouterLink}
                  to="/register"
                  sx={{
                    borderRadius: '20px',
                    px: 2,
                    mr: 2,
                    border: '1px solid',
                    borderColor: 'rgba(255, 255, 255, 0.5)',
                    '&:hover': {
                      borderColor: 'white',
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    },
                  }}
                >
                  Register
                </Button>
                <Button
                  color="inherit"
                  component={RouterLink}
                  to="/login"
                  sx={{
                    borderRadius: '20px',
                    px: 2,
                    border: '1px solid',
                    borderColor: 'rgba(255, 255, 255, 0.5)',
                    '&:hover': {
                      borderColor: 'white',
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    },
                  }}
                >
                  Login
                </Button>
              </>
            )}
          </Toolbar>
        </AppBar>
      </Slide>

      {/* Main content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: '100%',
          height: '100%',
          pt: { xs: 8, sm: 9 },
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          overflow: 'auto'
        }}
      >
        {children}
      </Box>
      
      <Footer />
    </Box>
  );
};

export default Layout; 