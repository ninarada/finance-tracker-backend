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
    addCategoryToFavourites,
    deleteUser,
    changePassword,
} = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');
const upload = require("../middleware/upload");

router.post('/register', registerUser);         // POST /api/users/register - Register a new user
router.post('/login', authUser);                // POST /api/users/login - Login user

router.get('/profile', protect, getMyProfile);                                      // GET /api/users/profile - Get user profile
router.get('/stats', protect, getUserStats);                                        // GET /api/users/stats - Get user stats (for profile)
router.put('/updateProfile', protect, upload.single("photo"), updateMyProfile);     // PUT /api/users/updateProfile
router.put('/changePassword', protect, changePassword);                             // PUT /api/users/changePassword
router.post('/newCategory', protect, createCategory);                               // POST /api/users/newCategory - Create a new category
router.post('/addCategoryToFavourites', protect, addCategoryToFavourites);          // POST /api/users/addCategoryToFavourites
router.delete('/deleteCategory', protect, deleteCategory);                          // DELETE /api/users/deleteCategory?name=Groceries - Delete selected category
router.delete('/deleteUser', protect, deleteUser);                                  // DELETE /api/users/deleteUser

module.exports = router;