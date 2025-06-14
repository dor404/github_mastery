import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home/Home';
import { Login, Register } from './pages/Auth';
import LearningHub from './components/Learning/LearningHub';
import ExerciseList from './components/Training/ExerciseList';
import ExerciseViewer from './components/Training/ExerciseViewer';
import ProtectedRoute from './components/Auth/ProtectedRoute';
import AdminRoute from './components/Auth/AdminRoute';
import LecturerRoute from './components/Auth/LecturerRoute';
import ResetPassword from './components/Auth/ResetPassword';
import AdminDashboard from './components/Admin/AdminDashboard';
import ClassMonitoring from './components/Admin/ClassMonitoring';
import AboutUs from './pages/AboutUs';
import PrivacyPolicy from './pages/PrivacyPolicy/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService/TermsOfService';
import { UserProfile } from './pages/Profile';
import { Leaderboard } from './pages/Leaderboard';
import ModulesRouter from './pages/Modules/ModulesRouter';
import ExerciseManagement from './components/Training/Management/ExerciseManagement';
import ExerciseEditor from './components/Training/Management/ExerciseEditor';
import TutorialList from './components/Tutorials/TutorialList';
import TutorialViewer from './components/Tutorials/TutorialViewer';
import QuizzesRouter from './pages/Quizzes/QuizzesRouter';
import ChatPage from './pages/Chat/ChatPage';
import Dashboard from './pages/Dashboard';
import CompletionViewer from './components/Dashboard/CompletionViewer';
import MyAchievements from './components/Badges/MyAchievements';
import GitTutorial from './components/Git/GitTutorial';

const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/reset-password/:token" element={<ResetPassword />} />
      <Route path="/about" element={<AboutUs />} />
      <Route path="/privacy" element={<PrivacyPolicy />} />
      <Route path="/terms" element={<TermsOfService />} />
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      } />
      <Route path="/completion" element={
        <ProtectedRoute>
          <CompletionViewer />
        </ProtectedRoute>
      } />
      <Route path="/chat" element={
        <ProtectedRoute>
          <ChatPage />
        </ProtectedRoute>
      } />
      <Route path="/profile" element={
        <ProtectedRoute>
          <UserProfile />
        </ProtectedRoute>
      } />
      <Route path="/achievements" element={
        <ProtectedRoute>
          <MyAchievements />
        </ProtectedRoute>
      } />
      <Route path="/leaderboard" element={
        <ProtectedRoute>
          <Leaderboard />
        </ProtectedRoute>
      } />
      <Route path="/learn" element={
        <ProtectedRoute>
          <LearningHub />
        </ProtectedRoute>
      } />
      <Route path="/training" element={
        <ProtectedRoute>
          <ExerciseList />
        </ProtectedRoute>
      } />
      <Route path="/training/:exerciseId" element={
        <ProtectedRoute>
          <ExerciseViewer />
        </ProtectedRoute>
      } />
      <Route path="/modules/*" element={
        <ProtectedRoute>
          <ModulesRouter />
        </ProtectedRoute>
      } />
      <Route path="/quizzes/*" element={
        <ProtectedRoute>
          <QuizzesRouter />
        </ProtectedRoute>
      } />
      <Route path="/git-visualization" element={
        <ProtectedRoute>
          <GitTutorial />
        </ProtectedRoute>
      } />
      <Route path="/admin" element={
        <AdminRoute>
          <AdminDashboard />
        </AdminRoute>
      } />
      <Route path="/class-monitoring" element={
        <LecturerRoute>
          <ClassMonitoring />
        </LecturerRoute>
      } />
      
      {/* Tutorial Routes for Students */}
      <Route path="/tutorials" element={
        <ProtectedRoute>
          <TutorialList />
        </ProtectedRoute>
      } />
      <Route path="/tutorials/view/:tutorialId" element={
        <ProtectedRoute>
          <TutorialViewer />
        </ProtectedRoute>
      } />
      
      {/* Exercise Management Routes for Lecturers */}
      <Route path="/exercises/manage" element={
        <LecturerRoute>
          <ExerciseManagement />
        </LecturerRoute>
      } />
      <Route path="/exercises/create" element={
        <LecturerRoute>
          <ExerciseEditor isNewExercise={true} />
        </LecturerRoute>
      } />
      <Route path="/exercises/edit/:exerciseId" element={
        <LecturerRoute>
          <ExerciseEditor isNewExercise={false} />
        </LecturerRoute>
      } />
      <Route path="/exercises/:exerciseId/tasks/create" element={
        <LecturerRoute>
          <ExerciseEditor isTaskMode={true} isNewTask={true} />
        </LecturerRoute>
      } />
      <Route path="/exercises/:exerciseId/tasks/edit/:taskId" element={
        <LecturerRoute>
          <ExerciseEditor isTaskMode={true} isNewTask={false} />
        </LecturerRoute>
      } />
    </Routes>
  );
};

export default AppRoutes; 