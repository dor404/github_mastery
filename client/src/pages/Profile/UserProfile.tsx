import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Avatar,
  TextField,
  Button,
  Grid,
  Alert,
  CircularProgress,
  Divider,
  IconButton,
  InputAdornment
} from '@mui/material';
import {
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Image as ImageIcon
} from '@mui/icons-material';
import { useAuth } from '../../hooks/useAuth';
import { UpdateProfileData } from '../../services/authService';

const UserProfile: React.FC = () => {
  const { user, updateUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [avatarPreview, setAvatarPreview] = useState('');
  const [avatarError, setAvatarError] = useState(false);
  
  const [formData, setFormData] = useState<UpdateProfileData>({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    avatar: ''
  });

  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username || '',
        email: user.email || '',
        password: '',
        confirmPassword: '',
        avatar: user.avatar || ''
      });
      setAvatarPreview(user.avatar || '');
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Handle avatar preview
    if (name === 'avatar') {
      if (value) {
        setAvatarPreview(value);
        setAvatarError(false);
        
        // Reset any previous error messages
        if (errorMessage.includes('avatar') || errorMessage.includes('URL')) {
          setErrorMessage('');
        }
      } else {
        setAvatarPreview('');
      }
    }
  };

  // Handle avatar image error
  const handleAvatarError = () => {
    setAvatarError(true);
    setAvatarPreview('');
  };

  // Try a different avatar service as fallback
  const generateFallbackAvatar = () => {
    const initials = user?.username?.split(' ')
      .map(name => name[0])
      .join('')
      .toUpperCase();
    
    // Use UI Avatars as fallback
    return `https://ui-avatars.com/api/?name=${initials}&background=f05133&color=fff&size=200`;
  };

  const toggleEditing = () => {
    if (isEditing) {
      // Reset form data when canceling edit
      if (user) {
        setFormData({
          username: user.username || '',
          email: user.email || '',
          password: '',
          confirmPassword: '',
          avatar: user.avatar || ''
        });
        setAvatarPreview(user.avatar || '');
        setAvatarError(false);
      }
    }
    setIsEditing(!isEditing);
    // Clear messages when toggling edit mode
    setSuccessMessage('');
    setErrorMessage('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSuccessMessage('');
    setErrorMessage('');

    // Validate passwords match if password is being changed
    if (formData.password && formData.password.trim() !== '') {
      if (formData.password !== formData.confirmPassword) {
        setErrorMessage('Passwords do not match. Please try again.');
        setIsSubmitting(false);
        return;
      }
    }

    try {
      // Create a completely new object with explicit fields only
      // Use empty object literal to avoid any prototype inheritance issues
      const payload: Record<string, string> = {};
      
      // Explicitly handle each field separately
      if (formData.username && formData.username !== user?.username) {
        payload.username = formData.username.trim();
      }
      
      if (formData.email && formData.email !== user?.email) {
        payload.email = formData.email.trim();
      }
      
      if (formData.password && formData.password.trim() !== '') {
        payload.password = formData.password;
      }
      
      if (formData.avatar && formData.avatar !== user?.avatar) {
        // Don't update avatar if there was an error loading the preview
        if (!avatarError) {
          // Final size check
          if (formData.avatar.length > 300000) {
            setErrorMessage('Avatar image is too large. Please use a smaller image.');
            setIsSubmitting(false);
            return;
          }
          payload.avatar = formData.avatar;
        } else {
          setErrorMessage('Invalid avatar URL. Please provide a valid image URL.');
          setIsSubmitting(false);
          return;
        }
      }

      // Only update if there are changes
      if (Object.keys(payload).length > 0) {
        // Log what we're sending to help debug
        console.log('Sending update with ONLY these fields:', Object.keys(payload));
        
        // Direct call to auth service with our clean object
        await updateUser(payload as UpdateProfileData);
        setSuccessMessage('Profile updated successfully');
        setIsEditing(false);
      } else {
        setErrorMessage('No changes to save');
      }
    } catch (error: any) {
      setErrorMessage(error.message || 'Failed to update profile');
    } finally {
      setIsSubmitting(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const tryFallbackAvatar = () => {
    const fallbackUrl = generateFallbackAvatar();
    setFormData(prev => ({
      ...prev,
      avatar: fallbackUrl
    }));
    setAvatarPreview(fallbackUrl);
    setAvatarError(false);
  };

  // Add a function to handle file uploads for avatar with compression
  const handleAvatarUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setErrorMessage('Please select an image file.');
        return;
      }
      
      // Validate file size (5MB max for original file)
      if (file.size > 5 * 1024 * 1024) {
        setErrorMessage('Image file size must be less than 5MB.');
        return;
      }
      
      // Create an image element to resize
      const img = new Image();
      const reader = new FileReader();
      
      reader.onload = (e) => {
        if (e.target && e.target.result) {
          img.src = e.target.result as string;
          
          img.onload = () => {
            // Create a canvas to resize the image
            const canvas = document.createElement('canvas');
            
            // Even smaller dimensions for avatar
            const maxWidth = 100; // Further reduced for better compression
            const maxHeight = 100; // Further reduced for better compression
            
            let width = img.width;
            let height = img.height;
            
            // Calculate new dimensions, maintain aspect ratio
            if (width > height) {
              if (width > maxWidth) {
                height = Math.round(height * (maxWidth / width));
                width = maxWidth;
              }
            } else {
              if (height > maxHeight) {
                width = Math.round(width * (maxHeight / height));
                height = maxHeight;
              }
            }
            
            // Set canvas dimensions and draw resized image
            canvas.width = width;
            canvas.height = height;
            
            const ctx = canvas.getContext('2d');
            if (ctx) {
              // Use a white background to prevent transparency issues
              ctx.fillStyle = "#FFFFFF";
              ctx.fillRect(0, 0, width, height);
              
              // Draw the image on top
              ctx.drawImage(img, 0, 0, width, height);
              
              // Get the image mime type from the original file
              const mimeType = file.type || 'image/jpeg';
              
              // Convert to data URL with even lower quality
              const compressedDataUrl = canvas.toDataURL(mimeType, 0.35); // Further reduced quality
              
              // Log size for debugging
              const fileSizeKB = Math.round(compressedDataUrl.length/1024);
              console.log(`Compressed avatar size: ${fileSizeKB}KB`);
              
              // Validate the data URL structure
              if (!compressedDataUrl.startsWith('data:image/')) {
                setErrorMessage('Invalid image format after processing.');
                return;
              }
              
              // Stricter size limit
              if (compressedDataUrl.length > 500000) { // 500KB client-side limit
                setErrorMessage('Image is still too large after compression. Please use a smaller image.');
                return;
              }
              
              // Create a fresh object with only the avatar property
              setFormData(prev => ({
                ...prev,
                avatar: compressedDataUrl
              }));
              
              // Update the preview
              setAvatarPreview(compressedDataUrl);
              setAvatarError(false);
              setErrorMessage('');
            }
          };
        }
      };
      
      reader.readAsDataURL(file);
    }
  };

  if (!user) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  // Generate initials for avatar
  const getInitials = () => {
    return user.username
      .split(' ')
      .map(name => name[0])
      .join('')
      .toUpperCase();
  };

  return (
    <Box sx={{ py: 4, px: { xs: 2, md: 0 } }}>
      <Typography variant="h4" component="h1" gutterBottom align="center" sx={{ mb: 4 }}>
        User Profile
      </Typography>

      <Paper 
        sx={{ 
          maxWidth: 800, 
          margin: '0 auto', 
          p: { xs: 2, md: 4 },
          borderRadius: 2,
          boxShadow: 3
        }}
      >
        {/* Profile Header */}
        <Box 
          sx={{ 
            display: 'flex', 
            flexDirection: { xs: 'column', sm: 'row' }, 
            alignItems: 'center',
            mb: 4
          }}
        >
          <Box sx={{ position: 'relative' }}>
            <Avatar 
              sx={{ 
                width: 100, 
                height: 100, 
                fontSize: '2rem',
                bgcolor: 'primary.main',
                color: 'white',
                mb: { xs: 2, sm: 0 },
                mr: { sm: 4 }
              }}
              src={avatarError ? '' : (user.avatar || '')}
              imgProps={{ 
                onError: handleAvatarError 
              }}
            >
              {getInitials()}
            </Avatar>
            {isEditing && avatarPreview && (
              <Avatar 
                sx={{ 
                  position: 'absolute',
                  top: 70,
                  left: 70,
                  width: 40, 
                  height: 40,
                  border: '2px solid white',
                  bgcolor: 'primary.main',
                  color: 'white',
                  fontSize: '0.8rem'
                }}
                src={avatarError ? '' : avatarPreview}
                imgProps={{ 
                  onError: handleAvatarError 
                }}
              >
                {getInitials()}
              </Avatar>
            )}
          </Box>
          
          <Box>
            <Typography variant="h5" component="h2">
              {user.username}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {user.email}
            </Typography>
            <Typography variant="body2" sx={{ mt: 1 }}>
              Role: <strong>{user.role.charAt(0).toUpperCase() + user.role.slice(1)}</strong>
            </Typography>
          </Box>
          
          <Box sx={{ ml: { sm: 'auto' } }}>
            <Button
              variant={isEditing ? "outlined" : "contained"}
              startIcon={isEditing ? <CancelIcon /> : <EditIcon />}
              onClick={toggleEditing}
              sx={{ mt: { xs: 2, sm: 0 } }}
            >
              {isEditing ? "Cancel" : "Edit Profile"}
            </Button>
          </Box>
        </Box>

        <Divider sx={{ mb: 4 }} />

        {/* Success/Error Messages */}
        {successMessage && (
          <Alert severity="success" sx={{ mb: 3 }}>
            {successMessage}
          </Alert>
        )}
        
        {errorMessage && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {errorMessage}
          </Alert>
        )}

        {/* Profile Form */}
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Username"
                name="username"
                value={formData.username}
                onChange={handleChange}
                disabled={!isEditing}
                required
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                disabled={!isEditing}
                required
              />
            </Grid>

            {isEditing && (
              <>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="New Password (leave blank to keep current)"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={handleChange}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={togglePasswordVisibility}
                            edge="end"
                          >
                            {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Confirm New Password"
                    name="confirmPassword"
                    type={showPassword ? "text" : "password"}
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    error={formData.password !== formData.confirmPassword && formData.confirmPassword !== ''}
                    helperText={
                      formData.password !== formData.confirmPassword && formData.confirmPassword !== '' 
                        ? "Passwords do not match" 
                        : ""
                    }
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={togglePasswordVisibility}
                            edge="end"
                          >
                            {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
              </>
            )}

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Avatar URL"
                name="avatar"
                value={formData.avatar}
                onChange={handleChange}
                disabled={!isEditing}
                error={avatarError}
                helperText={
                  avatarError 
                    ? "Invalid image URL. Try using a direct link ending with .jpg, .png, etc." 
                    : "Enter a URL for your profile picture or use the options below"
                }
                InputProps={{
                  endAdornment: isEditing ? (
                    <InputAdornment position="end">
                      <Button 
                        size="small" 
                        onClick={tryFallbackAvatar}
                        startIcon={<ImageIcon />}
                      >
                        Generate Avatar
                      </Button>
                    </InputAdornment>
                  ) : null,
                }}
              />
              
              {isEditing && (
                <Box sx={{ mt: 2, display: 'flex', gap: 2, alignItems: 'center' }}>
                  <Button
                    component="label"
                    variant="outlined"
                    size="small"
                    startIcon={<ImageIcon />}
                  >
                    Upload Image
                    <input
                      type="file"
                      accept="image/*"
                      hidden
                      onChange={handleAvatarUpload}
                    />
                  </Button>
                  <Typography variant="caption" color="text.secondary">
                    Supported formats: JPG, PNG, GIF (max 2MB). Image will be stored as Base64 in the database.
                  </Typography>
                </Box>
              )}
            </Grid>

            {isEditing && (
              <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  startIcon={<SaveIcon />}
                  disabled={isSubmitting}
                  sx={{ minWidth: 120 }}
                >
                  {isSubmitting ? <CircularProgress size={24} /> : "Save"}
                </Button>
              </Grid>
            )}
          </Grid>
        </form>
      </Paper>
    </Box>
  );
};

export default UserProfile; 