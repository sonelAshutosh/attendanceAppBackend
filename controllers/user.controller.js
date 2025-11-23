const asyncHandler = require('../utils/asyncHandler');
const User = require('../models/user.model');
const AppError = require('../utils/appError');

// @desc    Get all users with role 'Teacher'
// @route   GET /api/users/teachers
// @access  Private/Admin, Teacher
exports.getTeachers = asyncHandler(async (req, res, next) => {
  const teachers = await User.find({ role: 'Teacher' }).select('-password'); // Exclude password

  res.status(200).json({
    success: true,
    count: teachers.length,
    data: teachers,
  });
});
