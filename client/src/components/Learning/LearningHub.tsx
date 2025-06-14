import React from 'react';
import { Grid, Container, Typography, Box } from '@mui/material';
import {
  School as TutorialIcon,
  Assignment as ExerciseIcon,
  SmartToy as AIIcon,
} from '@mui/icons-material';
import GuidedButton from '../Common/GuidedButton';

const LearningHub: React.FC = () => {
  return (
    <Container maxWidth="lg" sx={{ py: 6 }}>
      <Typography variant="h4" gutterBottom align="center" sx={{ mb: 4 }}>
        Start Your Git Learning Journey
      </Typography>
      
      <Grid container spacing={4}>
        <Grid item xs={12} md={4}>
          <GuidedButton
            title="Tutorials"
            description="Step-by-step guides with interactive visualizations to master Git concepts"
            path="/modules"
            icon={<TutorialIcon />}
          />
        </Grid>

        <Grid item xs={12} md={4}>
          <GuidedButton
            title="Practice Exercises"
            description="Hands-on exercises to reinforce your Git skills with real-world scenarios"
            path="/exercises"
            icon={<ExerciseIcon />}
          />
        </Grid>

        <Grid item xs={12} md={4}>
          <GuidedButton
            title="AI Assistant"
            description="Get personalized help and explanations for Git commands and workflows"
            path="/assistant"
            icon={<AIIcon />}
          />
        </Grid>
      </Grid>

      <Box sx={{ mt: 6, textAlign: 'center' }}>
        <Typography variant="body1" color="text.secondary">
          Our interactive learning platform helps you master Git through practical experience.
          Start with tutorials, practice with exercises, and get help from our AI assistant when needed.
        </Typography>
      </Box>
    </Container>
  );
};

export default LearningHub; 