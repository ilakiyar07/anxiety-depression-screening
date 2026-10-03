const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');

// All admin routes require both JWT authentication and admin role
router.use(authMiddleware, adminMiddleware);

router.get('/statistics', adminController.getAdminStatistics);
router.get('/users', adminController.getUsersList);
router.put('/users/:id/role', adminController.updateUserRole);

module.exports = router;
