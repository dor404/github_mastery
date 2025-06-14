import axios from 'axios';
import { Module, Exercise, ExerciseType, Task, ExerciseStep, TaskStep } from '../types/training';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

// Helper to get the auth token
const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const exerciseService = {
  // Get all exercises
  getAllExercises: async (): Promise<Module[]> => {
    const response = await axios.get(`${API_URL}/exercises`);
    return response.data;
  },
  
  // Alias for backwards compatibility
  getAllModules: async (): Promise<Module[]> => {
    return exerciseService.getAllExercises();
  },

  // Get a single exercise by ID
  getExercise: async (exerciseId: string): Promise<Module> => {
    const response = await axios.get(`${API_URL}/exercises/${exerciseId}`);
    return response.data;
  },
  
  // Alias for backwards compatibility
  getModule: async (moduleId: string): Promise<Module> => {
    return exerciseService.getExercise(moduleId);
  },

  // Create a new exercise (lecturer/admin only)
  createExercise: async (exerciseData: Partial<Module>): Promise<Module> => {
    const response = await axios.post(
      `${API_URL}/exercises`,
      exerciseData,
      { headers: getAuthHeader() }
    );
    return response.data;
  },
  
  // Alias for backwards compatibility
  createModule: async (moduleData: Partial<Module>): Promise<Module> => {
    return exerciseService.createExercise(moduleData);
  },

  // Update an exercise (lecturer/admin only)
  updateExercise: async (exerciseId: string, exerciseData: Partial<Module>): Promise<Module> => {
    const response = await axios.patch(
      `${API_URL}/exercises/${exerciseId}`,
      exerciseData,
      { headers: getAuthHeader() }
    );
    return response.data;
  },
  
  // Alias for backwards compatibility
  updateModule: async (moduleId: string, moduleData: Partial<Module>): Promise<Module> => {
    return exerciseService.updateExercise(moduleId, moduleData);
  },

  // Delete an exercise (admin only)
  deleteExercise: async (exerciseId: string): Promise<void> => {
    await axios.delete(
      `${API_URL}/exercises/${exerciseId}`,
      { headers: getAuthHeader() }
    );
  },
  
  // Alias for backwards compatibility
  deleteModule: async (moduleId: string): Promise<void> => {
    return exerciseService.deleteExercise(moduleId);
  },

  // Add a task to an exercise (lecturer/admin only)
  addTask: async (exerciseId: string, taskData: Partial<Task>): Promise<Task> => {
    // Make sure required fields are present
    if (!taskData.question || !taskData.description || !taskData.solution) {
      throw new Error('Missing required fields');
    }
    
    // Ensure hints is an array
    if (!taskData.hints || !Array.isArray(taskData.hints)) {
      taskData.hints = [''];
    }
    
    const response = await axios.post(
      `${API_URL}/exercises/${exerciseId}/tasks`,
      taskData,
      { headers: getAuthHeader() }
    );
    return response.data;
  },
  
  // Alias for backwards compatibility
  addExercise: async (moduleId: string, exerciseData: Partial<Task>): Promise<Task> => {
    return exerciseService.addTask(moduleId, exerciseData);
  },

  // Update a task (lecturer/admin only)
  updateTask: async (
    exerciseId: string,
    taskId: string,
    taskData: Partial<Task>
  ): Promise<Task> => {
    const response = await axios.patch(
      `${API_URL}/exercises/${exerciseId}/tasks/${taskId}`,
      taskData,
      { headers: getAuthHeader() }
    );
    return response.data;
  },
  
  // Alias for backwards compatibility
  updateExerciseTask: async (
    moduleId: string,
    exerciseId: string,
    exerciseData: Partial<Task>
  ): Promise<Task> => {
    return exerciseService.updateTask(moduleId, exerciseId, exerciseData);
  },

  // Delete a task (lecturer/admin only)
  deleteTask: async (exerciseId: string, taskId: string): Promise<void> => {
    await axios.delete(
      `${API_URL}/exercises/${exerciseId}/tasks/${taskId}`,
      { headers: getAuthHeader() }
    );
  },
  
  // Alias for backwards compatibility
  deleteExerciseTask: async (moduleId: string, exerciseId: string): Promise<void> => {
    return exerciseService.deleteTask(moduleId, exerciseId);
  }
};

// Create a moduleService alias for backwards compatibility
const moduleService = {
  getAllModules: exerciseService.getAllModules,
  getModule: exerciseService.getModule,
  createModule: exerciseService.createModule,
  updateModule: exerciseService.updateModule,
  deleteModule: exerciseService.deleteModule,
  addExercise: exerciseService.addExercise,
  updateExercise: exerciseService.updateExerciseTask,
  deleteExercise: exerciseService.deleteExerciseTask
};

export default exerciseService;
export { moduleService }; 