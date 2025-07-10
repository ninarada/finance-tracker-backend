const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: false,
  },
  surname: {
    type: String,
    required: false,
  },
  bio: {
    type: String,
    required: false,
  },
  location: {
    type: String,
    required: false,
  },
  photo: {
    type: String, 
    default: '/public/images/profile-picture.png', 
  },
  categories: {
    type: [String],
    default: [  
      "Groceries",
      "Clothes",
      "Electronics",
      "Health & Beauty",
      "Restaurants",
      "Pharmacy",
      "Toys & Games",
      "Fitness",
      "Other"
    ],
  },
  favouriteCategories: {
    type: [String],
    default: [],
  },
}, {
  timestamps: true,
});

// Method to compare entered password with the hashed password
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Pre-save middleware to hash the password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

module.exports = mongoose.model('User', userSchema);