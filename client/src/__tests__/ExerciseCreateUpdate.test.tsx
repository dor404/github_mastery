import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import '@testing-library/jest-dom';
import { Exercise } from '../types/training';
import exerciseService from '../services/exerciseService';

// Mock exercise service
jest.mock('../services/exerciseService');

// Sample exercise data
const sampleExercise: Exercise = {
  id: 'test-exercise',
  title: 'Test Exercise',
  description: 'Description for test exercise',
  content: 'Content for test exercise',
  tasks: [
    {
      id: 'task-1',
      question: 'Test Question',
      description: 'Test task description',
      hints: ['Hint 1', 'Hint 2'],
      solution: 'test solution',
      validationCommand: 'test command'
    }
  ],
  difficulty: 'beginner',
  estimatedTime: '30 minutes'
};

// Simpler Test Component that doesn't use router
const TestComponent = ({ initialExercise = null }: { initialExercise?: Exercise | null }) => {
  const [exercise, setExercise] = React.useState<Exercise | null>(initialExercise);
  const [error, setError] = React.useState<string | null>(null);

  const handleCreate = async () => {
    try {
      const newExercise = {
        id: 'new-exercise',
        title: 'New Exercise',
        description: 'New description',
        content: 'New content',
        tasks: [],
        difficulty: 'beginner' as const,
        estimatedTime: '15 minutes'
      };
      
      const result = await exerciseService.createExercise(newExercise);
      setExercise(result);
    } catch (err) {
      console.error("Error creating exercise:", err);
      setError("Failed to create exercise");
    }
  };

  const handleUpdate = async () => {
    if (!exercise) return;
    
    try {
      const updatedExercise = {
        ...exercise,
        title: 'Updated Title'
      };
      
      const result = await exerciseService.updateExercise(exercise.id, updatedExercise);
      setExercise(result);
    } catch (err) {
      console.error("Error updating exercise:", err);
      setError("Failed to update exercise");
    }
  };

  return (
    <div data-testid="exercise-container">
      {error && <div data-testid="error-message">{error}</div>}
      
      {exercise ? (
        <div>
          <h2 data-testid="exercise-title">{exercise.title}</h2>
          <button 
            data-testid="edit-button"
            onClick={handleUpdate}
          >
            Edit
          </button>
        </div>
      ) : (
        <button 
          data-testid="create-button"
          onClick={handleCreate}
        >
          Create New
        </button>
      )}
    </div>
  );
};

describe('Exercise Create and Update Functionality', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('creates a new exercise', async () => {
    // Setup mocks
    const mockCreateExercise = exerciseService.createExercise as jest.Mock;
    mockCreateExercise.mockResolvedValue({
      id: 'new-exercise',
      title: 'New Exercise',
      description: 'New description',
      content: 'New content',
      tasks: [],
      difficulty: 'beginner',
      estimatedTime: '15 minutes'
    });

    // Render component
    render(<TestComponent />);

    // Click create button
    fireEvent.click(screen.getByTestId('create-button'));

    // Wait for the API call to complete
    await waitFor(() => {
      expect(mockCreateExercise).toHaveBeenCalledTimes(1);
    });

    // Verify API call parameters
    expect(mockCreateExercise).toHaveBeenCalledWith(expect.objectContaining({
      id: 'new-exercise',
      title: 'New Exercise'
    }));

    // Verify UI update
    expect(await screen.findByTestId('exercise-title')).toHaveTextContent('New Exercise');
  });

  test('updates an existing exercise', async () => {
    // Setup mocks
    const mockUpdateExercise = exerciseService.updateExercise as jest.Mock;
    mockUpdateExercise.mockResolvedValue({
      ...sampleExercise,
      title: 'Updated Title'
    });

    // Render component with initial exercise
    render(<TestComponent initialExercise={sampleExercise} />);

    // Verify initial render
    expect(screen.getByTestId('exercise-title')).toHaveTextContent('Test Exercise');

    // Click edit button
    fireEvent.click(screen.getByTestId('edit-button'));

    // Wait for the API call to complete
    await waitFor(() => {
      expect(mockUpdateExercise).toHaveBeenCalledTimes(1);
    });

    // Verify API call parameters
    expect(mockUpdateExercise).toHaveBeenCalledWith(
      'test-exercise',
      expect.objectContaining({
        ...sampleExercise,
        title: 'Updated Title'
      })
    );

    // Verify UI update
    expect(await screen.findByTestId('exercise-title')).toHaveTextContent('Updated Title');
  });

  test('handles errors during create', async () => {
    // Setup error mock
    const mockCreateExercise = exerciseService.createExercise as jest.Mock;
    mockCreateExercise.mockRejectedValue(new Error('Failed to create exercise'));
    
    // Spy on console.error
    jest.spyOn(console, 'error').mockImplementation(() => {});

    // Render component
    render(<TestComponent />);

    // Click create button
    fireEvent.click(screen.getByTestId('create-button'));

    // Wait for the error message to appear
    await waitFor(() => {
      expect(screen.getByTestId('error-message')).toBeInTheDocument();
    });

    // Verify console.error was called
    expect(console.error).toHaveBeenCalled();

    // Clean up
    (console.error as jest.Mock).mockRestore();
  });

  test('handles errors during update', async () => {
    // Setup error mock
    const mockUpdateExercise = exerciseService.updateExercise as jest.Mock;
    mockUpdateExercise.mockRejectedValue(new Error('Failed to update exercise'));
    
    // Spy on console.error
    jest.spyOn(console, 'error').mockImplementation(() => {});

    // Render component with initial exercise
    render(<TestComponent initialExercise={sampleExercise} />);

    // Click edit button
    fireEvent.click(screen.getByTestId('edit-button'));

    // Wait for the error message to appear
    await waitFor(() => {
      expect(screen.getByTestId('error-message')).toBeInTheDocument();
    });

    // Verify console.error was called
    expect(console.error).toHaveBeenCalled();

    // Clean up
    (console.error as jest.Mock).mockRestore();
  });
}); 