import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Dashboard from '../pages/Dashboard';
import '@testing-library/jest-dom';

// Mock fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  clear: jest.fn()
};
Object.defineProperty(window, 'localStorage', { value: mockLocalStorage });

// Mock navigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate
}));

// Mock Chart.js
jest.mock('chart.js', () => ({
  Chart: {
    register: jest.fn()
  },
  ArcElement: jest.fn(),
  Tooltip: jest.fn(),
  Legend: jest.fn(),
  CategoryScale: jest.fn(),
  LinearScale: jest.fn(),
  PointElement: jest.fn(),
  LineElement: jest.fn(),
  Title: jest.fn()
}));

// Mock react-chartjs-2
jest.mock('react-chartjs-2', () => ({
  Pie: () => <div data-testid="pie-chart">Pie Chart</div>,
  Line: () => <div data-testid="line-chart">Line Chart</div>
}));

describe('Dashboard Component', () => {
  const mockProgressData = {
    completedModules: 2,
    totalModules: 5,
    quizScores: [
      { date: '2024-03-20', score: 85 },
      { date: '2024-03-21', score: 90 }
    ],
    incompleteModules: [
      { id: 'ex1', title: 'Exercise 1', type: 'exercise' },
      { id: 'ex2', title: 'Exercise 2', type: 'exercise' }
    ]
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue('mock-token');
  });

  it('renders loading state initially', () => {
    mockFetch.mockImplementationOnce(() => new Promise(() => {}));
    
    render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    );
    
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('renders error message when API call fails', async () => {
    const errorMessage = 'API Error';
    mockFetch.mockRejectedValueOnce(new Error(errorMessage));
    
    render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    );
    
    await waitFor(() => {
      const alert = screen.getByRole('alert');
      expect(alert).toHaveTextContent(errorMessage);
    });
  });

  it('renders dashboard content when API call succeeds', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockProgressData)
    });
    
    render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    );
    
    await waitFor(() => {
      // Check title
      expect(screen.getByRole('heading', { name: 'Personal Progress Dashboard' })).toBeInTheDocument();
      
      // Check progress info
      expect(screen.getByText('2 of 5 exercises completed')).toBeInTheDocument();
      
      // Check charts
      expect(screen.getByTestId('pie-chart')).toBeInTheDocument();
      expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    });
  });

  it('navigates to correct exercise page when clicking incomplete exercise', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockProgressData)
    });
    
    render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    );
    
    await waitFor(() => {
      const exerciseButton = screen.getByText('Exercise 1');
      fireEvent.click(exerciseButton);
      expect(mockNavigate).toHaveBeenCalledWith('/training/ex1');
    });
  });

  it('shows no exercises message when all are completed', async () => {
    const emptyProgressData = {
      ...mockProgressData,
      incompleteModules: []
    };
    
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(emptyProgressData)
    });
    
    render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    );
    
    await waitFor(() => {
      expect(screen.getByText('All exercises completed! 🎉')).toBeInTheDocument();
    });
  });

  it('handles missing token correctly', async () => {
    mockLocalStorage.getItem.mockReturnValueOnce(null);
    
    render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    );
    
    await waitFor(() => {
      const alert = screen.getByRole('alert');
      expect(alert).toHaveTextContent('No authentication token found');
    });
  });

  it('makes API call with correct headers', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockProgressData)
    });
    
    render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    );
    
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:5001/api/dashboard/progress',
        expect.objectContaining({
          headers: {
            'Authorization': 'Bearer mock-token',
            'Content-Type': 'application/json'
          }
        })
      );
    });
  });
}); 