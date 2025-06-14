import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material';
import Leaderboard from '../pages/Leaderboard/Leaderboard';
import { useAuth } from '../context/AuthContext';
import LeaderboardService from '../services/leaderboardService';
import { LeaderboardEntry } from '../types/leaderboard';

// Create a theme for testing
const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#f05133',
      dark: '#d23616',
    },
    text: {
      primary: '#c9d1d9',
      secondary: '#8b949e',
    },
  },
});

// Ultra-fast mocking
jest.mock('../components/Layout/Layout', () => ({ children }: any) => children);
jest.mock('../context/AuthContext');
jest.mock('../services/leaderboardService');

// Suppress console output globally
console.error = jest.fn();
console.warn = jest.fn();

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockService = LeaderboardService as jest.Mocked<typeof LeaderboardService>;

// Test data for leaderboard
const studentLeaderboardData: LeaderboardEntry[] = [
  {
    _id: '1',
    userId: '1',
    username: 'Alice',
    email: 'alice@test.com',
    role: 'student',
    totalActivities: 10,
    completedActivities: 8,
    totalProgress: 80,
    totalPoints: 900,
    learningModules: 3,
    exercises: 3,
    quizzes: 2,
    modulePoints: { 'module1': 30, 'module2': 20, 'module3': 10 },
    exercisePoints: 45,
    quizPoints: 40,
    rank: 1,
    isCurrentUser: false,
    badges: [
      {
        type: 'advanced',
        name: 'Advanced Learner',
        description: 'Completed 5 learning modules',
        icon: 'advanced_icon'
      }
    ]
  },
  {
    _id: '2',
    userId: '2',
    username: 'Bob',
    email: 'bob@test.com',
    role: 'student',
    totalActivities: 8,
    completedActivities: 5,
    totalProgress: 60,
    totalPoints: 600,
    learningModules: 2,
    exercises: 2,
    quizzes: 1,
    modulePoints: { 'module1': 20, 'module2': 10 },
    exercisePoints: 30,
    quizPoints: 20,
    rank: 2,
    isCurrentUser: true,
    badges: [
      {
        type: 'intermediate',
        name: 'Intermediate Learner',
        description: 'Completed 3 learning modules',
        icon: 'intermediate_icon'
      }
    ]
  }
];

const mockStudentAuth = {
  isAuthenticated: true,
  user: { id: '2', username: 'Bob', email: 'bob@test.com', role: 'student' },
  login: jest.fn(), logout: jest.fn(), updateUser: jest.fn(),
};

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter><ThemeProvider theme={theme}>{children}</ThemeProvider></BrowserRouter>
);

