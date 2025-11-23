const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/appError');
const Subject = require('../models/subject.model');

// @desc    Create a new subject
// @route   POST /api/subjects
// @access  Private/Admin
exports.createSubject = asyncHandler(async (req, res, next) => {
  const { name, code, description } = req.body;

  if (!name || !code) {
    return next(new AppError('Please provide a name and a code for the subject', 400));
  }

  const subject = await Subject.create({ name, code, description });

  res.status(201).json({
    success: true,
    data: subject,
  });
});

// @desc    Get all subjects
// @route   GET /api/subjects
// @access  Private/Admin
exports.getSubjects = asyncHandler(async (req, res, next) => {
  const subjects = await Subject.find({});
  res.status(200).json({
    success: true,
    count: subjects.length,
    data: subjects,
  });
});

// @desc    Get single subject by ID
// @route   GET /api/subjects/:id
// @access  Private/Admin
exports.getSubjectById = asyncHandler(async (req, res, next) => {
  const subject = await Subject.findById(req.params.id);

  if (!subject) {
    return next(new AppError(`Subject not found with id of ${req.params.id}`, 404));
  }

  res.status(200).json({
    success: true,
    data: subject,
  });
});

// @desc    Update a subject
// @route   PUT /api/subjects/:id
// @access  Private/Admin
exports.updateSubject = asyncHandler(async (req, res, next) => {
  let subject = await Subject.findById(req.params.id);

  if (!subject) {
    return next(new AppError(`Subject not found with id of ${req.params.id}`, 404));
  }

  subject = await Subject.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    success: true,
    data: subject,
  });
});

// @desc    Delete a subject
// @route   DELETE /api/subjects/:id
// @access  Private/Admin
exports.deleteSubject = asyncHandler(async (req, res, next) => {
  const subject = await Subject.findById(req.params.id);

  if (!subject) {
    return next(new AppError(`Subject not found with id of ${req.params.id}`, 404));
  }

  await subject.deleteOne(); // Use deleteOne() which is a document method

  res.status(200).json({
    success: true,
    data: {},
  });
});
