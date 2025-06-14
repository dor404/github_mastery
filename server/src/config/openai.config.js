const dotenv = require('dotenv');
dotenv.config();

const openaiConfig = {
    apiKey: process.env.OPENAI_API_KEY,
    model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
    maxTokens: 1000,
    temperature: 0.7,
};

module.exports = openaiConfig; 