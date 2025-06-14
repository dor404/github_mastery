import React, { useState, useRef, useEffect } from 'react';
import {
    Box,
    TextField,
    IconButton,
    Paper,
    CircularProgress,
    Typography,
    ToggleButton,
    ToggleButtonGroup,
    Chip,
    Alert
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import ChatIcon from '@mui/icons-material/Chat';
import BugReportIcon from '@mui/icons-material/BugReport';
import SchoolIcon from '@mui/icons-material/School';
import { ChatMessage } from './ChatMessage';
import { chatService, ChatMessage as ChatMessageType } from '../../services/chat.service';

const COMMON_GIT_ERRORS = [
    "fatal: not a git repository",
    "error: failed to push some refs", 
    "merge conflict",
    "fatal: remote origin already exists",
    "error: src refspec main does not match any"
];

const COMMON_LEARNING_TOPICS = [
    "Git basics and fundamentals",
    "Branching and merging",
    "Pull requests and collaboration",
    "Advanced Git workflows",
    "GitHub features and tools"
];

type ChatMode = 'general' | 'git-error' | 'learning-modules';

export const Chat: React.FC = () => {
    const [messages, setMessages] = useState<ChatMessageType[]>([]);
    const [inputMessage, setInputMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [chatMode, setChatMode] = useState<ChatMode>('general');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        // Add initial message when switching modes
        if (chatMode === 'git-error') {
            const welcomeMessage: ChatMessageType = {
                role: 'assistant',
                content: `Hi! I'm your Git Error Helper 🐛\n\nPaste your Git error message below, and I'll help you understand what went wrong and how to fix it. You can also click on one of the common errors below for quick help!`
            };
            setMessages([welcomeMessage]);
        } else if (chatMode === 'learning-modules') {
            const welcomeMessage: ChatMessageType = {
                role: 'assistant',
                content: `Hi! I'm your Learning Modules Assistant 📚\n\nAsk me any Git-related question, and I'll suggest relevant learning modules and tutorials to help you learn more! You can also click on the common topics below to get started.`
            };
            setMessages([welcomeMessage]);
        } else if (chatMode === 'general') {
            // Clear messages when switching to general mode
            setMessages([]);
        }
    }, [chatMode]);

    const handleSend = async (messageText?: string) => {
        const messageToSend = messageText || inputMessage.trim();
        if (!messageToSend) return;

        const newMessage: ChatMessageType = {
            role: 'user',
            content: messageToSend
        };

        setMessages(prev => [...prev, newMessage]);
        setInputMessage('');
        setIsLoading(true);
        setError(null);

        try {
            let conversationHistory = messages;

            // Add specialized system prompts based on mode
            if (chatMode === 'git-error') {
                const systemPrompt: ChatMessageType = {
                    role: 'system',
                    content: `You are a Git expert assistant specialized in explaining Git and GitHub errors. When a user provides an error message:

1. First, explain what the error means in simple terms
2. Identify the most likely cause(s)
3. Provide step-by-step solutions with clear Git commands
4. Include explanations for each command
5. Suggest preventive measures if applicable
6. Keep explanations beginner-friendly but accurate

Focus specifically on Git/GitHub related issues. If the question isn't Git-related, politely redirect to Git topics.`
                };

                conversationHistory = [
                    systemPrompt,
                    ...messages.filter(msg => msg.role !== 'system'),
                ];
            } else if (chatMode === 'learning-modules') {
                const systemPrompt: ChatMessageType = {
                    role: 'system',
                    content: `You are a Learning Modules Assistant that helps students find relevant learning resources. 

Available learning modules on this platform:
- "Git Basics" - covers Git fundamentals, version control concepts, basic commands
- "Branching and Merging" - covers creating branches, switching branches, merging strategies
- "Advanced Merging Strategies" - covers complex merge scenarios, conflict resolution, advanced techniques
- "Git Flow & Advanced Workflows" - covers Git Flow workflow, team collaboration, advanced Git patterns

When a user asks a question:

1. If their question relates to topics covered by our modules, recommend the specific relevant module(s) and direct them to browse /tutorials to find it
2. If their question is about topics NOT covered by our modules, provide helpful external links:
   - Official Git documentation: https://git-scm.com/doc
   - GitHub documentation: https://docs.github.com
   - Git tutorial resources: https://learngitbranching.js.org
   - For specific commands: https://git-scm.com/docs/[command-name]

3. Always be clear about whether we have a module on the topic or if they should look elsewhere
4. For topics we cover: "Check out our '[Module Name]' module in the tutorials section"
5. For topics we don't cover: "We don't have a specific module on this topic, but you can learn more at [external link]"`
                };

                conversationHistory = [
                    systemPrompt,
                    ...messages.filter(msg => msg.role !== 'system'),
                ];
            }

            const response = await chatService.sendMessage(
                messageToSend,
                conversationHistory
            );

            if (response.success) {
                const assistantMessage: ChatMessageType = {
                    role: 'assistant',
                    content: response.response
                };
                setMessages(prev => [...prev, assistantMessage]);
            } else {
                setError(response.error || 'Failed to get response');
            }
        } catch (err) {
            setError('Failed to send message');
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyPress = (event: React.KeyboardEvent) => {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            handleSend();
        }
    };

    const handleModeChange = (event: React.MouseEvent<HTMLElement>, newMode: ChatMode | null) => {
        if (newMode !== null) {
            setChatMode(newMode);
        }
    };

    const handleCommonErrorClick = (errorText: string) => {
        handleSend(`I'm getting this Git error: ${errorText}`);
    };

    const handleCommonTopicClick = (topic: string) => {
        handleSend(`I want to learn about: ${topic}`);
    };

    return (
        <Paper
            elevation={3}
            sx={{
                height: '600px',
                maxWidth: '800px',
                margin: 'auto',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden'
            }}
        >
            {/* Header with Mode Toggle */}
            <Box
                sx={{
                    p: 2,
                    backgroundColor: chatMode === 'git-error' ? 'error.main' : chatMode === 'learning-modules' ? 'success.main' : 'primary.main',
                    color: 'white',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center'
                }}
            >
                <ToggleButtonGroup
                    value={chatMode}
                    exclusive
                    onChange={handleModeChange}
                    aria-label="chat mode"
                    sx={{
                        '& .MuiToggleButton-root': {
                            color: 'white',
                            borderColor: 'rgba(255, 255, 255, 0.3)',
                            fontSize: '0.875rem',
                            '&.Mui-selected': {
                                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                                color: 'white',
                            }
                        }
                    }}
                >
                    <ToggleButton value="general" aria-label="general chat">
                        <ChatIcon sx={{ mr: 1 }} />
                        General Chat
                    </ToggleButton>
                    <ToggleButton value="git-error" aria-label="git error help">
                        <BugReportIcon sx={{ mr: 1 }} />
                        Error Helper
                    </ToggleButton>
                    <ToggleButton value="learning-modules" aria-label="learning modules">
                        <SchoolIcon sx={{ mr: 1 }} />
                        Module Finder
                    </ToggleButton>
                </ToggleButtonGroup>
            </Box>

            {/* Common Errors Section */}
            {chatMode === 'git-error' && messages.length <= 1 && (
                <Box sx={{ p: 2, backgroundColor: 'background.default', borderBottom: 1, borderColor: 'divider' }}>
                    <Typography variant="subtitle2" gutterBottom>
                        Common Git Errors (click for quick help):
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {COMMON_GIT_ERRORS.map((errorText, index) => (
                            <Chip
                                key={index}
                                label={errorText}
                                onClick={() => handleCommonErrorClick(errorText)}
                                variant="outlined"
                                size="small"
                                sx={{ cursor: 'pointer' }}
                            />
                        ))}
                    </Box>
                </Box>
            )}

            {/* Common Learning Topics Section */}
            {chatMode === 'learning-modules' && messages.length <= 1 && (
                <Box sx={{ p: 2, backgroundColor: 'background.default', borderBottom: 1, borderColor: 'divider' }}>
                    <Typography variant="subtitle2" gutterBottom>
                        Popular Learning Topics (click to explore):
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {COMMON_LEARNING_TOPICS.map((topic, index) => (
                            <Chip
                                key={index}
                                label={topic}
                                onClick={() => handleCommonTopicClick(topic)}
                                variant="outlined"
                                size="small"
                                color="success"
                                sx={{ cursor: 'pointer' }}
                            />
                        ))}
                    </Box>
                </Box>
            )}

            <Box
                sx={{
                    flex: 1,
                    overflow: 'auto',
                    p: 2,
                    backgroundColor: 'background.default'
                }}
            >
                {messages.map((message, index) => (
                    <ChatMessage key={index} message={message} />
                ))}
                {error && (
                    <Alert severity="error" sx={{ mt: 2 }}>
                        {error}
                    </Alert>
                )}
                <div ref={messagesEndRef} />
            </Box>

            <Box
                sx={{
                    p: 2,
                    backgroundColor: 'background.paper',
                    borderTop: 1,
                    borderColor: 'divider'
                }}
            >
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <TextField
                        fullWidth
                        multiline
                        maxRows={4}
                        value={inputMessage}
                        onChange={(e) => setInputMessage(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder={
                            chatMode === 'git-error' ? "Paste your Git error message here..." :
                            chatMode === 'learning-modules' ? "Ask me what you'd like to learn about Git..." :
                            "Type your message..."
                        }
                        disabled={isLoading}
                        sx={{ backgroundColor: 'background.paper' }}
                    />
                    <IconButton
                        color="primary"
                        onClick={() => handleSend()}
                        disabled={isLoading || !inputMessage.trim()}
                    >
                        {isLoading ? (
                            <CircularProgress size={24} />
                        ) : (
                            <SendIcon />
                        )}
                    </IconButton>
                </Box>
            </Box>
        </Paper>
    );
}; 