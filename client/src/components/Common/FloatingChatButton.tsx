import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Fab, Tooltip, Box } from '@mui/material';
import ChatIcon from '@mui/icons-material/Chat';

export const FloatingChatButton: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();

    // Hide the button on tutorial view pages
    if (location.pathname.includes('/tutorials/view/')) {
        return null;
    }

    return (
        <Box
            sx={{
                position: 'fixed',
                bottom: 82,
                right: 32,
                zIndex: 999, // Lower z-index to prevent overlap with tutorial content
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 1,
                pointerEvents: 'auto' // Ensure clicks are registered
            }}
        >
            <Tooltip 
                title="If you need help, chat with me!"
                placement="left"
                arrow
            >
                <Fab
                    color="primary"
                    onClick={() => navigate('/chat')}
                    sx={{
                        width: 64,
                        height: 64,
                        '&:hover': {
                            transform: 'scale(1.1)',
                            transition: 'transform 0.2s'
                        }
                    }}
                >
                    <ChatIcon sx={{ fontSize: 32 }} />
                </Fab>
            </Tooltip>
        </Box>
    );
}; 