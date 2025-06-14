import axios from 'axios';
import { ModuleProgress } from '../types/training';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

// Helper function to clean date objects from payload
const sanitizeProgressPayload = (data: any): any => {
  if (!data) return data;
  
  const cleaned: any = {};
  
  Object.keys(data).forEach(key => {
    if (data[key] instanceof Date) return;
    if (key === 'moduleId' && data[key] === null) return;
    
    if (Array.isArray(data[key])) {
      cleaned[key] = data[key].map((item: any) => 
        typeof item === 'object' && item !== null
          ? sanitizeProgressPayload(item)
          : item
      );
    } 
    else if (typeof data[key] === 'object' && data[key] !== null) {
      cleaned[key] = sanitizeProgressPayload(data[key]);
    } 
    else {
      cleaned[key] = data[key];
    }
  });
  
  return cleaned;
};

// Helper function to determine if an error is retriable
const shouldRetry = (error: any): boolean => {
  // Network errors are retriable
  if (!error.response && error.request) return true;
  
  // Server errors (5xx) are retriable
  if (error.response?.status >= 500) return true;
  
  // Rate limiting (429) is retriable
  if (error.response?.status === 429) return true;
  
  // Duplicate key errors are specifically handled elsewhere
  if (error.response?.data?.error?.includes('duplicate key') || 
      error.message?.includes('duplicate key')) {
    return false;
  }
  
  // All other errors are not retriable by default
  return false;
};

// Simple in-memory cache for progress data
const progressCache = {
  moduleProgress: new Map<string, {data: ModuleProgress, timestamp: number}>(),
  allProgress: {data: null as ModuleProgress[] | null, timestamp: 0},
  CACHE_TIMEOUT: 30000,
  
  storeModuleProgress(moduleId: string, data: ModuleProgress): void {
    this.moduleProgress.set(moduleId, {
      data,
      timestamp: Date.now()
    });
  },
  
  getCachedModuleProgress(moduleId: string): ModuleProgress | null {
    const cached = this.moduleProgress.get(moduleId);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TIMEOUT) {
      return cached.data;
    }
    return null;
  },
  
  storeAllProgress(data: ModuleProgress[]): void {
    this.allProgress = {
      data,
      timestamp: Date.now()
    };
  },
  
  getCachedAllProgress(): ModuleProgress[] | null {
    if (this.allProgress.data && Date.now() - this.allProgress.timestamp < this.CACHE_TIMEOUT) {
      return this.allProgress.data;
    }
    return null;
  },
  
  invalidateModuleCache(moduleId: string): void {
    this.moduleProgress.delete(moduleId);
    this.allProgress.data = null;
  },
  
  invalidateAllCaches(): void {
    this.moduleProgress.clear();
    this.allProgress.data = null;
  }
};

