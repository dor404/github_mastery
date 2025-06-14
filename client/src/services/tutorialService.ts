import axios from 'axios';
import { Tutorial } from '../types/tutorial';

// Use fixed API URL without environment variable that might be missing
const API_URL = 'http://localhost:5001/api';

// For debugging
console.log('API URL for tutorials:', API_URL);

/**
 * Service for handling tutorial-related API calls
 */
const tutorialService = {
  /**
   * Get all published tutorials
   */
  getAllPublished: async (): Promise<Tutorial[]> => {
    try {
      const response = await axios.get(`${API_URL}/tutorials/published`);
      return response.data;
    } catch (error) {
      console.error('Error fetching published tutorials:', error);
      throw error;
    }
  },

  /**
   * Get a single published tutorial by ID
   */
  getPublishedById: async (id: string): Promise<Tutorial> => {
    try {
      const response = await axios.get(`${API_URL}/tutorials/published/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching tutorial ${id}:`, error);
      throw error;
    }
  },

  /**
   * Get a single tutorial by ID for editing (requires auth token)
   * This retrieves both published and unpublished tutorials if the user has permission
   */
  getById: async (id: string): Promise<Tutorial> => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('Authentication token not found. Please log in again.');
      }
      
      const response = await axios.get(`${API_URL}/tutorials/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      return response.data;
    } catch (error) {
      console.error(`Error fetching tutorial ${id} for editing:`, error);
      throw error;
    }
  },

  /**
   * Create a new tutorial (requires auth token)
   */
  create: async (tutorialData: Partial<Tutorial>): Promise<Tutorial> => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('Authentication token not found. Please log in again.');
      }
      
      console.log('Creating tutorial with data:', JSON.stringify(tutorialData, null, 2));
      
      // Validate required fields
      if (!tutorialData.title) {
        throw new Error('Title is required');
      }
      
      if (!tutorialData.content) {
        throw new Error('Content is required');
      }
      
      if (!tutorialData.description) {
        throw new Error('Description is required');
      }
      
      const response = await axios.post(`${API_URL}/tutorials`, tutorialData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Tutorial created successfully:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Error creating tutorial:', error);
      // Add more detailed error information
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.error('Server response error details:', error.response.data);
        console.error('Status code:', error.response.status);
        console.error('Headers:', JSON.stringify(error.response.headers, null, 2));
      } else if (error.request) {
        console.error('No response received:', error.request);
      }
      throw error;
    }
  },

  /**
   * Update a tutorial (requires auth token)
   */
  update: async (id: string, tutorialData: Partial<Tutorial>): Promise<Tutorial> => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('Authentication token not found. Please log in again.');
      }
      
      const response = await axios.patch(`${API_URL}/tutorials/${id}`, tutorialData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      return response.data;
    } catch (error) {
      console.error(`Error updating tutorial ${id}:`, error);
      throw error;
    }
  },

  /**
   * Delete a tutorial (requires auth token)
   */
  delete: async (id: string): Promise<{message: string}> => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('Authentication token not found. Please log in again.');
      }
      
      console.log(`Attempting to delete tutorial with ID: ${id}`);
      
      const response = await axios.delete(`${API_URL}/tutorials/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      console.log('Delete response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error(`Error deleting tutorial ${id}:`, error);
      
      // Add more detailed error logging
      if (error.response) {
        console.error('Server response error:', error.response.status);
        console.error('Error data:', error.response.data);
      } else if (error.request) {
        console.error('No response received from server');
      } else {
        console.error('Error setting up request:', error.message);
      }
      
      throw error;
    }
  },
  
  /**
   * Search tutorials
   */
  search: async (params: {query?: string, difficulty?: string, tags?: string[] | string, filterMode?: string}): Promise<Tutorial[]> => {
    try {
      // Make a copy of the params to avoid modifying the original
      const searchParams: Record<string, any> = { ...params };
      
      // Handle tags parameter - convert array to comma-separated string
      if (searchParams.tags) {
        if (Array.isArray(searchParams.tags)) {
          searchParams.tags = searchParams.tags.join(',');
        }
      }

      // Log the search params for debugging
      console.log('Searching tutorials with params:', searchParams);

      // Build request with proper parameters
      const response = await axios.get(`${API_URL}/tutorials/search`, {
        params: searchParams
      });
      
      console.log('Search response:', response.data.length, 'results');
      return response.data;
    } catch (error) {
      console.error('Error searching tutorials:', error);
      throw error;
    }
  },
  
  /**
   * Get tutorials by author (requires auth token)
   */
  getByAuthor: async (authorId: string): Promise<Tutorial[]> => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('Authentication token not found. Please log in again.');
      }
      
      const response = await axios.get(`${API_URL}/tutorials/author/${authorId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      return response.data;
    } catch (error) {
      console.error(`Error fetching tutorials by author ${authorId}:`, error);
      throw error;
    }
  },

  /**
   * Get draft tutorials (unpublished) for the current user or all if admin
   */
  getDrafts: async (): Promise<Tutorial[]> => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('Authentication token not found. Please log in again.');
      }
      
      const response = await axios.get(`${API_URL}/tutorials/drafts`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      return response.data;
    } catch (error) {
      console.error('Error fetching draft tutorials:', error);
      throw error;
    }
  },
};

export default tutorialService; 