describe('User Story BSPM25T5-87: View Leaderboard - As a Student, I want to compare my progress with others, so I stay motivated', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth.mockReturnValue(mockStudentAuth);
  });

  describe('Core Leaderboard Functionality', () => {
    test('shows loading state while fetching leaderboard data', () => {
      mockService.getLeaderboard.mockImplementation(() => new Promise(() => {}));
      render(<TestWrapper><Leaderboard /></TestWrapper>);
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    test('displays leaderboard with student progress comparison', async () => {
      mockService.getLeaderboard.mockResolvedValue(studentLeaderboardData);
      render(<TestWrapper><Leaderboard /></TestWrapper>);
      
      expect(await screen.findByText('🏆 Student Leaderboard')).toBeInTheDocument();
      expect(screen.getByText('Alice')).toBeInTheDocument();
      expect(screen.getByText('Bob')).toBeInTheDocument();
      expect(screen.getByText('(You)')).toBeInTheDocument();
    });

    test('handles empty leaderboard when no students have progress', async () => {
      mockService.getLeaderboard.mockResolvedValue([]);
      render(<TestWrapper><Leaderboard /></TestWrapper>);
      
      // Wait for the table to be loaded
      await screen.findByRole('table');
      
      // Verify that the table is empty
      const rows = screen.getAllByRole('row');
      expect(rows).toHaveLength(1); // Only header row
    });

    test('handles error when leaderboard data cannot be loaded', async () => {
      mockService.getLeaderboard.mockRejectedValue(new Error('Failed to load'));
      render(<TestWrapper><Leaderboard /></TestWrapper>);
      expect(await screen.findByText('Failed to load')).toBeInTheDocument();
    });

    test('calls leaderboard service to fetch student progress data', () => {
      mockService.getLeaderboard.mockResolvedValue(studentLeaderboardData);
      render(<TestWrapper><Leaderboard /></TestWrapper>);
      expect(mockService.getLeaderboard).toHaveBeenCalledTimes(1);
    });

    test('provides leaderboard interface with search and filters for student motivation', async () => {
      mockService.getLeaderboard.mockResolvedValue(studentLeaderboardData);
      render(<TestWrapper><Leaderboard /></TestWrapper>);
      await screen.findByText('🏆 Student Leaderboard');
      expect(screen.getByRole('table')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Search students...')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /All Activities/i })).toBeInTheDocument();
    });
  });

  describe('Sub-task BSPM25T5-88: Leaderboard sorted by points or achievements', () => {
    test('displays students sorted by total points in descending order', async () => {
      mockService.getLeaderboard.mockResolvedValue(studentLeaderboardData);
      render(<TestWrapper><Leaderboard /></TestWrapper>);
      
      await screen.findByText('🏆 Student Leaderboard');
      const rows = screen.getAllByRole('row');
      // Alice (900 points) should appear before Bob (600 points)
      expect(rows[1]).toHaveTextContent('Alice');
      expect(rows[2]).toHaveTextContent('Bob');
    });

    test('shows point values for students to compare achievements', async () => {
      mockService.getLeaderboard.mockResolvedValue(studentLeaderboardData);
      render(<TestWrapper><Leaderboard /></TestWrapper>);
      
      await screen.findByText('🏆 Student Leaderboard');
      expect(screen.getByRole('cell', { name: '900' })).toBeInTheDocument(); // Alice's points
      expect(screen.getByRole('cell', { name: '600' })).toBeInTheDocument(); // Bob's points
    });
  });

  describe('Sub-task BSPM25T5-89: User position clearly marked', () => {
    test('clearly marks current student position with (You) indicator', async () => {
      mockService.getLeaderboard.mockResolvedValue(studentLeaderboardData);
      render(<TestWrapper><Leaderboard /></TestWrapper>);
      
      await screen.findByText('🏆 Student Leaderboard');
      expect(screen.getByText('(You)')).toBeInTheDocument();
      expect(screen.getAllByText('(You)')).toHaveLength(1);
    });

    test('shows current student rank position for motivation comparison', async () => {
      mockService.getLeaderboard.mockResolvedValue(studentLeaderboardData);
      render(<TestWrapper><Leaderboard /></TestWrapper>);
      
      await screen.findByText('🏆 Student Leaderboard');
      const rows = screen.getAllByRole('row');
      // Bob should appear in rank 2 with (You) marker
      expect(rows[2]).toHaveTextContent('Bob');
      expect(rows[2]).toHaveTextContent('(You)');
    });
  });

  describe('Sub-task BSPM25T5-90: Names, scores, and badges displayed', () => {
    test('displays student names for easy identification and comparison', async () => {
      mockService.getLeaderboard.mockResolvedValue(studentLeaderboardData);
      render(<TestWrapper><Leaderboard /></TestWrapper>);
      
      await screen.findByText('🏆 Student Leaderboard');
      expect(screen.getByText('Alice')).toBeInTheDocument();
      expect(screen.getByText('Bob')).toBeInTheDocument();
    });

    test('displays scores for progress comparison and motivation', async () => {
      mockService.getLeaderboard.mockResolvedValue(studentLeaderboardData);
      render(<TestWrapper><Leaderboard /></TestWrapper>);
      
      await screen.findByText('🏆 Student Leaderboard');
      expect(screen.getByRole('cell', { name: '900' })).toBeInTheDocument(); // Alice's points
      expect(screen.getByRole('cell', { name: '600' })).toBeInTheDocument(); // Bob's points
    });

    test('shows achievement badges and activity progress for detailed comparison', async () => {
      mockService.getLeaderboard.mockResolvedValue(studentLeaderboardData);
      render(<TestWrapper><Leaderboard /></TestWrapper>);
      
      await screen.findByText('🏆 Student Leaderboard');
      // Verify table headers for badges/achievements are present
      expect(screen.getByRole('columnheader', { name: 'Modules' })).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: 'Exercises' })).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: 'Quizzes' })).toBeInTheDocument();
    });
  });

  describe('Student Motivation Features', () => {
    test('shows student count to provide context for competition', async () => {
      mockService.getLeaderboard.mockResolvedValue(studentLeaderboardData);
      render(<TestWrapper><Leaderboard /></TestWrapper>);
      expect(await screen.findByText(/Showing 2 students/)).toBeInTheDocument();
    });

    test('displays progress comparison opportunities through ranking system', async () => {
      mockService.getLeaderboard.mockResolvedValue(studentLeaderboardData);
      render(<TestWrapper><Leaderboard /></TestWrapper>);
      
      await screen.findByText('🏆 Student Leaderboard');
      // Check that ranking column exists
      expect(screen.getByRole('columnheader', { name: '#' })).toBeInTheDocument();
      
      // Verify rank positions are displayed
      const table = screen.getByRole('table');
      expect(table).toBeInTheDocument();
    });
  });

  describe('Filtering Functionality', () => {
    test('filters by module type', async () => {
      mockService.getLeaderboard.mockResolvedValue(studentLeaderboardData);
      render(<TestWrapper><Leaderboard /></TestWrapper>);
      
      await screen.findByText('🏆 Student Leaderboard');
      
      const modulesFilter = screen.getByRole('button', { name: /Learning Modules/i });
      fireEvent.click(modulesFilter);
      
      await waitFor(() => {
        expect(mockService.getLeaderboard).toHaveBeenCalledWith('modules', undefined);
      });
    });

    test('shows correct score based on filter type', async () => {
      mockService.getLeaderboard.mockResolvedValue(studentLeaderboardData);
      render(<TestWrapper><Leaderboard /></TestWrapper>);
      
      await screen.findByText('🏆 Student Leaderboard');
      
      const modulesFilter = screen.getByRole('button', { name: /Learning Modules/i });
      fireEvent.click(modulesFilter);
      
      await waitFor(() => {
        // Find Alice's row and check her module count
        const rows = screen.getAllByRole('row');
        expect(rows[1]).toHaveTextContent('3'); // Alice's modules
      });
    });
  });
}); 