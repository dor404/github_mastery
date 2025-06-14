import React from 'react';
import { Box, Typography, Paper } from '@mui/material';
import { ChatMessage as ChatMessageType } from '../../services/chat.service';

interface ChatMessageProps {
    message: ChatMessageType;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
    const isUser = message.role === 'user';

    return (
        <Box
            sx={{
                display: 'flex',
                justifyContent: isUser ? 'flex-end' : 'flex-start',
                mb: 2
            }}
        >
            <Paper
                elevation={1}
                sx={{
                    p: 2,
                    maxWidth: '70%',
                    backgroundColor: isUser ? 'primary.main' : 'background.paper',
                    color: isUser ? 'white' : 'text.primary',
                    borderRadius: 2,
                }}
            >
                <Typography variant="body1">
                    {message.content}
                </Typography>
            </Paper>
        </Box>
    );
} 