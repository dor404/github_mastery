import axios from 'axios';

export interface ChatMessage {
    role: 'user' | 'assistant' | 'system';
    content: string;
}

export interface ChatResponse {
    success: boolean;
    response: string;
    error?: string;
    usage?: {
        prompt_tokens: number;
        completion_tokens: number;
        total_tokens: number;
    };
}

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

export const chatService = {
    async sendMessage(message: string, conversationHistory: ChatMessage[] = []): Promise<ChatResponse> {
        try {
            const response = await axios.post(`${API_URL}/chat`, {
                message,
                conversationHistory
            });
            return response.data;
        } catch (error: any) {
            return {
                success: false,
                response: '',
                error: error.response?.data?.error || 'Failed to send message'
            };
        }
    }
}; 