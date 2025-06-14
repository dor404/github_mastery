import React from 'react';
import { Routes, Route } from 'react-router-dom';
import QuizMenu from './QuizMenu';
import CreateQuiz from './CreateQuiz';
import StudentQuizzes from './StudentQuizzes';
import QuizViewer from './QuizViewer';
import QuizResults from './QuizResults';
import EditQuizzes from './EditQuizzes';
import EditQuiz from './EditQuiz';
import DeleteQuizzes from './DeleteQuizzes';
import AdminQuizResults from './AdminQuizResults';
import StudentQuizResultsView from './StudentQuizResultsView';
import ProtectedRoute from '../../components/Auth/ProtectedRoute';
import LecturerRoute from '../../components/Auth/LecturerRoute';

/**
 * Quizzes Router
 * Routes between different quiz management pages
 */
const QuizzesRouter: React.FC = () => {
  return (
    <Routes>
      {/* Main quiz listing for students */}
      <Route index element={
        <ProtectedRoute>
          <StudentQuizzes />
        </ProtectedRoute>
      } />
      
      {/* Quiz Management for lecturers/admins */}
      <Route path="manage" element={
        <LecturerRoute>
          <QuizMenu />
        </LecturerRoute>
      } />
      
      {/* Create a new Quiz (lecturers/admins only) */}
      <Route path="create" element={
        <LecturerRoute>
          <CreateQuiz />
        </LecturerRoute>
      } />
      
      {/* Edit Quizzes list (lecturers/admins only) */}
      <Route path="edit" element={
        <LecturerRoute>
          <EditQuizzes />
        </LecturerRoute>
      } />
      
      {/* Edit a specific Quiz (lecturers/admins only) */}
      <Route path="edit/:quizId" element={
        <LecturerRoute>
          <EditQuiz />
        </LecturerRoute>
      } />
      
      {/* Delete Quizzes (lecturers/admins only) */}
      <Route path="delete" element={
        <LecturerRoute>
          <DeleteQuizzes />
        </LecturerRoute>
      } />
      
      {/* View all student quiz results (lecturers/admins only) */}
      <Route path="all-results" element={
        <LecturerRoute>
          <AdminQuizResults />
        </LecturerRoute>
      } />

      {/* View specific student quiz results (lecturers/admins only) */}
      <Route path="student-results/:studentId/:studentName" element={
        <LecturerRoute>
          <StudentQuizResultsView />
        </LecturerRoute>
      } />
      
      {/* Take a specific quiz */}
      <Route path=":quizId" element={
        <ProtectedRoute>
          <QuizViewer />
        </ProtectedRoute>
      } />
      
      {/* View quiz results */}
      <Route path="results" element={
        <ProtectedRoute>
          <QuizResults />
        </ProtectedRoute>
      } />
      
      {/* Future routes for quiz editing, deleting, etc. will be added here */}
    </Routes>
  );
};

export default QuizzesRouter; 