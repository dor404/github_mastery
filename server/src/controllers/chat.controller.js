const openaiService = require('../services/openai.service');

class ChatController {
    async handleChat(req, res) {
        try {
            const { message, conversationHistory } = req.body;

            if (!message) {
                return res.status(400).json({
                    success: false,
                    error: 'Message is required'
                });
            }

            const response = await openaiService.generateChatResponse(message, conversationHistory);

            if (!response.success) {
                return res.status(500).json(response);
            }

            return res.status(200).json(response);
        } catch (error) {
            console.error('Chat Controller Error:', error);
            return res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }
}

module.exports = new ChatController(); 