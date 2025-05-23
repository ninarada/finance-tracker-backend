const User = require('../models/User');
const Receipt = require('../models/Receipt');
const generateToken = require('../utils/generateToken');

// @desc    Register a new user
// @route   POST /api/users/register
const registerUser = async (req, res) => {
  const { username, email, password } = req.body;

  const userExists = await User.findOne({ email });

  if (userExists) {
    res.status(400);
    throw new Error('Email already in use.');
  }

  if (!email || !username || !password) {
    return res.status(400).json({ message: "All fields are required." });
  }

  if (password.length < 6) {
    return res.status(400).json({ message: "Password must be at least 6 characters long." });
  }

  const existingUsername = await User.findOne({ username });
    if (existingUsername) {
      return res.status(400).json({ message: "Username already in use." });
  }

  const user = await User.create({
    username,
    email,
    password,
  });

  if (user) {
    res.status(201).json({
      _id: user._id,
      username: user.username,
      email: user.email,
      token: generateToken(user._id),
    });
  } else {
    res.status(400);
    throw new Error('Invalid user data');
  }
};

// @desc    Authenticate user & get token
// @route   POST /api/users/login
const authUser = async (req, res, next) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: "All fields are required." });
  }

  try {
    const user = await User.findOne({ username });

    if (user && (await user.matchPassword(password))) {
      res.json({
        _id: user._id,
        username: user.username,
        email: user.email,
        token: generateToken(user._id),
      });
    } else {
      const error = new Error('Invalid username or password');
      error.status = 401;  
      next(error);
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private (requires token)
const getMyProfile = async (req, res) => {
    const user = await User.findById(req.user._id);
  
    if (user) {
      res.json({
        _id: user._id,
        username: user.username,
        email: user.email,
        photo: user.photo,
        name: user.name,
        surname: user.surname,
        location: user.location,
        bio: user.bio,
        joined: user.createdAt,
      });
    } else {
      res.status(404);
      throw new Error('User not found');
    }
};

// @desc    Get user profile stats
// @route   GET /api/users/stats
// @access  Private (requires token)
const getUserStats = async (req, res) => {
  if (!req.user || !req.user._id) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const receipts = await Receipt.find({ user: req.user._id });

    const totalReceipts = receipts.length;
    let totalSpent = 0;
    let currentMonthSpent = 0;
    const categoryTotals = {};

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    receipts.forEach((receipt) => {
      const date = new Date(receipt.date);
      const isCurrentMonth = date.getMonth() === currentMonth && date.getFullYear() === currentYear;

      if (isCurrentMonth) {
        currentMonthSpent += receipt.totalAmount || 0;
      }

      totalSpent += receipt.totalAmount || 0;

      receipt.items.forEach((item) => {
        if (item.category) {
          if (!categoryTotals[item.category]) {
            categoryTotals[item.category] = 0;
          }
          categoryTotals[item.category] += item.totalPrice;
        }
      });
    });

    const avgPerReceipt = totalReceipts > 0 ? totalSpent / totalReceipts : 0;

    const topCategories = Object.entries(categoryTotals)
      .sort((a, b) => b[1] - a[1]) 
      .slice(0, 3) 
      .map(([category, total]) => ({ category, total: Number(total.toFixed(2)), }));

    res.status(200).json({
      totalReceipts,
      totalSpent: Number(totalSpent.toFixed(2)),
      avgPerReceipt: Number(avgPerReceipt.toFixed(2)),
      currentMonthSpent: Number(currentMonthSpent.toFixed(2)),
      topCategories,
    });
  } catch (error) {
    console.error("Error fetching receipts:", error);
    res.status(500).json({ message: "Server error while fetching statistics." });
  }
}

// @desc    Update user profile
// @route   PUT /api/users/updateProfile
// @access  Private (requires token)
const updateMyProfile = async (req, res) => {
  const user = await User.findById(req.user._id);

  if (user) {
    const { name, surname, location, bio, photo } = req.body;

    user.name = name || user.name;
    user.surname = surname || user.surname;
    user.location = location || user.location;
    user.bio = bio || user.bio;
    user.photo = photo || user.photo;

    try {
      const updatedUser = await user.save();
      res.json({
        _id: updatedUser._id,
        username: updatedUser.username,
        email: updatedUser.email,
        photo: updatedUser.photo,
        name: updatedUser.name,
        surname: updatedUser.surname,
        location: updatedUser.location,
        bio: updatedUser.bio,
        joined: updatedUser.createdAt,
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to update profile." });
    }
  } else {
    res.status(404);
    throw new Error("User not found");
  }
};


module.exports = {
  registerUser,
  authUser,
  getMyProfile,
  getUserStats,
  updateMyProfile,
};