import axios from 'axios';
import { Quiz, QuizQuestion, QuizSubmission, QuizResult } from '../types/quiz';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

// Helper to get the auth token
const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

/**
 * Service for handling quiz operations
 */
const quizService = {
  /**
   * Get all quizzes
   */
  async getQuizzes(): Promise<Quiz[]> {
    try {
      const response = await axios.get(`${API_URL}/quizzes`);
      return response.data;
    } catch (error) {
      console.error('Error fetching quizzes:', error);
      throw error;
    }
  },

  /**
   * Get a specific quiz by ID
   */
  async getQuiz(quizId: string): Promise<Quiz> {
    try {
      const response = await axios.get(`${API_URL}/quizzes/${quizId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching quiz ${quizId}:`, error);
      throw error;
    }
  },

  /**
   * Create a new quiz
   */
  async createQuiz(quizData: Quiz): Promise<Quiz> {
    try {
      const response = await axios.post(
        `${API_URL}/quizzes`,
        quizData,
        { headers: getAuthHeader() }
      );
      return response.data;
    } catch (error) {
      console.error('Error creating quiz:', error);
      throw error;
    }
  },

  /**
   * Update an existing quiz
   */
  async updateQuiz(quizId: string, quizData: Quiz): Promise<Quiz> {
    try {
      const response = await axios.put(
        `${API_URL}/quizzes/${quizId}`,
        quizData,
        { headers: getAuthHeader() }
      );
      return response.data;
    } catch (error) {
      console.error(`Error updating quiz ${quizId}:`, error);
      throw error;
    }
  },

  /**
   * Delete a quiz by ID
   */
  async deleteQuiz(quizId: string): Promise<void> {
    try {
      await axios.delete(
        `${API_URL}/quizzes/${quizId}`,
        { headers: getAuthHeader() }
      );
    } catch (error) {
      console.error(`Error deleting quiz ${quizId}:`, error);
      throw error;
    }
  },

  /**
   * Start a quiz attempt - tracks when a user starts a quiz
   */
  async startQuizAttempt(quizId: string, userId: string): Promise<QuizSubmission> {
    try {
      const response = await axios.post(
        `${API_URL}/quizzes/quiz-attempts/start`,
        { quizId, userId },
        { headers: getAuthHeader() }
      );
      return response.data;
    } catch (error) {
      console.error('Error starting quiz attempt:', error);
      throw error;
    }
  },

  /**
   * Calculate score for a quiz submission
   * Now uses custom point values instead of equal weighting
   */
  calculateScore(quiz: Quiz, submission: QuizSubmission): { score: number; earnedPoints: number; totalPoints: number } {
    if (!quiz || !submission || !submission.answers || !quiz.questions) {
      return { score: 0, earnedPoints: 0, totalPoints: 0 };
    }
    
    let earnedPoints = 0;
    let totalPoints = 0;
    
    // Calculate total possible points
    quiz.questions.forEach(question => {
      totalPoints += question.points || 1;
    });
    
    // For each answer in the submission
    submission.answers.forEach(answer => {
      // Find the corresponding question
      const question = quiz.questions.find(q => q.id === answer.questionId);
      if (!question) return;
      
      const correctOptionIds = question.options
        .filter(o => o.isCorrect)
        .map(o => o.id);
      
      const questionPoints = question.points || 1;
      let questionCorrect = false;
      
      // For single choice questions
      if (question.type === 'single') {
        if (answer.selectedOptions.length === 1 && 
            correctOptionIds.includes(answer.selectedOptions[0])) {
          questionCorrect = true;
        }
      } 
      // For multiple choice questions
      else if (question.type === 'multiple') {
        // All correct options must be selected and no incorrect ones
        const allCorrectSelected = correctOptionIds.every(id => 
          answer.selectedOptions.includes(id));
        
        const noIncorrectSelected = answer.selectedOptions.every(id => 
          correctOptionIds.includes(id));
        
        if (allCorrectSelected && noIncorrectSelected) {
          questionCorrect = true;
        }
      }
      
      if (questionCorrect) {
        earnedPoints += questionPoints;
      }
    });
    
    const score = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;
    
    return { score, earnedPoints, totalPoints };
  },

  /**
   * Submit a quiz attempt
   */
  async submitQuiz(quiz: Quiz, submission: QuizSubmission): Promise<QuizResult> {
    try {
      // Calculate score using new point-based system
      const { score, earnedPoints, totalPoints } = this.calculateScore(quiz, submission);
      
      // Update submission with completion info
      const completedSubmission: QuizSubmission = {
        ...submission,
        completed: true,
        score,
        submittedAt: new Date()
      };
      
      // Submit to the server
      const response = await axios.post(
        `${API_URL}/quizzes/quiz-submissions`,
        {
          ...completedSubmission,
          earnedPoints,
          totalPoints
        },
        { headers: getAuthHeader() }
      );
      return response.data;
    } catch (error) {
      console.error('Error submitting quiz:', error);
      throw error;
    }
  },

  /**
   * Get quiz results for a user
   */
  async getQuizResults(userId: string): Promise<QuizResult[]> {
    try {
      const response = await axios.get(
        `${API_URL}/quizzes/users/${userId}/quiz-results`,
        { headers: getAuthHeader() }
      );
      return response.data;
    } catch (error) {
      console.error(`Error fetching quiz results for user ${userId}:`, error);
      throw error;
    }
  },
  
  /**
   * Get all quiz results (admin/lecturer only)
   */
  async getAllQuizResults(): Promise<QuizResult[]> {
    try {
      const response = await axios.get(
        `${API_URL}/quizzes/all-results`,
        { headers: getAuthHeader() }
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching all quiz results:', error);
      throw error;
    }
  },
  
  /**
   * Get quiz attempts for a user
   */
  async getQuizAttempts(userId: string, quizId?: string): Promise<QuizSubmission[]> {
    try {
      const url = quizId 
        ? `${API_URL}/quizzes/users/${userId}/quiz-attempts?quizId=${quizId}`
        : `${API_URL}/quizzes/users/${userId}/quiz-attempts`;
      
      const response = await axios.get(
        url,
        { headers: getAuthHeader() }
      );
      return response.data;
    } catch (error) {
      console.error(`Error fetching quiz attempts for user ${userId}:`, error);
      throw error;
    }
  }
};

export default quizService; 