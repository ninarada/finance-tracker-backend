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

// @desc    Update an existing receipt
// @route   PUT /api/receipts/update/:id
// @access  Private
const updateReceipt = async (req, res) => {
  const receiptId = req.params.id;
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
    const receipt = await Receipt.findById(receiptId);

    if (!receipt) {
      return res.status(404).json({ message: "Receipt not found." });
    }

    if (receipt.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Forbidden: You don't have permission to update this receipt." });
    }

    // Update fields
    receipt.items = items;
    receipt.note = note;
    receipt.paymentMethod = paymentMethod;
    receipt.tags = tags;
    receipt.store = store;
    receipt.date = date;

    const updatedReceipt = await receipt.save();

    res.status(200).json(updatedReceipt);
  } catch (error) {
    console.error("Error updating receipt:", error);
    res.status(500).json({ message: "Server error while updating receipt." });
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
      const receipts = await Receipt.find({ user: req.user._id }).sort({ createdAt: -1 }); //.sort({ date: -1 }); // najnoviji prvi
      res.status(200).json(receipts);
    } catch (error) {
      console.error("Error fetching receipts:", error);
      res.status(500).json({ message: "Server error while fetching receipts." });
    }
}

const getReceiptById = async (req, res) => {
  const userId = req.user?._id;
  const receiptId = req.params.id;

  if (!userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const receipt = await Receipt.findOne({ _id: receiptId, user: userId });
    if (!receipt) {
      return res.status(404).json({ message: "Receipt not found" });
    }
    res.json(receipt);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Get all items for the selected category
// @route   GET /api/receipts/getCategory
// @access  Private
const getCategoryItems = async (req, res) => {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const category = req.query.category;

    if (!category) {
        return res.status(400).json({ message: "Category query parameter is required." });
    }
    
    try {
      const filteredItems = await Receipt.aggregate([
        { $match: { user: req.user._id } },
        {
          $project: {
            items: 1,
            receiptDate: "$date",
            receiptStore: "$store",
            receiptTotal: "$totalAmount"
          }
        },
        { $unwind: "$items" },
        {
          $match: {
            "items.categories": { $in: [new RegExp(`^${category}$`, "i")] }
          }
        },
        {
          $addFields: {
            "items.receiptDate": "$receiptDate",
            "items.receiptStore": "$receiptStore",
            "items.receiptTotal": "$receiptTotal",
            "items.receiptId": "$_id"
          }
        },
        {
          $replaceRoot: { newRoot: "$items" }
        }
      ]);      

      res.status(200).json(filteredItems);
    } catch (error) {
      console.error("Error fetching category items:", error);
      res.status(500).json({ message: "Server error while fetching category items." });
    }
}


// @desc    Delete selected receipt
// @route   DELETE /api/receipts/deleteReceipt
// @access  Private
const deleteReceipt = async (req, res) => {
  const selectedId = req.query.selectedId;

  if (!req.user || !req.user._id) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const receipt = await Receipt.findOne({ _id: selectedId, user: req.user._id });
    if (!receipt) {
      return res.status(404).json({ message: 'Receipt not found.' });
    }
    await receipt.deleteOne();
    return res.status(200).json({ message: 'Receipt deleted.' });
  } catch (error) {
    console.error("Error deleting receipt:", error);
    res.status(500).json({ message: "Server error while deleting receipt." });
  }
}

module.exports = { 
    createReceipt,
    updateReceipt,
    getReceipts,
    getReceiptById,
    getCategoryItems,
    deleteReceipt
};