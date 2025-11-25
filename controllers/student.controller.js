const asyncHandler = require('../utils/asyncHandler')
const AppError = require('../utils/appError')
const StudentProfile = require('../models/studentProfile.model')
const User = require('../models/user.model')
const Class = require('../models/class.model') // Import Class model
const qrcode = require('qrcode')
const crypto = require('crypto')

// @desc    Create a new student profile
// @route   POST /api/students
// @access  Private/Admin, Teacher
exports.createStudentProfile = asyncHandler(async (req, res, next) => {
  const { userId, studentId, currentClass } = req.body

  if (!userId || !studentId) {
    return next(new AppError('Please provide a userId and a studentId', 400))
  }

  // Check if user exists and has the 'Student' role
  const user = await User.findById(userId)
  if (!user || user.role !== 'Student') {
    return next(new AppError('A valid student user ID is required', 400))
  }

  // Check if a profile for this user or studentId already exists
  let existingProfile = await StudentProfile.findOne({
    $or: [{ userId }, { studentId }],
  })
  if (existingProfile) {
    return next(
      new AppError(
        'A student profile for this user or student ID already exists',
        400
      )
    )
  }

  // Generate a unique string for the QR code
  const qrCodeString = `ATTENDANCE_APP_STUDENT:${studentId}_${crypto
    .randomBytes(8)
    .toString('hex')}`

  const studentProfile = await StudentProfile.create({
    userId,
    studentId,
    currentClass,
    qrCode: qrCodeString,
  })

  res.status(201).json({
    success: true,
    data: studentProfile,
  })
})

// @desc    Get all student profiles
// @route   GET /api/students
// @access  Private/Admin, Teacher
exports.getStudentProfiles = asyncHandler(async (req, res, next) => {
  const profiles = await StudentProfile.find({}).populate(
    'userId',
    'firstName lastName email'
  )
  res.status(200).json({
    success: true,
    count: profiles.length,
    data: profiles,
  })
})

// @desc    Get single student profile by ID
// @route   GET /api/students/:id
// @access  Private/Admin, Teacher, Student (self)
exports.getStudentProfileById = asyncHandler(async (req, res, next) => {
  const profile = await StudentProfile.findById(req.params.id)
    .populate('userId', 'firstName lastName email role')
    .populate('currentClass', 'name')

  // If a student is requesting their own profile, ensure authorization
  if (
    req.user.role === 'Student' &&
    profile.userId.toString() !== req.user.id.toString()
  ) {
    return next(
      new AppError('Not authorized to view this student profile', 403)
    )
  }

  if (!profile) {
    return next(
      new AppError(`Student profile not found with id of ${req.params.id}`, 404)
    )
  }

  res.status(200).json({
    success: true,
    data: profile,
  })
})

// @desc    Update a student profile
// @route   PUT /api/students/:id
// @access  Private/Admin, Teacher, Student (self)
exports.updateStudentProfile = asyncHandler(async (req, res, next) => {
  // Prevent updating userId or studentId easily
  const { userId, studentId, ...updateData } = req.body

  let profile = await StudentProfile.findById(req.params.id)

  if (!profile) {
    return next(
      new AppError(`Student profile not found with id of ${req.params.id}`, 404)
    )
  }

  // If a student is updating their own profile, ensure authorization
  if (
    req.user.role === 'Student' &&
    profile.userId.toString() !== req.user.id.toString()
  ) {
    return next(
      new AppError('Not authorized to update this student profile', 403)
    )
  }

  profile = await StudentProfile.findByIdAndUpdate(req.params.id, updateData, {
    new: true,
    runValidators: true,
  })

  res.status(200).json({
    success: true,
    data: profile,
  })
})

// @desc    Delete a student profile
// @route   DELETE /api/students/:id
// @access  Private/Admin
exports.deleteStudentProfile = asyncHandler(async (req, res, next) => {
  const profile = await StudentProfile.findById(req.params.id)

  if (!profile) {
    return next(
      new AppError(`Student profile not found with id of ${req.params.id}`, 404)
    )
  }

  await profile.deleteOne()

  res.status(200).json({
    success: true,
    data: {},
  })
})

// @desc    Get a student's QR code image
// @route   GET /api/students/:id/qrcode
// @access  Private/Admin, Teacher, Student (self)
exports.getStudentQrCode = asyncHandler(async (req, res, next) => {
  const profile = await StudentProfile.findById(req.params.id)

  // If a student is requesting their own QR code, ensure authorization
  if (
    req.user.role === 'Student' &&
    profile.userId.toString() !== req.user.id.toString()
  ) {
    return next(new AppError('Not authorized to view this QR code', 403))
  }

  if (!profile) {
    return next(
      new AppError(`Student profile not found with id of ${req.params.id}`, 404)
    )
  }

  // Generate QR code image from the stored string
  qrcode.toDataURL(profile.qrCode, (err, url) => {
    if (err) {
      return next(new AppError('Could not generate QR code', 500))
    }
    res.status(200).json({
      success: true,
      data: {
        qrCodeDataUrl: url,
      },
    })
  })
})

// @desc    Get current student's profile
// @route   GET /api/students/profile
// @access  Private/Student
exports.getMyProfile = asyncHandler(async (req, res, next) => {
  const profile = await StudentProfile.findOne({ userId: req.user._id })
    .populate('userId', 'firstName lastName email role')
    .populate('currentClass', 'name')

  if (!profile) {
    return next(new AppError('Student profile not found', 404))
  }

  res.status(200).json({
    success: true,
    data: profile,
  })
})

// @desc    Student joins a class
// @route   POST /api/students/join-class
// @access  Private/Student
exports.joinClass = asyncHandler(async (req, res, next) => {
  const { classCode } = req.body
  const studentUserId = req.user.id // Logged-in user's ID

  if (!classCode) {
    return next(new AppError('Please provide a class code', 400))
  }

  // Find the class by code
  const classToJoin = await Class.findOne({ code: classCode })
  if (!classToJoin) {
    return next(new AppError(`Class not found with code ${classCode}`, 404))
  }

  // Find the student profile for the logged-in user
  const studentProfile = await StudentProfile.findOne({ userId: studentUserId })
  if (!studentProfile) {
    return next(new AppError('Student profile not found for this user', 404))
  }

  // Check if student is already in the class
  if (classToJoin.students.includes(studentProfile._id)) {
    return next(new AppError('You are already enrolled in this class', 400))
  }

  // Add student to class
  classToJoin.students.push(studentProfile._id)
  await classToJoin.save()

  // Set student's current class
  studentProfile.currentClass = classToJoin._id
  await studentProfile.save()

  res.status(200).json({
    success: true,
    message: 'Successfully joined class',
    data: classToJoin,
  })
})
