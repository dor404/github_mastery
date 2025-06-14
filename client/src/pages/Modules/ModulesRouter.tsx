import React from 'react';
import { Routes, Route } from 'react-router-dom';
import ModuleMenu from './ModuleMenu';
import CreateModule from '../../components/Tutorials/CreateModule';
import ExerciseList from '../../components/Training/ExerciseList';
import ProtectedRoute from '../../components/Auth/ProtectedRoute';
import ExerciseViewer from '../../components/Training/ExerciseViewer';
import EditModulePage from './EditModulePage';
import DeleteModulePage from './DeleteModulePage';
import SearchModulePage from './SearchModulePage';
import DraftsPage from './DraftsPage';

/**
 * Module Router
 * Routes between different module management pages
 */
const ModulesRouter: React.FC = () => {
  return (
    <Routes>
      <Route index element={<ModuleMenu />} />
      
      {/* Create Module */}
      <Route path="create" element={
        <ProtectedRoute>
          <CreateModule />
        </ProtectedRoute>
      } />
      
      {/* View Drafts */}
      <Route path="drafts" element={
        <ProtectedRoute>
          <DraftsPage />
        </ProtectedRoute>
      } />
      
      {/* Edit Modules */}
      <Route path="edit" element={
        <ProtectedRoute>
          <EditModulePage />
        </ProtectedRoute>
      } />
      
      {/* Edit Specific Module */}
      <Route path="edit/:moduleId" element={
        <ProtectedRoute>
          <CreateModule />
        </ProtectedRoute>
      } />
      
      {/* Delete Modules */}
      <Route path="delete" element={
        <ProtectedRoute>
          <DeleteModulePage />
        </ProtectedRoute>
      } />
      
      {/* Search Modules */}
      <Route path="search" element={
        <ProtectedRoute>
          <SearchModulePage />
        </ProtectedRoute>
      } />
      
      {/* Manage Modules */}
      <Route path="manage" element={
        <ProtectedRoute>
          <ModuleMenu />
        </ProtectedRoute>
      } />
      
      {/* View Modules */}
      <Route path="view" element={
        <ProtectedRoute>
          <ExerciseList />
        </ProtectedRoute>
      } />
      
      {/* View Specific Module (for lecturers to view even unpublished) */}
      <Route path="view/:moduleId" element={
        <ProtectedRoute>
          <ExerciseViewer />
        </ProtectedRoute>
      } />
    </Routes>
  );
};

export default ModulesRouter; 