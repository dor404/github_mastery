import React from 'react';
import { Box, Tooltip } from '@mui/material';
import StarIcon from '@mui/icons-material/Star';
import StarBorderIcon from '@mui/icons-material/StarBorder';

interface DifficultyStarsProps {
  difficulty: 'beginner' | 'elementary' | 'intermediate' | 'advanced' | 'expert' | number;
  size?: 'small' | 'medium' | 'large';
  readOnly?: boolean;
  onChange?: (value: number) => void;
}

/**
 * Converts traditional difficulty levels to a star rating (1-5)
 */
export const difficultyToStars = (difficulty: string | number): number => {
  if (typeof difficulty === 'number') {
    return difficulty;
  }
  
  switch (difficulty) {
    case 'beginner': return 1;
    case 'elementary': return 2;
    case 'intermediate': return 3;
    case 'advanced': return 4;
    case 'expert': return 5;
    default: return 1;
  }
};

/**
 * Converts star rating (1-5) to traditional difficulty levels
 */
export const starsToDifficulty = (stars: number): 'beginner' | 'elementary' | 'intermediate' | 'advanced' | 'expert' => {
  switch (stars) {
    case 1: return 'beginner';
    case 2: return 'elementary';
    case 3: return 'intermediate';
    case 4: return 'advanced';
    case 5: return 'expert';
    default: return 'beginner';
  }
};

/**
 * Returns the appropriate color for a difficulty level
 */
export const getStarColor = (difficulty: string | number): string => {
  const stars = typeof difficulty === 'number' ? difficulty : difficultyToStars(difficulty);
  
  switch (stars) {
    case 1: return '#4caf50'; // green - beginner
    case 2: return '#8bc34a'; // light green - elementary
    case 3: return '#ffc107'; // amber - intermediate
    case 4: return '#ff9800'; // orange - advanced
    case 5: return '#f44336'; // red - expert
    default: return '#4caf50';
  }
};

/**
 * A component to display difficulty as stars with optional interaction
 */
const DifficultyStars: React.FC<DifficultyStarsProps> = ({ 
  difficulty, 
  size = 'medium',
  readOnly = true,
  onChange
}) => {
  const starCount = 5;
  const filledStars = typeof difficulty === 'number' ? difficulty : difficultyToStars(difficulty);
  
  // Determine label text based on difficulty
  let labelText: string;
  
  switch (filledStars) {
    case 1: labelText = 'Beginner'; break;
    case 2: labelText = 'Elementary'; break;
    case 3: labelText = 'Intermediate'; break;
    case 4: labelText = 'Advanced'; break;
    case 5: labelText = 'Expert'; break;
    default: labelText = 'Beginner';
  }
  
  // Determine icon size
  const iconSize = size === 'small' ? 'small' : size === 'large' ? 'large' : 'medium';
  
  // Determine color based on difficulty
  const color = getStarColor(difficulty);
  
  const handleStarClick = (index: number) => {
    if (!readOnly && onChange) {
      onChange(index + 1);
    }
  };
  
  return (
    <Tooltip title={labelText} placement="top">
      <Box 
        sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          cursor: readOnly ? 'default' : 'pointer'
        }}
      >
        {[...Array(starCount)].map((_, index) => (
          <Box 
            key={index} 
            onClick={() => handleStarClick(index)}
            sx={{ 
              transition: 'transform 0.2s ease-in-out',
              '&:hover': {
                transform: !readOnly ? 'scale(1.2)' : 'none',
              },
              mx: 0.25 // Add spacing between stars
            }}
          >
            {index < filledStars ? (
              <StarIcon 
                fontSize={iconSize} 
                sx={{ 
                  color,
                  filter: 'drop-shadow(0px 1px 1px rgba(0,0,0,0.2))',
                }} 
              />
            ) : (
              <StarBorderIcon 
                fontSize={iconSize} 
                sx={{ 
                  color: 'text.disabled',
                  opacity: 0.7
                }} 
              />
            )}
          </Box>
        ))}
      </Box>
    </Tooltip>
  );
};

export default DifficultyStars; 