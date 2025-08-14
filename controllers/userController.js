const User = require('../models/User');
const Receipt = require('../models/Receipt');
const generateToken = require('../utils/generateToken');

// @desc    Register a new user
// @route   POST /api/users/register
const registerUser = async (req, res) => {
  const { username, email, password, name, surname } = req.body;

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

  const photo = `${req.protocol}://${req.get("host")}/uploads/123.png`;

  const user = await User.create({
    username,
    email,
    password,
    name,
    surname,
    photo,
  });

  if (user) {
    res.status(201).json({
      _id: user._id,
      username: user.username,
      email: user.email,
      name: user.name,
      surname: user.surname,
      token: generateToken(user._id),
      favouriteCategories: user.favouriteCategories,
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
        favouriteCategories: user.favouriteCategories,
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
        categories: user.categories,
        favouriteCategories: user.favouriteCategories,
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
        if (Array.isArray(item.categories)) {
          item.categories.forEach((category) => {
            if (!categoryTotals[category]) {
              categoryTotals[category] = 0;
            }
            categoryTotals[category] += item.totalPrice;
          });
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
    const { name, surname, location, bio } = req.body;

    user.name = name || user.name;
    user.surname = surname || user.surname;
    user.location = location || user.location;
    user.bio = bio || user.bio;
    
    if (req.file) {
      user.photo = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;
    }

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
        categories: updatedUser.categories,
        favouriteCategories: updatedUser.favouriteCategories,
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to update profile." });
    }
  } else {
    res.status(404);
    throw new Error("User not found");
  }
};

// @desc    Create a new category
// @route   POST /api/users/newCategory
// @access  Private
const createCategory = async (req, res) => {
  const { name } = req.body;

  if (!req.user || !req.user._id) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  if (!name || typeof name !== 'string' || name.trim() === '') {
    return res.status(400).json({ message: "Category name is required" });
  }

  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const trimmedName = name.trim();

    const categoryExists = user.categories.some(
      cat => cat.toLowerCase() === trimmedName.toLowerCase()
    );

    if (categoryExists) {
      return res.status(400).json({ message: "Category with that name already exists." });
    }

    user.categories.push(trimmedName);
    await user.save();

    res.status(201).json({ message: "Category created successfully", categories: user.categories });
  } catch (error) {
    console.error("Error creating category:", error);
    res.status(500).json({ message: "Server error while creating category." });
  }
};

// @desc    Delete selected category
// @route   DELETE /api/users/deleteCategory?name=Groceries
// @access  Private
const deleteCategory = async (req, res) => {
  const name = req.query.name;

  if (!req.user || !req.user._id) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  if (!name || typeof name !== 'string' || name.trim() === '') {
    return res.status(400).json({ message: "Category name is required" });
  }

  try {
    const trimmedName = name.trim();

    // 1. Remove category from user's list
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const initialLength = user.categories.length;
    user.categories = user.categories.filter(
      cat => cat.toLowerCase() !== trimmedName.toLowerCase()
    );

    if (user.categories.length === initialLength) {
      return res.status(404).json({ message: "Category not found in user profile" });
    }

    user.favouriteCategories = user.favouriteCategories.filter(
      favCat => favCat.toLowerCase() !== trimmedName.toLowerCase()
    );

    await user.save();

    // 2. Remove category from each item's categories array in all receipts
    const updateResult = await Receipt.updateMany(
      {
        user: req.user._id,
        "items.categories": trimmedName
      },
      {
        $pull: { "items.$[].categories": trimmedName }
      }
    );

    res.status(200).json({
      message: `Category '${trimmedName}' deleted successfully`,
      updatedReceipts: updateResult.modifiedCount,
      remainingCategories: user.categories,
    });

  } catch (error) {
    console.error("Error deleting category:", error);
    res.status(500).json({ message: "Server error while deleting category." });
  }
}

// @desc    Add a category to user's favouriteCategories
// @route   POST /api/users/addCategoryToFavourites
// @access  Private
const addCategoryToFavourites = async (req, res) => {
  const { categoryName, add } = req.body;

  if (!req.user || !req.user._id) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  if (!categoryName || typeof categoryName !== 'string' || categoryName.trim() === '') {
    return res.status(400).json({ message: "Category name is required" });
  }
  if (typeof add !== 'boolean') {
    return res.status(400).json({ message: "'add' flag must be a boolean" });
  }

  try {
    const trimmedName = categoryName.trim();
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });
    const categoryExists = user.categories.some(                // Check if category exists in user's categories list
      cat => cat.toLowerCase() === trimmedName.toLowerCase()
    );
    if (!categoryExists) {
      return res.status(400).json({ message: "Category does not exist in user's categories" });
    }

    if (add) {
      if (user.favouriteCategories.some(favCat => favCat.toLowerCase() === trimmedName.toLowerCase())) {
        return res.status(400).json({ message: "Category is already a favourite" });
      }
      if (user.favouriteCategories.length >= 4) {
        return res.status(400).json({ message: "Favourites limit reached. You can't add more." });
      }
      user.favouriteCategories.push(trimmedName);
    } else {
      user.favouriteCategories = user.favouriteCategories.filter(
        favCat => favCat.toLowerCase() !== trimmedName.toLowerCase()
      );
    }

    await user.save();

    res.status(200).json({
      message: add
        ? `Category '${trimmedName}' added to favourites`
        : `Category '${trimmedName}' removed from favourites`,
      favouriteCategories: user.favouriteCategories,
      favouritesCount: user.favouriteCategories.length,
    });
  } catch (error) {
    console.error("Error adding favourite category:", error);
    res.status(500).json({ message: "Server error while adding favourite category." });
  }
};

// @desc    Delete user account
// @route   DELETE /api/users/deleteUser
// @access  Private
const deleteUser = async (req, res) => {
  const { password } = req.query;

  if (!req.user || !req.user._id) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: "Incorrect password" });
    }

    await Receipt.deleteMany({ user: user._id });
    await user.deleteOne();

    res.status(200).json({ message: "User account and related receipts deleted successfully" });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ message: "Server error while deleting user" });
  }
}

// @desc    Change user password
// @route   PUT /api/users/changePassword
// @access  Private
const changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!req.user || !req.user._id) { return res.status(401).json({ message: "Unauthorized" }); }
  if (!currentPassword || !newPassword) { return res.status(400).json({ message: "Both current and new passwords are required" }); }
  if (newPassword.length < 6) { return res.status(400).json({ message: "New password must be at least 6 characters long" }); }

  try {
    const user = await User.findById(req.user._id).select("+password");
    if (!user) { return res.status(404).json({ message: "User not found" }); }
    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) { return res.status(401).json({ message: "Current password is incorrect" }); }

    user.password = newPassword; 
    await user.save();
    res.status(200).json({ message: "Password changed successfully" });
  } catch (error) {
    console.error("Error changing password:", error);
    res.status(500).json({ message: "Server error while changing password" });
  }
};

module.exports = {
  registerUser,
  authUser,
  getMyProfile,
  getUserStats,
  updateMyProfile,
  createCategory,
  deleteCategory,
  addCategoryToFavourites,
  deleteUser,
  changePassword
};