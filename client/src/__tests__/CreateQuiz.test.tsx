/**
 * Test Suite: Quiz Creation Feature - BSPM25T5-49
 * 
 * This suite tests the basic rendering of the quiz creation functionality:
 * - Form for creating multiple-choice questions (BSPM25T5-51)
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';
import CreateQuiz from '../pages/Quizzes/CreateQuiz';
import quizService from '../services/quizService';

// Mock the quiz service
jest.mock('../services/quizService', () => ({
  __esModule: true,
  default: {
    createQuiz: jest.fn().mockResolvedValue({ id: 'quiz-123' }),
  }
}));

// Mock useNavigate hook
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

// Mock AuthContext
jest.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'user-123', username: 'lecturer1', email: 'lecturer@example.com', role: 'lecturer' }
  }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>
}));

describe('Quiz Creation Feature - BSPM25T5-49', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // BSPM25T5-51 - Form for creating multiple-choice questions
  it('renders the quiz creation form with initial fields', () => {
    render(
      <MemoryRouter>
        <CreateQuiz />
      </MemoryRouter>
    );
    
    // Check for title
    expect(screen.getByText('Create New Quiz')).toBeInTheDocument();
    
    // Check for stepper steps
    expect(screen.getByText('Quiz Details')).toBeInTheDocument();
    expect(screen.getByText('Questions')).toBeInTheDocument();
    expect(screen.getByText('Review & Submit')).toBeInTheDocument();
    
    // Check for back button
    expect(screen.getByText('Back to Quizzes')).toBeInTheDocument();
  });
}); 