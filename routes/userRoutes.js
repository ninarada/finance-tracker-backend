const express = require('express');
const router = express.Router();
const { 
    registerUser, 
    authUser, 
    getMyProfile, 
    getUserStats, 
    updateMyProfile, 
    createCategory, 
    deleteCategory,
    addCategoryToFavourites } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');
const upload = require("../middleware/upload");

// Public routes
router.post('/register', registerUser);         // POST /api/users/register - Register a new user
router.post('/login', authUser);                // POST /api/users/login - Login user

// Private route (requires authentication)
router.get('/profile', protect, getMyProfile);              // GET /api/users/profile - Get user profile
router.get('/stats', protect, getUserStats);                // GET /api/users/stats - Get user stats (for profile)

router.put('/updateProfile', protect, upload.single("photo"), updateMyProfile);     // PUT /api/users/updateProfile

router.post('/newCategory', protect, createCategory);       // POST /api/users/newCategory - Create a new category
router.post('/addCategoryToFavourites', protect, addCategoryToFavourites);         // POST /api/users/addCategoryToFavourites

router.delete('/deleteCategory', protect, deleteCategory);  // DELETE /api/users/deleteCategory?name=Groceries - Delete selected category

module.exports = router;