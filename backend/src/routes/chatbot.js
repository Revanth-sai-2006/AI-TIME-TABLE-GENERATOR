const express = require('express');
const router = express.Router();
const { chatbot } = require('../controllers/chatbotController');
const { protect } = require('../middleware/auth');

// POST /api/chatbot/message  — auth required so we can pull user context
router.post('/message', protect, chatbot);

module.exports = router;
