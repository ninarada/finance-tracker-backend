const express = require('express');
const router = express.Router();
const { createReceipt, updateReceipt, getReceipts, getCategoryItems, getReceiptById } = require('../controllers/receiptController');
const { protect } = require('../middleware/authMiddleware');

// Public routes

// Private routes (requires authentication)
router.post('/new', protect, createReceipt);                    // POST /api/receipts/new - Create a new receipt
router.put('/update/:id', protect, updateReceipt);              // PUT /api/receipts/update/:id
router.get('/getAll', protect, getReceipts);                    // GET /api/receipts/getAll - Get all receipts for the logged-in user
router.get('/getCategoryItems', protect, getCategoryItems);     // GET /api/receipts/getCategory - Get all items for the selected category
router.get('/:id', protect, getReceiptById);                    // GET /api/receipts/:id 

module.exports = router;