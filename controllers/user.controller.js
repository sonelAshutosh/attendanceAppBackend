const asyncHandler = require('../utils/asyncHandler')
const User = require('../models/user.model')
const AppError = require('../utils/appError')

// @desc    Get all users with role 'Teacher'
// @route   GET /api/users/teachers
// @access  Private/Admin, Teacher
exports.getTeachers = asyncHandler(async (req, res, next) => {
  const teachers = await User.findOne({ role: 'Teacher' }).select('-password') // Exclude password

  res.status(200).json({
    success: true,
    count: teachers.length,
    data: teachers,
  })
})

// @desc    Update user profile (firstName, lastName, avatar)
// @route   PUT /api/users/:id
// @access  Private
exports.updateUser = asyncHandler(async (req, res, next) => {
  const { firstName, lastName, avatar } = req.body

  // Check if user is updating their own profile
  if (req.params.id !== req.user._id.toString()) {
    return next(new AppError('Not authorized to update this profile', 403))
  }

  const updateData = {}
  if (firstName) updateData.firstName = firstName
  if (lastName) updateData.lastName = lastName
  if (avatar !== undefined) updateData.avatar = avatar // Allow setting to null

  const user = await User.findByIdAndUpdate(req.params.id, updateData, {
    new: true,
    runValidators: true,
  }).select('-password')

  if (!user) {
    return next(new AppError('User not found', 404))
  }

  res.status(200).json({
    success: true,
    data: user,
  })
})

// @desc    Change user email
// @route   PUT /api/users/change-email
// @access  Private
exports.changeEmail = asyncHandler(async (req, res, next) => {
  const { newEmail, password } = req.body

  if (!newEmail || !password) {
    return next(new AppError('Please provide new email and password', 400))
  }

  // Get user with password
  const user = await User.findById(req.user._id).select('+password')

  if (!user) {
    return next(new AppError('User not found', 404))
  }

  // Verify password
  const isMatch = await user.matchPassword(password)
  if (!isMatch) {
    return next(new AppError('Incorrect password', 401))
  }

  // Check if email already exists
  const existingUser = await User.findOne({ email: newEmail })
  if (existingUser) {
    return next(new AppError('Email already in use', 400))
  }

  // Update email
  user.email = newEmail
  await user.save()

  res.status(200).json({
    success: true,
    message: 'Email updated successfully',
  })
})

// @desc    Change user password
// @route   PUT /api/users/change-password
// @access  Private
exports.changePassword = asyncHandler(async (req, res, next) => {
  const { currentPassword, newPassword } = req.body

  if (!currentPassword || !newPassword) {
    return next(new AppError('Please provide current and new password', 400))
  }

  // Get user with password
  const user = await User.findById(req.user._id).select('+password')

  if (!user) {
    return next(new AppError('User not found', 404))
  }

  // Verify current password
  const isMatch = await user.matchPassword(currentPassword)
  if (!isMatch) {
    return next(new AppError('Current password is incorrect', 401))
  }

  // Update password
  user.password = newPassword
  await user.save()

  res.status(200).json({
    success: true,
    message: 'Password changed successfully',
  })
})
