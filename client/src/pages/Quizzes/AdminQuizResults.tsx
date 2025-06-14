import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Button,
  CircularProgress,
  Divider,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  InputAdornment,
  IconButton,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  EmojiEvents as EmojiEventsIcon,
  Timeline as TimelineIcon,
  Search as SearchIcon,
  Clear as ClearIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import quizService from '../../services/quizService';
import { Quiz, QuizResult } from '../../types/quiz';

interface ExtendedQuizResult extends Omit<QuizResult, 'userId'> {
  username?: string;
  quizTitle?: string;
  _id?: string;
  userId: string | {
    _id: string;
    username: string;
    email: string;
  };
}

const AdminQuizResults: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // States
  const [results, setResults] = useState<ExtendedQuizResult[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedQuiz, setSelectedQuiz] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  
  // Load all quiz results and quizzes
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch all quizzes
        const quizzesData = await quizService.getQuizzes();
        setQuizzes(quizzesData);
        
        // Fetch all quiz results
        const allResults = await quizService.getAllQuizResults();
        
        // Enhance quiz results with quiz title and student info
        const enhancedResults = allResults.map(result => {
          const resultQuiz = quizzesData.find(q => q.id === result.quizId);
          return {
            ...result,
            quizTitle: resultQuiz?.title || 'Unknown Quiz',
          };
        });
        
        setResults(enhancedResults);
      } catch (err: any) {
        console.error('Error loading quiz results:', err);
        setError(err.message || 'Failed to load quiz results');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  // Get performance message based on score
  const getPerformanceMessage = (score: number): { message: string; color: string } => {
    if (score >= 90) {
      return { message: 'Excellent', color: '#4caf50' };
    } else if (score >= 80) {
      return { message: 'Very Good', color: '#8bc34a' };
    } else if (score >= 70) {
      return { message: 'Good', color: '#cddc39' };
    } else if (score >= 60) {
      return { message: 'Satisfactory', color: '#ffeb3b' };
    } else if (score >= 50) {
      return { message: 'Needs Improvement', color: '#ff9800' };
    } else {
      return { message: 'Study More', color: '#f44336' };
    }
  };
  
  // Format date
  const formatDate = (dateString: Date): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  // Handle quiz filter change
  const handleQuizFilterChange = (event: any) => {
    setSelectedQuiz(event.target.value);
  };

  // Handle search term change
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  // Clear search
  const clearSearch = () => {
    setSearchTerm('');
  };

  // Filter results based on selected quiz and search term
  const filteredResults = results.filter(result => {
    const matchesQuiz = selectedQuiz === 'all' || result.quizId === selectedQuiz;
    const matchesSearch = searchTerm === '' || 
      (result.username && result.username.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (result.quizTitle && result.quizTitle.toLowerCase().includes(searchTerm.toLowerCase()));
    
    return matchesQuiz && matchesSearch;
  });

  // Calculate statistics
  const calculateStats = () => {
    if (filteredResults.length === 0) return { avg: 0, highest: 0, lowest: 0, passRate: 0 };
    
    const scores = filteredResults.map(r => r.score);
    const avg = Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);
    const highest = Math.max(...scores);
    const lowest = Math.min(...scores);
    const passCount = scores.filter(score => score >= 60).length;
    const passRate = Math.round((passCount / scores.length) * 100);
    
    return { avg, highest, lowest, passRate };
  };

  const stats = calculateStats();
  
  // Handle clicking on a student name to view their specific results
  const handleStudentClick = (result: ExtendedQuizResult, studentName: string) => {
    console.log('Clicked on student:', studentName, 'Result object:', result);
    
    // Extract the actual user ID - handle both populated and non-populated cases
    let studentId: string | undefined;
    
    if (result.userId) {
      // If userId is populated (object), extract the _id field
      if (typeof result.userId === 'object' && result.userId._id) {
        studentId = result.userId._id;
        console.log('Extracted student ID from populated userId:', studentId);
      } 
      // If userId is just a string ID
      else if (typeof result.userId === 'string') {
        studentId = result.userId;
        console.log('Using userId as string:', studentId);
      }
    }
    
    // Fallback to _id if userId is not available
    if (!studentId && result._id) {
      studentId = result._id;
      console.log('Using fallback _id:', studentId);
    }
    
    if (studentId) {
      console.log('Navigating to student results with ID:', studentId);
      // Navigate to student-specific results view
      navigate(`/quizzes/student-results/${studentId}/${encodeURIComponent(studentName)}`);
    } else {
      console.error('Unable to determine student ID from result:', result);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4, textAlign: 'center' }}>
        <CircularProgress size={60} />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Loading all quiz results...
        </Typography>
      </Container>
    );
  }
  
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box display="flex" alignItems="center" mb={4}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/quizzes/manage')}
          sx={{ mr: 2 }}
        >
          Back to Quiz Management
        </Button>
        <Typography variant="h4" component="h1" sx={{ color: '#f05133', fontWeight: 700 }}>
          Student Quiz Results
        </Typography>
      </Box>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {/* Statistics Card */}
      <Paper 
        elevation={3}
        sx={{
          mb: 4,
          backgroundColor: '#161b22',
          borderRadius: '8px',
          border: '1px solid rgba(240, 81, 51, 0.3)',
        }}
      >
        <Box p={3}>
          <Box display="flex" alignItems="center" mb={2}>
            <EmojiEventsIcon sx={{ color: '#f05133', fontSize: 32, mr: 2 }} />
            <Typography variant="h5" sx={{ color: 'white' }}>
              Summary Statistics
            </Typography>
          </Box>
          
          <Divider sx={{ backgroundColor: 'rgba(255, 255, 255, 0.1)', mb: 3 }} />
          
          <Box display="flex" justifyContent="space-around" flexWrap="wrap">
            <Box textAlign="center" mb={2} mx={2}>
              <Typography variant="h6" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                Average Score
              </Typography>
              <Typography variant="h3" sx={{ color: 'white', fontWeight: 'bold' }}>
                {stats.avg}%
              </Typography>
            </Box>
            
            <Box textAlign="center" mb={2} mx={2}>
              <Typography variant="h6" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                Highest Score
              </Typography>
              <Typography variant="h3" sx={{ color: 'white', fontWeight: 'bold' }}>
                {stats.highest}%
              </Typography>
            </Box>
            
            <Box textAlign="center" mb={2} mx={2}>
              <Typography variant="h6" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                Lowest Score
              </Typography>
              <Typography variant="h3" sx={{ color: 'white', fontWeight: 'bold' }}>
                {stats.lowest}%
              </Typography>
            </Box>
            
            <Box textAlign="center" mb={2} mx={2}>
              <Typography variant="h6" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                Pass Rate
              </Typography>
              <Typography variant="h3" sx={{ color: 'white', fontWeight: 'bold' }}>
                {stats.passRate}%
              </Typography>
            </Box>
          </Box>
        </Box>
      </Paper>
      
      {/* Filters */}
      <Paper 
        elevation={3}
        sx={{
          mb: 4,
          backgroundColor: '#161b22',
          borderRadius: '8px',
          border: '1px solid rgba(240, 81, 51, 0.3)',
          p: 3,
        }}
      >
        <Typography variant="h6" sx={{ color: 'white', mb: 2 }}>
          Filter Results
        </Typography>
        
        <Box display="flex" flexWrap="wrap" gap={2}>
          <FormControl 
            sx={{ 
              minWidth: 200,
              '& .MuiInputLabel-root': { color: 'rgba(255, 255, 255, 0.7)' },
              '& .MuiOutlinedInput-root': {
                color: 'white',
                '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.23)' },
                '&:hover fieldset': { borderColor: 'rgba(255, 255, 255, 0.5)' },
                '&.Mui-focused fieldset': { borderColor: '#f05133' }
              }
            }}
          >
            <InputLabel id="quiz-filter-label">Filter by Quiz</InputLabel>
            <Select
              labelId="quiz-filter-label"
              value={selectedQuiz}
              label="Filter by Quiz"
              onChange={handleQuizFilterChange}
            >
              <MenuItem value="all">All Quizzes</MenuItem>
              {quizzes.map(quiz => (
                <MenuItem key={quiz.id} value={quiz.id || ''}>
                  {quiz.title}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <TextField
            placeholder="Search by student or quiz name"
            value={searchTerm}
            onChange={handleSearchChange}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: 'rgba(255, 255, 255, 0.7)' }} />
                </InputAdornment>
              ),
              endAdornment: searchTerm ? (
                <InputAdornment position="end">
                  <IconButton onClick={clearSearch} size="small" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                    <ClearIcon />
                  </IconButton>
                </InputAdornment>
              ) : null
            }}
            sx={{ 
              flexGrow: 1,
              '& .MuiInputBase-root': {
                color: 'white',
                '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.23)' },
                '&:hover fieldset': { borderColor: 'rgba(255, 255, 255, 0.5)' },
                '&.Mui-focused fieldset': { borderColor: '#f05133' }
              }
            }}
          />
        </Box>
      </Paper>
      
      {/* Results Table */}
      <Paper
        elevation={3}
        sx={{
          backgroundColor: '#161b22',
          borderRadius: '8px',
          border: '1px solid rgba(240, 81, 51, 0.3)',
          overflow: 'hidden',
        }}
      >
        <Box p={3}>
          <Box display="flex" alignItems="center" mb={2}>
            <TimelineIcon sx={{ color: '#f05133', fontSize: 32, mr: 2 }} />
            <Typography variant="h5" sx={{ color: 'white' }}>
              All Student Results
            </Typography>
          </Box>
          
          <Divider sx={{ backgroundColor: 'rgba(255, 255, 255, 0.1)', mb: 3 }} />
          
          {filteredResults.length === 0 ? (
            <Box textAlign="center" py={4}>
              <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                No results found matching your criteria.
              </Typography>
            </Box>
          ) : (
            <TableContainer>
              <Table sx={{ minWidth: 650 }}>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ color: 'rgba(255, 255, 255, 0.7)', fontWeight: 'bold' }}>
                      Student
                    </TableCell>
                    <TableCell sx={{ color: 'rgba(255, 255, 255, 0.7)', fontWeight: 'bold' }}>
                      Quiz
                    </TableCell>
                    <TableCell sx={{ color: 'rgba(255, 255, 255, 0.7)', fontWeight: 'bold' }}>
                      Score
                    </TableCell>
                    <TableCell sx={{ color: 'rgba(255, 255, 255, 0.7)', fontWeight: 'bold' }}>
                      Performance
                    </TableCell>
                    <TableCell sx={{ color: 'rgba(255, 255, 255, 0.7)', fontWeight: 'bold' }}>
                      Date
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredResults.map((result) => {
                    const performance = getPerformanceMessage(result.score);
                    return (
                      <TableRow 
                        key={result._id || result.id}
                        sx={{ 
                          '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.05)' },
                          '& td': { color: 'white', borderColor: 'rgba(255, 255, 255, 0.1)' }
                        }}
                      >
                        <TableCell>
                          <Typography
                            variant="body1"
                            sx={{ 
                              fontWeight: 'bold',
                              color: '#f05133',
                              cursor: 'pointer',
                              '&:hover': {
                                color: '#d03b1f',
                                textDecoration: 'underline'
                              }
                            }}
                            onClick={() => handleStudentClick(result, result.username || 'Anonymous Student')}
                          >
                            {result.username || 'Anonymous Student'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          {result.quizTitle}
                        </TableCell>
                        <TableCell>
                          <Typography
                            variant="body1"
                            sx={{ 
                              fontWeight: 'bold',
                              color: result.score >= 60 ? '#4caf50' : '#f44336'
                            }}
                          >
                            {result.score}%
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={performance.message} 
                            sx={{ 
                              backgroundColor: `${performance.color}20`,
                              color: performance.color,
                              fontWeight: 'bold'
                            }} 
                          />
                        </TableCell>
                        <TableCell>
                          {result.submittedAt ? formatDate(result.submittedAt) : 'Unknown'}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Box>
      </Paper>
    </Container>
  );
};

export default AdminQuizResults; 