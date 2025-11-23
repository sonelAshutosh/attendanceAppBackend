const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/appError');
const User = require('../models/user.model');
const jwt = require('jsonwebtoken');

// Helper function to generate JWT token
const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
exports.registerUser = asyncHandler(async (req, res, next) => {
  const { email, password, role, firstName, lastName } = req.body;

  // Basic validation
  if (!email || !password || !role || !firstName || !lastName) {
    return next(new AppError('Please enter all fields', 400));
  }

  // Check if user already exists
  const userExists = await User.findOne({ email });
  if (userExists) {
    return next(new AppError('User with this email already exists', 400));
  }

  // Create user
  const user = await User.create({
    email,
    password,
    role,
    firstName,
    lastName,
  });

  if (user) {
    res.status(201).json({
      _id: user._id,
      email: user.email,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
      token: generateToken(user._id, user.role),
    });
  } else {
    return next(new AppError('Invalid user data', 400));
  }
});

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
exports.loginUser = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  // Check for user email
  const user = await User.findOne({ email }).select('+password');

  if (!user) {
    return next(new AppError('Invalid credentials', 401));
  }

  // Check if password matches
  const isMatch = await user.matchPassword(password);

  if (user && isMatch) {
    res.json({
      _id: user._id,
      email: user.email,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
      token: generateToken(user._id, user.role),
    });
  } else {
    return next(new AppError('Invalid credentials', 401));
  }
});

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
exports.getMe = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id).select('-password'); // req.user.id set by protect middleware

  if (!user) {
    return next(new AppError('User not found', 404));
  }

  res.status(200).json({
    _id: user._id,
    email: user.email,
    role: user.role,
    firstName: user.firstName,
    lastName: user.lastName,
  });
});
