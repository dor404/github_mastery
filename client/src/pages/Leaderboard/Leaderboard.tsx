import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Avatar,
  CircularProgress,
  Alert,
  FormControl,
  Select,
  MenuItem,
  Container,
  TextField,
  InputAdornment,
  useTheme,
  Chip,
  Stack,
} from '@mui/material';
import {
  EmojiEvents as TrophyIcon,
  Search as SearchIcon,
  Diamond as DiamondIcon,
  Star as StarIcon,
  School as SchoolIcon,
  Code as CodeIcon,
  Quiz as QuizIcon,
  AllInclusive,
  WorkspacePremium,
} from '@mui/icons-material';
import { LeaderboardEntry, ModuleType, BadgeType } from '../../types/leaderboard';
import LeaderboardService from '../../services/leaderboardService';

import { useAuth } from '../../context/AuthContext';

const Leaderboard: React.FC = () => {
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedModuleType, setSelectedModuleType] = useState<ModuleType>('all');
  const [selectedBadgeType, setSelectedBadgeType] = useState<BadgeType | undefined>(undefined);

  const theme = useTheme();
  const { user } = useAuth();

  const moduleTypeFilters: { type: ModuleType; label: string; icon: React.ReactElement }[] = [
    { type: 'all', label: 'All Activities', icon: <AllInclusive /> },
    { type: 'modules', label: 'Learning Modules', icon: <SchoolIcon /> },
    { type: 'exercises', label: 'Exercises', icon: <CodeIcon /> },
    { type: 'quizzes', label: 'Quizzes', icon: <QuizIcon /> },
  ];

  const badgeTypeFilters: { type: BadgeType; label: string }[] = [
    { type: 'beginner', label: 'Beginner' },
    { type: 'intermediate', label: 'Intermediate' },
    { type: 'advanced', label: 'Advanced' },
    { type: 'expert', label: 'Expert' },
    { type: 'master', label: 'Master' },
  ];

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await LeaderboardService.getLeaderboard(selectedModuleType, selectedBadgeType);
      setLeaderboardData(data);
    } catch (err: any) {
      console.error('Leaderboard fetch error:', err);
      setError(err.message || 'Failed to load leaderboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, [selectedModuleType, selectedBadgeType]);

  // Filter entries
  const filteredEntries = leaderboardData
    .filter(entry => 
      entry.username.toLowerCase().includes(searchTerm.toLowerCase())
    );

  const getModuleTypeIcon = (type: ModuleType) => {
    switch (type) {
      case 'modules':
        return <SchoolIcon />;
      case 'exercises':
        return <CodeIcon />;
      case 'quizzes':
        return <QuizIcon />;
      default:
        return <TrophyIcon />;
    }
  };

  const getModuleTypeLabel = (type: ModuleType) => {
    switch (type) {
      case 'modules':
        return 'Learning Modules';
      case 'exercises':
        return 'Exercises';
      case 'quizzes':
        return 'Quizzes';
      default:
        return 'All Activities';
    }
  };

  const getBadgeIcon = (position: number, points: number) => {
    if (position === 1) {
      return <TrophyIcon sx={{ color: '#FFD700', fontSize: '1.5rem' }} />; // Gold
    } else if (position === 2) {
      return <TrophyIcon sx={{ color: '#C0C0C0', fontSize: '1.3rem' }} />; // Silver
    } else if (position === 3) {
      return <TrophyIcon sx={{ color: '#CD7F32', fontSize: '1.1rem' }} />; // Bronze
    } else if (points >= 1000) {
      return <DiamondIcon sx={{ color: '#58a6ff', fontSize: '1rem' }} />; // GitHub blue for high achievers
    } else if (points >= 500) {
      return <StarIcon sx={{ color: '#f9c513', fontSize: '1rem' }} />; // GitHub yellow for achievers
    }
    return null;
  };

  const handleModuleTypeChange = (type: ModuleType) => {
    setSelectedModuleType(type);
  };

  const handleBadgeTypeChange = (type: BadgeType | undefined) => {
    setSelectedBadgeType(type === selectedBadgeType ? undefined : type);
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress size={60} sx={{ color: theme.palette.primary.main }} />
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert 
          severity="error" 
          sx={{ 
            backgroundColor: 'rgba(248, 81, 73, 0.1)',
            color: theme.palette.text.primary,
            border: '1px solid rgba(248, 81, 73, 0.3)',
          }}
        >
          {error}
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* Header */}
        <Typography
          variant="h3"
          component="h1"
          sx={{
            color: theme.palette.text.primary,
            fontWeight: 'bold',
            mb: 4,
            textAlign: 'center',
            fontFamily: theme.typography.fontFamily,
          }}
        >
          🏆 Student Leaderboard
        </Typography>

        {/* Filters and Search */}
        <Box 
          sx={{ 
            display: 'flex', 
            flexDirection: 'column',
            gap: 2, 
            mb: 3,
          }}
        >
          {/* Module Type Filter */}
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {moduleTypeFilters.map(({ type, label, icon }) => (
              <Chip
                key={type}
                icon={icon}
                label={label}
                onClick={() => handleModuleTypeChange(type)}
                color={selectedModuleType === type ? 'primary' : 'default'}
                variant={selectedModuleType === type ? 'filled' : 'outlined'}
                sx={{
                  borderRadius: '16px',
                  '&:hover': {
                    backgroundColor: selectedModuleType === type 
                      ? theme.palette.primary.dark 
                      : 'rgba(255, 255, 255, 0.08)',
                  },
                }}
              />
            ))}
          </Box>

          {/* Badge Type Filter */}
          <Stack direction="row" spacing={1}>
            {badgeTypeFilters.map(({ type, label }) => (
              <Chip
                key={type}
                label={label}
                icon={<WorkspacePremium />}
                onClick={() => handleBadgeTypeChange(type)}
                color={selectedBadgeType === type ? 'primary' : 'default'}
              />
            ))}
          </Stack>

          {/* Search */}
          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <TextField
              placeholder="Search students..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: theme.palette.text.secondary }} />
                  </InputAdornment>
                ),
                sx: {
                  backgroundColor: '#0d1117',
                  color: theme.palette.text.primary,
                  fontFamily: theme.typography.fontFamily,
                  '& fieldset': {
                    borderColor: '#30363d',
                  },
                  '&:hover fieldset': {
                    borderColor: '#6e7681',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: theme.palette.primary.main,
                  },
                },
              }}
              sx={{
                minWidth: 200,
                '& .MuiInputLabel-root': {
                  color: theme.palette.text.secondary,
                },
                '& .MuiOutlinedInput-root': {
                  backgroundColor: '#0d1117',
                  borderRadius: '6px',
                  '& fieldset': {
                    borderColor: '#30363d',
                  },
                  '&:hover fieldset': {
                    borderColor: '#6e7681',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: theme.palette.primary.main,
                  },
                },
              }}
            />
          </Box>
        </Box>

        {/* Leaderboard Table */}
        <TableContainer 
          component={Paper} 
          sx={{ 
            backgroundColor: '#161b22',
            border: '1px solid #30363d',
            borderRadius: 2,
            boxShadow: '0 1px 3px rgba(0,0,0,0.5)',
          }}
        >
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: 'rgba(240, 81, 51, 0.1)' }}>
                <TableCell sx={{ 
                  borderColor: '#30363d', 
                  color: theme.palette.text.primary, 
                  fontWeight: 'bold',
                  fontFamily: theme.typography.fontFamily,
                }}>
                  #
                </TableCell>
                <TableCell sx={{ 
                  borderColor: '#30363d', 
                  color: theme.palette.text.primary, 
                  fontWeight: 'bold',
                  fontFamily: theme.typography.fontFamily,
                }}>
                  Name
                </TableCell>
                <TableCell align="center" sx={{ 
                  borderColor: '#30363d', 
                  color: theme.palette.text.primary, 
                  fontWeight: 'bold',
                  fontFamily: theme.typography.fontFamily,
                }}>
                  {selectedModuleType === 'all' ? 'Total Score' : getModuleTypeLabel(selectedModuleType)}
                </TableCell>
                <TableCell align="center" sx={{ 
                  borderColor: '#30363d', 
                  color: theme.palette.text.primary, 
                  fontWeight: 'bold',
                  fontFamily: theme.typography.fontFamily,
                }}>
                  Modules
                </TableCell>
                <TableCell align="center" sx={{ 
                  borderColor: '#30363d', 
                  color: theme.palette.text.primary, 
                  fontWeight: 'bold',
                  fontFamily: theme.typography.fontFamily,
                }}>
                  Exercises
                </TableCell>
                <TableCell align="center" sx={{ 
                  borderColor: '#30363d', 
                  color: theme.palette.text.primary, 
                  fontWeight: 'bold',
                  fontFamily: theme.typography.fontFamily,
                }}>
                  Quizzes
                </TableCell>
                {selectedBadgeType && (
                  <TableCell align="center" sx={{ 
                    borderColor: '#30363d', 
                    color: theme.palette.text.primary, 
                    fontWeight: 'bold',
                    fontFamily: theme.typography.fontFamily,
                  }}>
                    Badge Earned
                  </TableCell>
                )}
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredEntries.map((entry, index) => (
                <TableRow
                  key={entry.userId}
                  sx={{
                    backgroundColor: entry.isCurrentUser 
                      ? 'rgba(240, 81, 51, 0.1)' 
                      : 'transparent',
                    '&:hover': {
                      backgroundColor: entry.isCurrentUser 
                        ? 'rgba(240, 81, 51, 0.15)' 
                        : 'rgba(255, 255, 255, 0.05)',
                    },
                    '&:nth-of-type(even)': {
                      backgroundColor: entry.isCurrentUser 
                        ? 'rgba(240, 81, 51, 0.1)' 
                        : 'rgba(255, 255, 255, 0.02)',
                    },
                    transition: 'background-color 0.2s ease',
                  }}
                >
                  <TableCell sx={{ borderColor: '#30363d' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {getBadgeIcon(index + 1, entry.totalPoints)}
                      <Typography 
                        sx={{ 
                          color: theme.palette.text.primary, 
                          fontWeight: 'bold',
                          fontFamily: theme.typography.fontFamily,
                        }}
                      >
                        {index + 1}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell sx={{ borderColor: '#30363d' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Avatar
                        sx={{
                          bgcolor: theme.palette.primary.main,
                          width: 32,
                          height: 32,
                          fontSize: '0.875rem',
                          fontFamily: theme.typography.fontFamily,
                        }}
                      >
                        {entry.username.charAt(0).toUpperCase()}
                      </Avatar>
                      <Typography 
                        sx={{ 
                          color: theme.palette.text.primary, 
                          fontWeight: 500,
                          ml: 1,
                          fontFamily: theme.typography.fontFamily,
                        }}
                      >
                        {entry.username}
                        {entry.isCurrentUser && (
                          <Typography 
                            component="span" 
                            sx={{ 
                              color: theme.palette.primary.main, 
                              ml: 1,
                              fontSize: '0.75rem',
                              fontWeight: 'bold',
                              fontFamily: theme.typography.fontFamily,
                            }}
                          >
                            (You)
                          </Typography>
                        )}
                        <Typography
                          component="span"
                          sx={{
                            ml: 1,
                            fontSize: '0.75rem',
                            color: theme.palette.text.secondary,
                            fontFamily: theme.typography.fontFamily,
                          }}
                        >
                          ({entry.role})
                        </Typography>
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell align="center" sx={{ borderColor: '#30363d' }}>
                    <Typography 
                      variant="h6" 
                      sx={{ 
                        fontWeight: 'bold', 
                        color: theme.palette.text.primary,
                        fontSize: '1.1rem',
                        fontFamily: theme.typography.fontFamily,
                      }}
                    >
                      {selectedModuleType === 'modules' && entry.learningModules}
                      {selectedModuleType === 'exercises' && entry.exercises}
                      {selectedModuleType === 'quizzes' && entry.quizzes}
                      {selectedModuleType === 'all' && Math.round(entry.totalPoints).toLocaleString()}
                    </Typography>
                  </TableCell>
                  <TableCell align="center" sx={{ borderColor: '#30363d' }}>
                    <Typography sx={{ 
                      color: theme.palette.text.primary,
                      fontFamily: theme.typography.fontFamily,
                    }}>
                      {entry.learningModules}
                    </Typography>
                  </TableCell>
                  <TableCell align="center" sx={{ borderColor: '#30363d' }}>
                    <Typography sx={{ 
                      color: theme.palette.text.primary,
                      fontFamily: theme.typography.fontFamily,
                    }}>
                      {entry.exercises}
                    </Typography>
                  </TableCell>
                  <TableCell align="center" sx={{ borderColor: '#30363d' }}>
                    <Typography sx={{ 
                      color: theme.palette.text.primary,
                      fontFamily: theme.typography.fontFamily,
                    }}>
                      {entry.quizzes}
                    </Typography>
                  </TableCell>
                  {selectedBadgeType && (
                    <TableCell align="center" sx={{ borderColor: '#30363d' }}>
                      {entry.badges.some(badge => badge.type === selectedBadgeType) ? (
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                          <WorkspacePremium sx={{ color: theme.palette.primary.main }} />
                          <Typography sx={{ 
                            color: theme.palette.primary.main,
                            fontWeight: 'bold',
                            fontFamily: theme.typography.fontFamily,
                          }}>
                            {entry.badges.find(badge => badge.type === selectedBadgeType)?.name}
                          </Typography>
                        </Box>
                      ) : (
                        <Typography sx={{ 
                          color: theme.palette.text.secondary,
                          fontFamily: theme.typography.fontFamily,
                        }}>
                          Not earned
                        </Typography>
                      )}
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Summary Section */}
        <Box sx={{ mt: 2, mb: 2, textAlign: 'center' }}>
          <Typography 
            variant="body2" 
            sx={{ 
              color: theme.palette.text.secondary,
              fontFamily: theme.typography.fontFamily,
            }}
          >
            Showing {filteredEntries.length} students
            {filteredEntries.length > 0 && ` • ${getModuleTypeLabel(selectedModuleType)} Rankings 🚀`}
          </Typography>
          {filteredEntries.length > 0 && (
            <Typography 
              variant="body2" 
              sx={{ 
                color: theme.palette.text.secondary,
                fontFamily: theme.typography.fontFamily,
                mt: 0.5,
                fontSize: '0.75rem'
              }}
            >
              💡 Complete {selectedModuleType === 'all' ? 'activities' : getModuleTypeLabel(selectedModuleType).toLowerCase()} to earn points and climb the leaderboard!
            </Typography>
          )}
        </Box>
      </Container>
  );
};

export default Leaderboard; 