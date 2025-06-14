const OpenAI = require('openai');
const openaiConfig = require('../config/openai.config');
const fetch = require('node-fetch');

class OpenAIService {
    constructor() {
        this.openai = new OpenAI({
            apiKey: openaiConfig.apiKey,
            fetch: fetch
        });
    }

    async generateChatResponse(message, conversationHistory = []) {
        try {
            const messages = [
                ...conversationHistory,
                { role: 'user', content: message }
            ];

            const completion = await this.openai.chat.completions.create({
                messages: messages,
                model: openaiConfig.model,
                max_tokens: openaiConfig.maxTokens,
                temperature: openaiConfig.temperature,
            });

            return {
                success: true,
                response: completion.choices[0].message.content,
                usage: completion.usage
            };
        } catch (error) {
            console.error('OpenAI API Error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
}

module.exports = new OpenAIService(); 