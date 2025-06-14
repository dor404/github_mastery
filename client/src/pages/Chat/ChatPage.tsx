import React from 'react';
import { Container, Typography, Box } from '@mui/material';
import { Chat } from '../../components/Chat';

const ChatPage: React.FC = () => {
    return (
        <Container maxWidth="lg">
            <Box sx={{ py: 4 }}>
                <Typography variant="h4" component="h1" gutterBottom align="center">
                    AI Assistant
                </Typography>
                <Typography variant="body1" gutterBottom align="center" sx={{ mb: 4 }}>
                    Chat with our AI assistant to get help with your questions
                </Typography>
                <Chat />
            </Box>
        </Container>
    );
};

export default ChatPage; 