const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chat.controller');

// POST /api/chat - Send a message to the chatbot
router.post('/', chatController.handleChat.bind(chatController));

module.exports = router; 