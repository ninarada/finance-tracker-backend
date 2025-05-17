const Receipt = require('../models/Receipt');

// @desc    Create a new receipt
// @route   POST /api/receipts/new
// @access  Private
const createReceipt = async (req, res) => {
  const { items, note, paymentMethod, tags, store, date } = req.body;

  if (!req.user || !req.user._id) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: "Receipt must include at least one item." });
  }

  for (const item of items) {
    if (!item.name || !item.quantity || !item.unitPrice || !item.totalPrice) {
      return res.status(400).json({ message: "Each item must have name, quantity, unitPrice, and totalPrice." });
    }
  }

  try {
    const receipt = await Receipt.create({
      user: req.user._id,
      items,
      note,
      paymentMethod,
      tags,
      store,
      date, 
    });

    res.status(201).json(receipt);
  } catch (error) {
    console.error("Error creating receipt:", error);
    res.status(500).json({ message: "Server error while saving receipt." });
  }
};

// @desc    Get all receipts for the logged-in user
// @route   GET /api/receipts/getAll
// @access  Private
const getReceipts = async (req, res) => {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ message: "Unauthorized" });
    }
  
    try {
      const receipts = await Receipt.find({ user: req.user._id }).sort({ date: -1 }); // najnoviji prvi
      res.status(200).json(receipts);
    } catch (error) {
      console.error("Error fetching receipts:", error);
      res.status(500).json({ message: "Server error while fetching receipts." });
    }
}

module.exports = { 
    createReceipt,
    getReceipts,
};