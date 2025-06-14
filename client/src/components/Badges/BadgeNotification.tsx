import React from 'react';
import {
  Dialog,
  DialogContent,
  Box,
  Typography,
  Avatar,
  Button,
  Card,
  CardContent,
  Chip,
  IconButton
} from '@mui/material';
import {
  Close as CloseIcon,
  EmojiEvents as TrophyIcon
} from '@mui/icons-material';

interface Badge {
  _id: string;
  name: string;
  description: string;
  type: 'exercise' | 'tutorial' | 'quiz' | 'completion' | 'milestone';
  level: 'bronze' | 'silver' | 'gold' | 'platinum';
  icon: string;
  points: number;
  earnedAt?: Date;
}

interface BadgeNotificationProps {
  open: boolean;
  badges: Badge[];
  onClose: () => void;
  onViewAchievements: () => void;
}

const BadgeNotification: React.FC<BadgeNotificationProps> = ({
  open,
  badges,
  onClose,
  onViewAchievements
}) => {
  if (badges.length === 0) return null;

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'bronze': return '#CD7F32';
      case 'silver': return '#C0C0C0';
      case 'gold': return '#FFD700';
      case 'platinum': return '#E5E4E2';
      default: return '#9E9E9E';
    }
  };

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'bronze': return '🥉';
      case 'silver': return '🥈';
      case 'gold': return '🥇';
      case 'platinum': return '💎';
      default: return '🏅';
    }
  };

  const totalPoints = badges.reduce((sum, badge) => sum + badge.points, 0);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white'
        }
      }}
    >
      <DialogContent sx={{ p: 0, position: 'relative' }}>
        <IconButton
          onClick={onClose}
          sx={{
            position: 'absolute',
            right: 8,
            top: 8,
            color: 'white',
            zIndex: 1
          }}
        >
          <CloseIcon />
        </IconButton>

        <Box sx={{ p: 4, textAlign: 'center' }}>
          {/* Header */}
          <Avatar
            sx={{
              width: 80,
              height: 80,
              mx: 'auto',
              mb: 2,
              bgcolor: 'rgba(255,255,255,0.2)',
              fontSize: '2.5rem'
            }}
          >
            🎉
          </Avatar>

          <Typography variant="h4" gutterBottom fontWeight="bold">
            Congratulations!
          </Typography>

          <Typography variant="h6" sx={{ mb: 3, opacity: 0.9 }}>
            You've earned {badges.length} new badge{badges.length > 1 ? 's' : ''}!
          </Typography>

          {/* Badges */}
          <Box sx={{ mb: 3 }}>
            {badges.map((badge, index) => (
              <Card
                key={badge._id}
                sx={{
                  mb: 2,
                  bgcolor: 'rgba(255,255,255,0.1)',
                  backdropFilter: 'blur(10px)',
                  border: `2px solid ${getLevelColor(badge.level)}`,
                  borderRadius: 2
                }}
              >
                <CardContent sx={{ py: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar
                      sx={{
                        bgcolor: getLevelColor(badge.level),
                        width: 56,
                        height: 56,
                        fontSize: '1.5rem'
                      }}
                    >
                      {badge.icon}
                    </Avatar>
                    
                    <Box sx={{ flex: 1, textAlign: 'left' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                        <Typography variant="h6" fontWeight="bold" color="white">
                          {badge.name}
                        </Typography>
                        <Typography variant="caption" sx={{ fontSize: '0.7rem', opacity: 0.8 }}>
                          {getLevelIcon(badge.level)} {badge.level.toUpperCase()}
                        </Typography>
                      </Box>
                      
                      <Typography variant="body2" sx={{ opacity: 0.8, mb: 1 }}>
                        {badge.description}
                      </Typography>
                      
                      <Chip
                        label={`+${badge.points} points`}
                        size="small"
                        sx={{
                          bgcolor: 'rgba(255,255,255,0.2)',
                          color: 'white',
                          fontWeight: 'bold'
                        }}
                      />
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            ))}
          </Box>

          {/* Points Summary */}
          <Box sx={{ mb: 3, p: 2, bgcolor: 'rgba(255,255,255,0.1)', borderRadius: 2 }}>
            <Typography variant="h5" fontWeight="bold">
              +{totalPoints} Total Points
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.8 }}>
              Added to your achievement score
            </Typography>
          </Box>

          {/* Action Buttons */}
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
            <Button
              variant="contained"
              onClick={onViewAchievements}
              sx={{
                bgcolor: 'rgba(255,255,255,0.2)',
                color: 'white',
                '&:hover': {
                  bgcolor: 'rgba(255,255,255,0.3)'
                }
              }}
              startIcon={<TrophyIcon />}
            >
              View All Achievements
            </Button>
            
            <Button
              variant="outlined"
              onClick={onClose}
              sx={{
                borderColor: 'rgba(255,255,255,0.5)',
                color: 'white',
                '&:hover': {
                  borderColor: 'white',
                  bgcolor: 'rgba(255,255,255,0.1)'
                }
              }}
            >
              Continue Learning
            </Button>
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default BadgeNotification; 