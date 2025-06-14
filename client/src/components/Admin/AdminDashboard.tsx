import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Box,
  Chip,
  FormControl,
  Select,
  MenuItem,
  Button,
  Alert,
  CircularProgress,
  Snackbar,
  TextField,
  InputAdornment,
  IconButton,
  Tooltip,
  FormHelperText,
} from '@mui/material';
import {
  Search as SearchIcon,
  Refresh as RefreshIcon,
  Help as HelpIcon,
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { adminService, User } from '../../services/adminService';

interface AuthUser {
  id: string;
  username: string;
  email: string;
  role: string;
}

const AdminDashboard: React.FC = () => {
  const { user } = useAuth() as { user: AuthUser | null };
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [roleUpdating, setRoleUpdating] = useState<{[key: string]: boolean}>({});

  // Fetch users on component mount
  useEffect(() => {
    // Verify token before loading
    const token = localStorage.getItem('token');
    if (!token) {
      setError('You must be logged in to access this page');
      setLoading(false);
      return;
    }
    
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Verify if user is admin before fetching
      if (!user || user.role !== 'admin') {
        throw new Error('You must be an admin to access this page');
      }
      
      const fetchedUsers = await adminService.getUsers();
      setUsers(fetchedUsers);
    } catch (err: any) {
      console.error('Error fetching users:', err);
      setError(err.message || 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: 'student' | 'lecturer' | 'admin') => {
    try {
      // Log the exact userId we're getting from the UI
      console.log('Role change requested for userId:', userId, 'Type:', typeof userId);
      
      // Basic validation for userId 
      if (!userId || typeof userId !== 'string') {
        setError('Invalid user ID format');
        return;
      }
      
      // Check if trying to change own role
      if (userId === user?.id) {
        throw new Error('You cannot change your own role');
      }
      
      console.log('Changing role for user:', userId, 'to', newRole);
      setRoleUpdating(prev => ({ ...prev, [userId]: true }));
      setError(''); // Clear any previous errors
      
      // Check if user is authenticated and has admin rights
      if (!user) {
        throw new Error('You must be logged in to perform this action');
      }
      
      if (user.role !== 'admin') {
        throw new Error('You must be an admin to change user roles');
      }
      
      const updatedUser = await adminService.updateUserRole(userId, newRole);
      
      // Update the user in the list
      setUsers(users.map(user => 
        user.id === userId ? { ...user, role: updatedUser.role } : user
      ));
      
      setSuccess(`Role updated successfully for ${updatedUser.username}`);
    } catch (err: any) {
      console.error('Error in handleRoleChange:', err);
      
      // Provide more specific error messages
      if (err.message.includes('403')) {
        setError('Access denied. You do not have permission to update user roles.');
      } else if (err.message.includes('401')) {
        setError('Authentication failed. Please log in again.');
      } else if (err.message.includes('cannot change your own role')) {
        setError('You cannot change your own role.');
      } else if (err.message.includes('Invalid user ID')) {
        setError('Invalid user ID format. Please refresh and try again.');
      } else {
        setError(err.message || 'Error updating user role');
      }
    } finally {
      setRoleUpdating(prev => ({ ...prev, [userId]: false }));
    }
  };

  const handleCloseSnackbar = () => {
    setSuccess('');
    setError('');
  };

  // Enhanced filter users function to handle various email formats
  const filteredUsers = users.filter(user => {
    const lowercaseSearchTerm = searchTerm.toLowerCase().trim();
    if (!lowercaseSearchTerm) return true; // Show all users if search is empty

    // Check for username match
    const usernameMatch = user.username.toLowerCase().includes(lowercaseSearchTerm);
    
    // Check for email match with improved handling of various email formats
    const emailMatch = user.email.toLowerCase().includes(lowercaseSearchTerm);
    
    // Support searching by email domain only (everything after @)
    const isEmailDomainSearch = lowercaseSearchTerm.startsWith('@');
    const emailDomainMatch = isEmailDomainSearch && 
      user.email.toLowerCase().includes(lowercaseSearchTerm.substring(1));

    // Support searching by email username only (everything before @)
    const atSymbolIndex = user.email.indexOf('@');
    const emailUsername = atSymbolIndex !== -1 ? 
      user.email.substring(0, atSymbolIndex).toLowerCase() : '';
    const emailUsernameMatch = lowercaseSearchTerm.endsWith('@') && 
      emailUsername.includes(lowercaseSearchTerm.substring(0, lowercaseSearchTerm.length - 1));
    
    return usernameMatch || emailMatch || emailDomainMatch || emailUsernameMatch;
  });

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'error';
      case 'lecturer':
        return 'warning';
      default:
        return 'primary';
    }
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Admin Dashboard
        </Typography>
        <Typography variant="subtitle1" color="text.secondary" paragraph>
          Manage users and their roles
        </Typography>

        {/* Enhanced Search and Refresh */}
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <FormControl sx={{ flexGrow: 1 }}>
              <TextField
                label="Search users by username or email"
                variant="outlined"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Enter username or email address"
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <Tooltip title="Advanced search: Find users by username, full email, partial email, domain only (@domain.com), or username only (user@)">
                        <SearchIcon />
                      </Tooltip>
                    </InputAdornment>
                  ),
                }}
              />
              <FormHelperText>
                Search by username, complete/partial email, email domain (e.g., @example.com), or email username (e.g., john@).
              </FormHelperText>
            </FormControl>
            <Button 
              variant="outlined" 
              startIcon={<RefreshIcon />}
              onClick={fetchUsers}
            >
              Refresh
            </Button>
          </Box>
        </Box>

        {/* User Table */}
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Username</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Current Role</TableCell>
                <TableCell>Change Role</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4} align="center">
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} align="center">
                    No users found matching "{searchTerm}"
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((userItem) => (
                  <TableRow key={userItem.id}>
                    <TableCell>{userItem.username}</TableCell>
                    <TableCell>{userItem.email}</TableCell>
                    <TableCell>
                      <Chip 
                        label={userItem.role.toUpperCase()} 
                        color={getRoleColor(userItem.role) as "error" | "warning" | "primary"}
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <FormControl size="small" fullWidth>
                        <Select
                          value={userItem.role}
                          onChange={(e) => handleRoleChange(userItem.id, e.target.value as 'student' | 'lecturer' | 'admin')}
                          disabled={roleUpdating[userItem.id] || userItem.id === user?.id}
                          size="small"
                        >
                          <MenuItem value="student">STUDENT</MenuItem>
                          <MenuItem value="lecturer">LECTURER</MenuItem>
                          <MenuItem value="admin">ADMIN</MenuItem>
                        </Select>
                      </FormControl>
                      {roleUpdating[userItem.id] && <CircularProgress size={24} sx={{ ml: 1 }} />}
                      {userItem.id === user?.id && (
                        <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                          (Current user)
                        </Typography>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Alert Messages */}
        <Snackbar 
          open={!!success} 
          autoHideDuration={6000} 
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert onClose={handleCloseSnackbar} severity="success" sx={{ width: '100%' }}>
            {success}
          </Alert>
        </Snackbar>

        <Snackbar 
          open={!!error} 
          autoHideDuration={6000} 
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert onClose={handleCloseSnackbar} severity="error" sx={{ width: '100%' }}>
            {error}
          </Alert>
        </Snackbar>
      </Box>
    </Container>
  );
};

export default AdminDashboard; 