import React from 'react';
import { Button } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const CreateModuleButton: React.FC = () => {
  const navigate = useNavigate();

  const handleCreateModule = () => {
    navigate('/modules/create');
  };

  return (
    <Button
      variant="contained"
      startIcon={<AddIcon />}
      onClick={handleCreateModule}
      sx={{
        backgroundColor: '#f05133',
        color: 'white',
        fontWeight: 500,
        textTransform: 'none',
        borderRadius: '4px',
        padding: '8px 16px',
        '&:hover': { 
          backgroundColor: '#d03b1f' 
        },
      }}
    >
      Create New Module
    </Button>
  );
};

export default CreateModuleButton; 