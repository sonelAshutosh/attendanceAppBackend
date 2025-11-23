const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/appError');
const Class = require('../models/class.model');
const User = require('../models/user.model');
const StudentProfile = require('../models/studentProfile.model');

// @desc    Create a new class
// @route   POST /api/classes
// @access  Private/Admin
exports.createClass = asyncHandler(async (req, res, next) => {
  const { name, description, teacherId } = req.body;

  if (!name || !teacherId) {
    return next(new AppError('Please provide a name and a teacherId', 400));
  }

  // Check if teacher exists and has the 'Teacher' role
  const teacher = await User.findById(teacherId);
  if (!teacher || teacher.role !== 'Teacher') {
    return next(new AppError('A valid teacher ID is required', 400));
  }

  const newClass = await Class.create({ name, description, teacherId });

  res.status(201).json({
    success: true,
    data: newClass,
  });
});

// @desc    Get all classes
// @route   GET /api/classes
// @access  Private/Admin, Teacher
exports.getClasses = asyncHandler(async (req, res, next) => {
  let query = {};
  // If user is a teacher, only show their classes
  if (req.user.role === 'Teacher') {
    query = { teacherId: req.user._id };
  }

  const classes = await Class.find(query).populate('teacherId', 'firstName lastName').populate('students').populate('subjects');

  res.status(200).json({
    success: true,
    count: classes.length,
    data: classes,
  });
});

// @desc    Get single class by ID
// @route   GET /api/classes/:id
// @access  Private/Admin, Teacher
exports.getClassById = asyncHandler(async (req, res, next) => {
  const classData = await Class.findById(req.params.id)
    .populate('teacherId', 'firstName lastName email')
    .populate({
      path: 'students',
      select: 'studentId qrCode',
      populate: { path: 'userId', select: 'firstName lastName email' }
    })
    .populate('subjects', 'name code');

  if (!classData) {
    return next(new AppError(`Class not found with id of ${req.params.id}`, 404));
  }

  // If user is a teacher, ensure they are the teacher for this class
  if (req.user.role === 'Teacher' && classData.teacherId._id.toString() !== req.user._id.toString()) {
     return next(new AppError('Not authorized to view this class', 403));
  }

  res.status(200).json({
    success: true,
    data: classData,
  });
});

// @desc    Update a class
// @route   PUT /api/classes/:id
// @access  Private/Admin
exports.updateClass = asyncHandler(async (req, res, next) => {
  const classToUpdate = await Class.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!classToUpdate) {
    return next(new AppError(`Class not found with id of ${req.params.id}`, 404));
  }

  res.status(200).json({
    success: true,
    data: classToUpdate,
  });
});

// @desc    Delete a class
// @route   DELETE /api/classes/:id
// @access  Private/Admin
exports.deleteClass = asyncHandler(async (req, res, next) => {
  const classToDelete = await Class.findById(req.params.id);

  if (!classToDelete) {
    return next(new AppError(`Class not found with id of ${req.params.id}`, 404));
  }
  
  // Note: Add logic here if you need to handle students being unassigned etc.
  await classToDelete.deleteOne();

  res.status(200).json({
    success: true,
    data: {},
  });
});


// @desc    Add a student to a class
// @route   POST /api/classes/:id/students
// @access  Private/Admin, Teacher
exports.addStudentToClass = asyncHandler(async (req, res, next) => {
    const { studentProfileId } = req.body;
    const classId = req.params.id;

    const classToUpdate = await Class.findById(classId);
    if (!classToUpdate) {
        return next(new AppError(`Class not found with id of ${classId}`, 404));
    }

    // Authorization check for teachers
    if (req.user.role === 'Teacher' && classToUpdate.teacherId.toString() !== req.user._id.toString()) {
        return next(new AppError('Not authorized to modify this class', 403));
    }
    
    const student = await StudentProfile.findById(studentProfileId);
    if (!student) {
        return next(new AppError(`Student profile not found with id of ${studentProfileId}`, 404));
    }

    // Add student to class if not already present
    if (!classToUpdate.students.includes(studentProfileId)) {
        classToUpdate.students.push(studentProfileId);
    }
    
    // Also update the student's currentClass
    student.currentClass = classId;
    
    await classToUpdate.save();
    await student.save();

    res.status(200).json({
        success: true,
        data: classToUpdate,
    });
});

// @desc    Remove a student from a class
// @route   DELETE /api/classes/:classId/students/:studentProfileId
// @access  Private/Admin, Teacher
exports.removeStudentFromClass = asyncHandler(async (req, res, next) => {
    const { classId, studentProfileId } = req.params;

    const classToUpdate = await Class.findById(classId);
    if (!classToUpdate) {
        return next(new AppError(`Class not found with id of ${classId}`, 404));
    }

    // Authorization check for teachers
    if (req.user.role === 'Teacher' && classToUpdate.teacherId.toString() !== req.user._id.toString()) {
        return next(new AppError('Not authorized to modify this class', 403));
    }

    // Pull student from class's student array
    classToUpdate.students.pull(studentProfileId);

    // Unset the student's currentClass if it was this class
    const student = await StudentProfile.findById(studentProfileId);
    if (student && student.currentClass && student.currentClass.toString() === classId) {
        student.currentClass = undefined;
        await student.save();
    }
    
    await classToUpdate.save();

    res.status(200).json({
        success: true,
        data: classToUpdate,
    });
});


// @desc    Add a subject to a class
// @route   POST /api/classes/:id/subjects
// @access  Private/Admin, Teacher
exports.addSubjectToClass = asyncHandler(async (req, res, next) => {
    const { subjectId } = req.body;
    const classId = req.params.id;

    const classToUpdate = await Class.findById(classId);
    if (!classToUpdate) {
        return next(new AppError(`Class not found with id of ${classId}`, 404));
    }

    if (req.user.role === 'Teacher' && classToUpdate.teacherId.toString() !== req.user._id.toString()) {
        return next(new AppError('Not authorized to modify this class', 403));
    }
    
    // Add subject if not already present
    if (!classToUpdate.subjects.includes(subjectId)) {
        classToUpdate.subjects.push(subjectId);
        await classToUpdate.save();
    }

    res.status(200).json({
        success: true,
        data: classToUpdate,
    });
});


// @desc    Remove a subject from a class
// @route   DELETE /api/classes/:classId/subjects/:subjectId
// @access  Private/Admin, Teacher
exports.removeSubjectFromClass = asyncHandler(async (req, res, next) => {
    const { classId, subjectId } = req.params;

    const classToUpdate = await Class.findById(classId);
    if (!classToUpdate) {
        return next(new AppError(`Class not found with id of ${classId}`, 404));
    }

    if (req.user.role === 'Teacher' && classToUpdate.teacherId.toString() !== req.user._id.toString()) {
        return next(new AppError('Not authorized to modify this class', 403));
    }

    classToUpdate.subjects.pull(subjectId);
    await classToUpdate.save();

    res.status(200).json({
        success: true,
        data: classToUpdate,
    });
});
