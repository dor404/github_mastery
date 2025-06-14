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
  TextField,
  InputAdornment,
  IconButton,
  Tooltip,
  CircularProgress,
  Alert,
  Grid,
  Card,
  CardContent,
  TableSortLabel,
  Button,
} from '@mui/material';
import {
  Search as SearchIcon,
  Refresh as RefreshIcon,
  TrendingUp as TrendingUpIcon,
  Group as GroupIcon,
  Quiz as QuizIcon,
  Assignment as AssignmentIcon,
} from '@mui/icons-material';

interface ClassMonitoringData {
  students: Array<{
    _id: string;
    username: string;
    email: string;
    joinedAt: string;
    completionRate: number;
    exerciseProgress: string;
    tutorialProgress: string;
    quizProgress: string;
    quizAverage: number | null;
    quizCount: number;
    needsHelp: boolean;
  }>;
  summary: {
    totalStudents: number;
    averageCompletion: number;
    averageQuizScore: number | null;
    studentsNeedingHelp: number;
    totalExercises: number;
    totalTutorials: number;
  };
}

type SortField = 'username' | 'completionRate' | 'quizAverage' | 'joinedAt';
type SortOrder = 'asc' | 'desc';

const ClassMonitoring: React.FC = () => {
  const [data, setData] = useState<ClassMonitoringData>({ 
    students: [], 
    summary: { totalStudents: 0, averageCompletion: 0, averageQuizScore: 0, studentsNeedingHelp: 0, totalExercises: 0, totalTutorials: 0 } 
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('username');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('token');
      
      console.log('🔍 Fetching class monitoring data...');
      console.log('Token available:', !!token);
      
      const response = await fetch('http://localhost:5001/api/admin/class-monitoring', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('API Error:', errorData);
        throw new Error(errorData.error || 'Failed to fetch data');
      }

      const result = await response.json();
      console.log('📊 Class monitoring data received:', result);
      console.log('Number of students:', result.students?.length || 0);
      console.log('Summary:', result.summary);
      
      // Debug individual student data
      if (result.students && result.students.length > 0) {
        console.log('👥 First few students:');
        result.students.slice(0, 3).forEach((student: any, index: number) => {
          console.log(`Student ${index + 1}:`, {
            username: student.username,
            exerciseProgress: student.exerciseProgress,
            tutorialProgress: student.tutorialProgress,
            quizProgress: student.quizProgress,
            completionRate: student.completionRate,
            quizAverage: student.quizAverage
          });
        });
      }
      
      setData(result);
      setLastRefresh(new Date());
    } catch (error) {
      console.error('❌ Error fetching class monitoring data:', error);
      setError(error instanceof Error ? error.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    fetchData();
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const filteredStudents = data.students.filter(student => 
    student.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortedStudents = [...filteredStudents].sort((a, b) => {
    const aValue = a[sortField];
    const bValue = b[sortField];
    
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortOrder === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
    }
    
    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
    }
    
    // Handle null values for quizAverage
    if (aValue === null && bValue === null) return 0;
    if (aValue === null) return sortOrder === 'asc' ? 1 : -1;
    if (bValue === null) return sortOrder === 'asc' ? -1 : 1;
    
    return 0;
  });

  const getPerformanceColor = (value: number, type: 'completion' | 'quiz') => {
    if (type === 'completion') {
      if (value >= 80) return 'success';
      if (value >= 60) return 'warning';
      return 'error';
    } else {
      if (value >= 85) return 'success';
      if (value >= 70) return 'warning';
      return 'error';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getActivityStatus = (lastActivity: string) => {
    const now = new Date();
    const activityDate = new Date(lastActivity);
    const diffInDays = Math.floor((now.getTime() - activityDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays <= 1) return { label: 'Active', color: 'success' as const };
    if (diffInDays <= 7) return { label: 'Recent', color: 'warning' as const };
    return { label: 'Inactive', color: 'error' as const };
  };

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button onClick={handleRefresh} variant="contained">
          Try Again
        </Button>
      </Container>
    );
  }

  console.log('🎨 Rendering ClassMonitoring component');
  console.log('Loading:', loading);
  console.log('Data:', data);
  console.log('Students to render:', data.students?.length || 0);

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4, display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Class Monitoring Dashboard
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="body2" color="textSecondary">
            Last updated: {lastRefresh.toLocaleTimeString()}
          </Typography>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={handleRefresh}
            disabled={loading}
          >
            Refresh
          </Button>
        </Box>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Students
              </Typography>
              <Typography variant="h4">
                {data?.summary?.totalStudents || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Average Completion
              </Typography>
              <Typography variant="h4">
                {data?.summary?.averageCompletion ? `${data.summary.averageCompletion}%` : '0%'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Average Quiz Score
              </Typography>
              <Typography variant="h4">
                {data?.summary?.averageQuizScore !== null && data?.summary?.averageQuizScore !== undefined 
                  ? `${data.summary.averageQuizScore}%` 
                  : 'No Quizzes'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Students Needing Help
              </Typography>
              <Typography variant="h4" color="error">
                {data?.summary?.studentsNeedingHelp || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Search and Controls */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <TextField
            label="Search students"
            variant="outlined"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ flexGrow: 1 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
          <Tooltip title="Refresh data">
            <IconButton onClick={handleRefresh} color="primary">
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Paper>

      {/* Students Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>
                <TableSortLabel
                  active={sortField === 'username'}
                  direction={sortField === 'username' ? sortOrder : 'asc'}
                  onClick={() => handleSort('username')}
                >
                  Student
                </TableSortLabel>
              </TableCell>
              <TableCell align="center">
                <TableSortLabel
                  active={sortField === 'completionRate'}
                  direction={sortField === 'completionRate' ? sortOrder : 'asc'}
                  onClick={() => handleSort('completionRate')}
                >
                  Completion Rate
                </TableSortLabel>
              </TableCell>
              <TableCell align="center">
                <TableSortLabel
                  active={sortField === 'quizAverage'}
                  direction={sortField === 'quizAverage' ? sortOrder : 'asc'}
                  onClick={() => handleSort('quizAverage')}
                >
                  Quiz Average
                </TableSortLabel>
              </TableCell>
              <TableCell align="center">Progress Details</TableCell>
              <TableCell align="center">
                <TableSortLabel
                  active={sortField === 'joinedAt'}
                  direction={sortField === 'joinedAt' ? sortOrder : 'asc'}
                  onClick={() => handleSort('joinedAt')}
                >
                  Joined At
                </TableSortLabel>
              </TableCell>
              <TableCell align="center">Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sortedStudents.map((student) => {
              const activityStatus = getActivityStatus(student.joinedAt);
              return (
                <TableRow key={student._id} hover>
                  <TableCell>
                    <Box>
                      <Typography variant="subtitle2" fontWeight="bold">
                        {student.username}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        {student.email}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={`${student.completionRate}%`}
                      color={getPerformanceColor(student.completionRate, 'completion')}
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={
                        student.quizCount > 0 
                          ? `${student.quizAverage?.toFixed(1) || '0.0'}%` 
                          : 'No Quizzes'
                      }
                      color={
                        student.quizCount > 0 
                          ? getPerformanceColor(student.quizAverage || 0, 'quiz') 
                          : 'default'
                      }
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    <Box>
                      <Typography variant="body2">
                        <strong>Exercises:</strong> {student.exerciseProgress}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Tutorials:</strong> {student.tutorialProgress}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Quizzes:</strong> {student.quizProgress}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={new Date(student.joinedAt).toLocaleDateString()}
                      color="default"
                      variant="outlined"
                    />
                    {student.needsHelp && (
                      <Chip
                        label="Needs Help"
                        color="error"
                        size="small"
                        sx={{ ml: 1 }}
                      />
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      {sortedStudents.length === 0 && !loading && (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="h6" color="text.secondary">
            No students found
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {searchTerm ? 'Try adjusting your search terms' : 'No students are registered yet'}
          </Typography>
        </Box>
      )}
    </Container>
  );
};

export default ClassMonitoring; 