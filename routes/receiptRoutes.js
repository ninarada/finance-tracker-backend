const express = require('express');
const router = express.Router();
const { createReceipt, getReceipts,getCategory } = require('../controllers/receiptController');
const { protect } = require('../middleware/authMiddleware');

// Public routes

// Private routes (requires authentication)
router.post('/new', protect, createReceipt);         // POST /api/receipts/new - Create a new receipt
router.get('/getAll', protect, getReceipts);         // GET /api/receipts/getAll - Get all receipts for the logged-in user
router.get('/getCategory', protect, getCategory);    // GET /api/receipts/getCategory - Get all items for the selected category

module.exports = router;