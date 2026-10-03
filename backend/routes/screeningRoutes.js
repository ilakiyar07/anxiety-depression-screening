const express = require('express');
const router = express.Router();
const screeningController = require('../controllers/screeningController');
const authMiddleware = require('../middleware/authMiddleware');

// Get questions can be public or authenticated, let's allow authenticated & public
router.get('/questions', screeningController.getQuestions);

// Protected screening operations
router.post('/', authMiddleware, screeningController.submitScreening);
router.get('/', authMiddleware, screeningController.getScreenings);
router.get('/:id', authMiddleware, screeningController.getScreeningById);

module.exports = router;
