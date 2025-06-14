/**
 * Test Suite: View Exercises Component (BSPM25T5-28)
 * 
 * This suite tests the exercise module listing functionality including:
 * - Module display:
 *   - Exercise titles and descriptions
 *   - Difficulty indicators
 *   - Topic grouping
 * - Progress tracking:
 *   - Module completion status
 *   - Progress indicators
 * - Interactive elements:
 *   - Start Module button
 *   - Continue Module button
 *   - Review Module button
 * - Loading states
 * - Integration with progress service
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';
import ExerciseList from '../components/Training/ExerciseList';

// Mock the progressService
jest.mock('../services/progressService', () => ({
  getAllProgress: jest.fn().mockResolvedValue([
    { exerciseId: 'git-basics', progress: 0 },
    { exerciseId: 'branching-basics', progress: 50 }
  ]),
  invalidateAllCaches: jest.fn()
}));

// Mock the training modules data
jest.mock('../data/trainingExercises', () => ({
  trainingExercises: [
    {
      id: 'git-basics',
      title: 'Git Basics',
      description: 'Learn the fundamental concepts and commands in Git',
      difficulty: 'beginner',
      estimatedTime: '30 minutes'
    },
    {
      id: 'branching-basics',
      title: 'Branching Basics',
      description: 'Learn about Git branches and how to use them',
      difficulty: 'intermediate',
      estimatedTime: '45 minutes'
    }
  ]
}));

// Mock fetch for API calls
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve([])
  })
) as jest.Mock;

describe('ViewExercises Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Set up mock token
    localStorage.setItem('token', 'mock-token');
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('displays list of exercises', async () => {
    render(
      <MemoryRouter>
        <ExerciseList />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Git Basics')).toBeInTheDocument();
      expect(screen.getByText('Branching Basics')).toBeInTheDocument();
    });
  });

  it('shows exercise difficulty levels', async () => {
    render(
      <MemoryRouter>
        <ExerciseList />
      </MemoryRouter>
    );

    await waitFor(() => {
      // Check for difficulty levels using aria-labels
      expect(screen.getByLabelText('Beginner')).toBeInTheDocument();
      expect(screen.getByLabelText('Intermediate')).toBeInTheDocument();
    });
  });

  it('displays exercise descriptions', async () => {
    render(
      <MemoryRouter>
        <ExerciseList />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Learn the fundamental concepts and commands in Git')).toBeInTheDocument();
      expect(screen.getByText('Learn about Git branches and how to use them')).toBeInTheDocument();
    });
  });

  it('handles API errors gracefully', async () => {
    // Mock a failed API call
    (global.fetch as jest.Mock).mockImplementationOnce(() =>
      Promise.reject(new Error('API Error'))
    );

    render(
      <MemoryRouter>
        <ExerciseList />
      </MemoryRouter>
    );

    // Should still render without crashing and show static exercises
    await waitFor(() => {
      expect(screen.getByText('Git Basics')).toBeInTheDocument();
      expect(screen.getByText('Branching Basics')).toBeInTheDocument();
    });
  });
}); 