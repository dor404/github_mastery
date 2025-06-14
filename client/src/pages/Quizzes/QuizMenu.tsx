import React from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  Grid, 
  Card, 
  CardContent, 
  CardActions,
  Button,
  Divider,
  Paper
} from '@mui/material';
import { 
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  FilterAlt as FilterIcon,
  Assignment as AssignmentIcon,
  Quiz as QuizIcon,
  Assessment as AssessmentIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const QuizMenu: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isLecturerOrAdmin = user?.role === 'lecturer' || user?.role === 'admin';

  // Navigation handlers - these will be implemented in future stories
  const handleCreateQuiz = () => navigate('/quizzes/create');
  const handleEditQuizzes = () => navigate('/quizzes/edit');
  const handleDeleteQuizzes = () => navigate('/quizzes/delete');
  const handleViewAllResults = () => navigate('/quizzes/all-results');
  const handleSearchQuizzes = () => navigate('/quizzes/search');
  const handleViewAllQuizzes = () => navigate('/quizzes/all');

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box textAlign="center" mb={6}>
        <Box display="flex" justifyContent="center" alignItems="center" mb={2}>
          <QuizIcon sx={{ fontSize: 40, color: '#f05133', mr: 2 }} />
          <Typography variant="h3" component="h1" sx={{ color: '#f05133', fontWeight: 700 }}>
            Quiz Management
          </Typography>
        </Box>
        <Typography variant="h6" color="text.secondary" sx={{ maxWidth: '800px', mx: 'auto', mb: 3 }}>
          Create, manage, and assign quizzes to assess student understanding
        </Typography>
      </Box>

      {/* Main Content */}
      <Paper 
        elevation={3} 
        sx={{ 
          backgroundColor: '#161b22', 
          borderRadius: '8px', 
          overflow: 'hidden',
          border: '1px solid rgba(240, 81, 51, 0.3)',
          mb: 4
        }}
      >
        <Box sx={{ backgroundColor: '#f05133', py: 2, px: 3 }}>
          <Typography variant="h5" sx={{ color: 'white', fontWeight: 600 }}>
            Quiz Operations
          </Typography>
        </Box>
        
        <Grid container spacing={4} sx={{ p: 4 }}>
          {/* Instructor Controls */}
          {isLecturerOrAdmin && (
            <>
              <Grid item xs={12}>
                <Typography variant="h6" sx={{ color: '#f05133', fontWeight: 600, my: 2 }}>
                  Instructor Controls
                </Typography>
              </Grid>

              {/* Create Quiz */}
              <Grid item xs={12} md={4}>
                <Card sx={{ 
                  height: '100%', 
                  display: 'flex',
                  flexDirection: 'column',
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  borderRadius: '8px',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                }}>
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <AddIcon sx={{ color: '#f05133', fontSize: 30, mr: 1 }} />
                      <Typography variant="h5" component="h2" sx={{ color: 'white', fontWeight: 600 }}>
                        Create Quiz
                      </Typography>
                    </Box>
                    <Typography variant="body1" color="rgba(255, 255, 255, 0.7)" paragraph>
                      Create a new quiz with multiple-choice questions to assess student understanding.
                    </Typography>
                  </CardContent>
                  <CardActions sx={{ p: 2 }}>
                    <Button 
                      variant="contained" 
                      fullWidth
                      sx={{
                        backgroundColor: '#f05133',
                        color: 'white',
                        textTransform: 'none',
                        fontWeight: 500,
                        py: 1,
                        '&:hover': { backgroundColor: '#d03b1f' },
                      }}
                      onClick={handleCreateQuiz}
                    >
                      Create New Quiz
                    </Button>
                  </CardActions>
                </Card>
              </Grid>

              {/* Edit Quizzes */}
              <Grid item xs={12} md={4}>
                <Card sx={{ 
                  height: '100%', 
                  display: 'flex',
                  flexDirection: 'column',
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  borderRadius: '8px',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                }}>
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <EditIcon sx={{ color: '#f05133', fontSize: 30, mr: 1 }} />
                      <Typography variant="h5" component="h2" sx={{ color: 'white', fontWeight: 600 }}>
                        Edit Quizzes
                      </Typography>
                    </Box>
                    <Typography variant="body1" color="rgba(255, 255, 255, 0.7)" paragraph>
                      Modify existing quizzes, update questions, or change quiz settings.
                    </Typography>
                  </CardContent>
                  <CardActions sx={{ p: 2 }}>
                    <Button 
                      variant="contained" 
                      fullWidth
                      sx={{
                        backgroundColor: '#f05133',
                        color: 'white',
                        textTransform: 'none',
                        fontWeight: 500,
                        py: 1,
                        '&:hover': { backgroundColor: '#d03b1f' },
                      }}
                      onClick={handleEditQuizzes}
                    >
                      Edit Quizzes
                    </Button>
                  </CardActions>
                </Card>
              </Grid>

              {/* Delete Quizzes */}
              <Grid item xs={12} md={4}>
                <Card sx={{ 
                  height: '100%', 
                  display: 'flex',
                  flexDirection: 'column',
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  borderRadius: '8px',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                }}>
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <DeleteIcon sx={{ color: '#f05133', fontSize: 30, mr: 1 }} />
                      <Typography variant="h5" component="h2" sx={{ color: 'white', fontWeight: 600 }}>
                        Delete Quizzes
                      </Typography>
                    </Box>
                    <Typography variant="body1" color="rgba(255, 255, 255, 0.7)" paragraph>
                      Remove quizzes that are no longer needed.
                    </Typography>
                  </CardContent>
                  <CardActions sx={{ p: 2 }}>
                    <Button 
                      variant="contained" 
                      fullWidth
                      sx={{
                        backgroundColor: '#f05133',
                        color: 'white',
                        textTransform: 'none',
                        fontWeight: 500,
                        py: 1,
                        '&:hover': { backgroundColor: '#d03b1f' },
                      }}
                      onClick={handleDeleteQuizzes}
                    >
                      Delete Quizzes
                    </Button>
                  </CardActions>
                </Card>
              </Grid>

              {/* View All Student Results */}
              <Grid item xs={12}>
                <Typography variant="h6" sx={{ color: '#f05133', fontWeight: 600, my: 2 }}>
                  Results & Analytics
                </Typography>
              </Grid>
              
              <Grid item xs={12} md={4}>
                <Card sx={{ 
                  height: '100%', 
                  display: 'flex',
                  flexDirection: 'column',
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  borderRadius: '8px',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                }}>
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <AssessmentIcon sx={{ color: '#f05133', fontSize: 30, mr: 1 }} />
                      <Typography variant="h5" component="h2" sx={{ color: 'white', fontWeight: 600 }}>
                        Student Results
                      </Typography>
                    </Box>
                    <Typography variant="body1" color="rgba(255, 255, 255, 0.7)" paragraph>
                      View results for all students across all quizzes with detailed analytics.
                    </Typography>
                  </CardContent>
                  <CardActions sx={{ p: 2 }}>
                    <Button 
                      variant="contained" 
                      fullWidth
                      sx={{
                        backgroundColor: '#f05133',
                        color: 'white',
                        textTransform: 'none',
                        fontWeight: 500,
                        py: 1,
                        '&:hover': { backgroundColor: '#d03b1f' },
                      }}
                      onClick={handleViewAllResults}
                    >
                      View Student Results
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            </>
          )}
        </Grid>
      </Paper>
    </Container>
  );
};

export default QuizMenu; 