const progressService = {
  invalidateAllCaches: () => {
    progressCache.invalidateAllCaches();
  },
  
  invalidateModuleCache: (moduleId: string) => {
    progressCache.invalidateModuleCache(moduleId);
  },
  
  // Get all progress for the current user
  getAllProgress: async (): Promise<ModuleProgress[]> => {
    const token = localStorage.getItem('token');
    if (!token) return [];
    
    const cachedData = progressCache.getCachedAllProgress();
    if (cachedData) return cachedData;
    
    const response = await axios.get(`${API_URL}/progress`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    progressCache.storeAllProgress(response.data);
    return response.data;
  },

  // Get progress for a specific exercise
  getModuleProgress: async (moduleId: string): Promise<ModuleProgress> => {
    const token = localStorage.getItem('token');
    if (!token) {
      return {
        exerciseId: moduleId,
        userId: '',
        completed: false,
        progress: 0,
        tasks: [],
        lastAccessed: new Date(),
        startedAt: new Date()
      };
    }
    
    const cachedData = progressCache.getCachedModuleProgress(moduleId);
    if (cachedData) return cachedData;
    
    const response = await axios.get(`${API_URL}/progress/exercise/${moduleId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    progressCache.storeModuleProgress(moduleId, response.data);
    return response.data;
  },

  // Get progress for a specific task within an exercise
  getTaskProgress: async (exerciseId: string, taskId: string): Promise<any> => {
    const token = localStorage.getItem('token');
    if (!token) {
      return {
        exerciseId,
        taskId,
        userId: '',
        completed: false,
        completedSteps: [],
        startedAt: new Date()
      };
    }
    
    const response = await axios.get(
      `${API_URL}/progress/exercise/${exerciseId}/task/${taskId}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  },

  // Update progress for a specific exercise
  updateModuleProgress: async (moduleId: string, progressData: Partial<ModuleProgress>): Promise<ModuleProgress> => {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('No authentication token found');
    
    const sanitizedData = sanitizeProgressPayload(progressData);
    
    const response = await axios.patch(
      `${API_URL}/progress/exercise/${moduleId}`,
      sanitizedData,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    
    progressCache.invalidateModuleCache(moduleId);
    return response.data;
  },

  // Update progress for a specific task within an exercise
  updateExerciseProgress: async (exerciseId: string, taskId: string, progressData: any): Promise<ModuleProgress> => {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('No authentication token found');
    
    // Ensure the data is properly formatted
    const sanitizedData = sanitizeProgressPayload(progressData);
    
    // Debug what's being sent
    console.log(`Progress API - Attempting to update progress for exercise ${exerciseId}, task ${taskId}`, {
      data: sanitizedData
    });
    
    try {
      // First try to get the existing progress record
      console.log('Fetching existing progress...');
      const existingProgressResponse = await axios.get(
        `${API_URL}/progress/exercise/${exerciseId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      const existingProgress = existingProgressResponse.data;
      console.log('Found existing progress:', existingProgress);
      
      // Determine the best API endpoint to use
      let apiEndpoint = `${API_URL}/progress/module/${exerciseId}/exercise/${taskId}`;
      
      // Try updating through the most reliable endpoint (backwards compatibility one)
      console.log(`Using reliable endpoint: ${apiEndpoint}`);
      const response = await axios.post(
        apiEndpoint,
        sanitizedData,
        { 
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log('Progress updated successfully:', response.data);
      progressCache.invalidateModuleCache(exerciseId);
      return response.data;
    } catch (error: any) {
      // Handle the 400 Bad Request with duplicates
      if (error.response?.status === 400 && 
          error.response?.data?.error?.includes('duplicate key error')) {
        console.log('Detected duplicate key error - trying alternative approach');
        
        try {
          // Try alternative endpoint that has better update logic
          const alternativeEndpoint = `${API_URL}/progress/module/${exerciseId}`;
          console.log(`Using alternative endpoint: ${alternativeEndpoint}`);
          
          // First update overall module progress
          const moduleResponse = await axios.post(
            alternativeEndpoint,
            { completed: sanitizedData.completed },
            { headers: { Authorization: `Bearer ${token}` } }
          );
          
          // Get the updated module progress
          const updatedProgress = moduleResponse.data;
          progressCache.invalidateModuleCache(exerciseId);
          
          // Update the task directly in the returned data (client-side update)
          const tasksArray = updatedProgress.tasks || [];
          const taskIndex = tasksArray.findIndex((t: any) => t.taskId === taskId);
          
          if (taskIndex >= 0) {
            // Update existing task in our local data
            if (typeof sanitizedData.completed === 'boolean') {
              tasksArray[taskIndex].completed = sanitizedData.completed;
            }
            
            if (Array.isArray(sanitizedData.completedSteps)) {
              // Merge existing steps with new ones
              const existingSteps = tasksArray[taskIndex].completedSteps || [];
              tasksArray[taskIndex].completedSteps = Array.from(
                new Set([...existingSteps, ...sanitizedData.completedSteps])
              );
            }
          } else if (taskId) {
            // Add new task to our local data
            tasksArray.push({
              taskId,
              completed: sanitizedData.completed || false,
              completedSteps: sanitizedData.completedSteps || []
            });
          }
          
          updatedProgress.tasks = tasksArray;
          return updatedProgress;
        } catch (altError) {
          console.error('Alternative approach also failed:', altError);
          throw altError;
        }
      }
      
      // Log more details about the error
      console.error('Error updating exercise progress:');
      console.error('- Message:', error.message);
      console.error('- URL:', `${API_URL}/progress/exercise/${exerciseId}/task/${taskId}`);
      console.error('- Status:', error.response?.status);
      console.error('- Response data:', error.response?.data);
      
      throw error; // Re-throw to let the component handle it
    }
  }
};

export default progressService; 