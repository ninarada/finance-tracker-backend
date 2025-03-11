const express = require('express');
const router = express.Router();
const { registerUser, authUser, getMyProfile } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

// Public routes
router.post('/register', registerUser);         // POST /api/users/register - Register a new user
router.post('/login', authUser);                // POST /api/users/login - Login user

// Private route (requires authentication)
router.get('/profile', protect, getMyProfile);  // GET /api/users/profile - Get user profile

module.exports = router;