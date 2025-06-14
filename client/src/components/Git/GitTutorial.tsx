import React from 'react';
import GitGraphVisualizer from './GitGraphVisualizer';
import { Box, Container, Typography, Paper } from '@mui/material';

const GitTutorial: React.FC = () => {
  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        <Paper 
          sx={{ 
            p: 4, 
            backgroundColor: '#161b22',
            color: '#e6edf3',
            borderRadius: 2,
            border: '1px solid #30363d'
          }}
        >
          <Typography variant="h4" component="h1" gutterBottom>
            Git Branching Tutorial
          </Typography>
          <Typography variant="body1" sx={{ mb: 3, color: '#8b949e' }}>
            This interactive tutorial will help you understand Git branching and merging.
            Try the following exercises:
          </Typography>
          <Box component="ol" sx={{ mb: 4, color: '#8b949e' }}>
            <li>Create a new branch called "feature"</li>
            <li>Make some commits on the feature branch</li>
            <li>Switch back to main and make a commit</li>
            <li>Merge the feature branch into main</li>
          </Box>
          
          {/* Git Graph Visualization */}
          <Box sx={{ 
            mt: 4, 
            p: 3, 
            backgroundColor: '#0d1117',
            borderRadius: 2,
            border: '1px solid #30363d'
          }}>
            <GitGraphVisualizer initialBranch="main" />
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default GitTutorial; 