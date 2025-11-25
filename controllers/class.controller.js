const asyncHandler = require('../utils/asyncHandler')
const AppError = require('../utils/appError')
const Class = require('../models/class.model')
const User = require('../models/user.model')
const StudentProfile = require('../models/studentProfile.model')
const crypto = require('crypto')

// @desc    Create a new class
// @route   POST /api/classes
// @access  Private/Admin, Private/Teacher
exports.createClass = asyncHandler(async (req, res, next) => {
  let { name, subject, description, teacherId } = req.body
  const { user } = req // User attached from 'protect' middleware

  // If the user is a Teacher, they are the teacher of the class they create
  if (user.role === 'Teacher') {
    teacherId = user._id
  }

  if (!name || !subject || !teacherId) {
    return next(
      new AppError('Please provide a name, subject, and teacherId', 400)
    )
  }

  // Check if teacher exists and has the 'Teacher' role
  const teacher = await User.findById(teacherId)
  if (!teacher || teacher.role !== 'Teacher') {
    return next(new AppError('A valid teacher ID is required', 400))
  }

  // Generate a unique class code
  const code = crypto.randomBytes(3).toString('hex').toUpperCase()

  const newClass = await Class.create({
    name,
    subject,
    description,
    teacherId,
    code,
  })

  res.status(201).json({
    success: true,
    data: newClass,
  })
})

// @desc    Get all classes
// @route   GET /api/classes
// @access  Private/Admin, Teacher
exports.getClasses = asyncHandler(async (req, res, next) => {
  let query = {}
  // If user is a teacher, only show their classes
  if (req.user.role === 'Teacher') {
    query = { teacherId: req.user._id }
  } else if (req.user.role === 'Student') {
    // If user is a student, only show classes they are enrolled in
    const studentProfile = await StudentProfile.findOne({
      userId: req.user._id,
    })
    if (studentProfile) {
      query = { students: studentProfile._id }
    } else {
      return res.status(200).json({ success: true, count: 0, data: [] })
    }
  }

  const classes = await Class.find(query)
    .populate('teacherId', 'firstName lastName')
    .populate('students')

  res.status(200).json({
    success: true,
    count: classes.length,
    data: classes,
  })
})

// @desc    Get single class by ID
// @route   GET /api/classes/:id
// @access  Private/Admin, Teacher
exports.getClassById = asyncHandler(async (req, res, next) => {
  const classData = await Class.findById(req.params.id)
    .populate('teacherId', 'firstName lastName email')
    .populate({
      path: 'students',
      select: 'studentId qrCode',
      populate: { path: 'userId', select: 'firstName lastName email avatar' },
    })

  if (!classData) {
    return next(
      new AppError(`Class not found with id of ${req.params.id}`, 404)
    )
  }

  // If user is a teacher, ensure they are the teacher for this class
  if (
    req.user.role === 'Teacher' &&
    classData.teacherId._id.toString() !== req.user._id.toString()
  ) {
    return next(new AppError('Not authorized to view this class', 403))
  }

  res.status(200).json({
    success: true,
    data: classData,
  })
})

// @desc    Update a class
// @route   PUT /api/classes/:id
// @access  Private/Admin
exports.updateClass = asyncHandler(async (req, res, next) => {
  const classToUpdate = await Class.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  })

  if (!classToUpdate) {
    return next(
      new AppError(`Class not found with id of ${req.params.id}`, 404)
    )
  }

  res.status(200).json({
    success: true,
    data: classToUpdate,
  })
})

// @desc    Delete a class
// @route   DELETE /api/classes/:id
// @access  Private/Admin
exports.deleteClass = asyncHandler(async (req, res, next) => {
  const classToDelete = await Class.findById(req.params.id)

  if (!classToDelete) {
    return next(
      new AppError(`Class not found with id of ${req.params.id}`, 404)
    )
  }

  // Note: Add logic here if you need to handle students being unassigned etc.
  await classToDelete.deleteOne()

  res.status(200).json({
    success: true,
    data: {},
  })
})

// @desc    Add a student to a class
// @route   POST /api/classes/:id/students
// @access  Private/Admin, Teacher
exports.addStudentToClass = asyncHandler(async (req, res, next) => {
  const { studentProfileId } = req.body
  const classId = req.params.id

  const classToUpdate = await Class.findById(classId)
  if (!classToUpdate) {
    return next(new AppError(`Class not found with id of ${classId}`, 404))
  }

  // Authorization check for teachers
  if (
    req.user.role === 'Teacher' &&
    classToUpdate.teacherId.toString() !== req.user._id.toString()
  ) {
    return next(new AppError('Not authorized to modify this class', 403))
  }

  const student = await StudentProfile.findById(studentProfileId)
  if (!student) {
    return next(
      new AppError(
        `Student profile not found with id of ${studentProfileId}`,
        404
      )
    )
  }

  // Add student to class if not already present
  if (!classToUpdate.students.includes(studentProfileId)) {
    classToUpdate.students.push(studentProfileId)
  }

  // Also update the student's currentClass
  student.currentClass = classId

  await classToUpdate.save()
  await student.save()

  res.status(200).json({
    success: true,
    data: classToUpdate,
  })
})

// @desc    Remove a student from a class
// @route   DELETE /api/classes/:classId/students/:studentProfileId
// @access  Private/Admin, Teacher
exports.removeStudentFromClass = asyncHandler(async (req, res, next) => {
  const { classId, studentProfileId } = req.params

  const classToUpdate = await Class.findById(classId)
  if (!classToUpdate) {
    return next(new AppError(`Class not found with id of ${classId}`, 404))
  }

  // Authorization check for teachers
  if (
    req.user.role === 'Teacher' &&
    classToUpdate.teacherId.toString() !== req.user._id.toString()
  ) {
    return next(new AppError('Not authorized to modify this class', 403))
  }

  // Pull student from class's student array
  classToUpdate.students.pull(studentProfileId)

  // Unset the student's currentClass if it was this class
  const student = await StudentProfile.findById(studentProfileId)
  if (
    student &&
    student.currentClass &&
    student.currentClass.toString() === classId
  ) {
    student.currentClass = undefined
    await student.save()
  }

  await classToUpdate.save()

  res.status(200).json({
    success: true,
    data: classToUpdate,
  })
})

// @desc    Join a class by code
// @route   POST /api/classes/join
// @access  Private/Student
exports.joinClass = asyncHandler(async (req, res, next) => {
  const { code } = req.body
  const { user } = req

  if (user.role !== 'Student') {
    return next(new AppError('Only students can join classes', 403))
  }

  if (!code) {
    return next(new AppError('Please provide a class code', 400))
  }

  const classToJoin = await Class.findOne({ code })
  if (!classToJoin) {
    return next(new AppError('Invalid class code', 404))
  }

  // Find student profile
  const studentProfile = await StudentProfile.findOne({ userId: user._id })
  if (!studentProfile) {
    return next(new AppError('Student profile not found', 404))
  }

  // Add student to class using $addToSet
  const updatedClass = await Class.findByIdAndUpdate(
    classToJoin._id,
    { $addToSet: { students: studentProfile._id } },
    { new: true }
  )

  // Update student profile currentClass if not set
  if (!studentProfile.currentClass) {
    studentProfile.currentClass = classToJoin._id
    await studentProfile.save()
  }

  res.status(200).json({
    success: true,
    data: updatedClass,
    message: 'Successfully joined class',
  })
})
