const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/appError');
const StudentProfile = require('../models/studentProfile.model');
const User = require('../models/user.model');
const qrcode = require('qrcode');
const crypto = require('crypto');

// @desc    Create a new student profile
// @route   POST /api/students
// @access  Private/Admin, Teacher
exports.createStudentProfile = asyncHandler(async (req, res, next) => {
    const { userId, studentId, currentClass } = req.body;

    if (!userId || !studentId) {
        return next(new AppError('Please provide a userId and a studentId', 400));
    }

    // Check if user exists and has the 'Student' role
    const user = await User.findById(userId);
    if (!user || user.role !== 'Student') {
        return next(new AppError('A valid student user ID is required', 400));
    }
    
    // Check if a profile for this user or studentId already exists
    let existingProfile = await StudentProfile.findOne({ $or: [{ userId }, { studentId }] });
    if(existingProfile) {
        return next(new AppError('A student profile for this user or student ID already exists', 400));
    }

    // Generate a unique string for the QR code
    const qrCodeString = `ATTENDANCE_APP_STUDENT:${studentId}_${crypto.randomBytes(8).toString('hex')}`;

    const studentProfile = await StudentProfile.create({
        userId,
        studentId,
        currentClass,
        qrCode: qrCodeString
    });

    res.status(201).json({
        success: true,
        data: studentProfile,
    });
});

// @desc    Get all student profiles
// @route   GET /api/students
// @access  Private/Admin, Teacher
exports.getStudentProfiles = asyncHandler(async (req, res, next) => {
    const profiles = await StudentProfile.find({}).populate('userId', 'firstName lastName email');
    res.status(200).json({
        success: true,
        count: profiles.length,
        data: profiles,
    });
});

// @desc    Get single student profile by ID
// @route   GET /api/students/:id
// @access  Private/Admin, Teacher
exports.getStudentProfileById = asyncHandler(async (req, res, next) => {
    const profile = await StudentProfile.findById(req.params.id)
        .populate('userId', 'firstName lastName email role')
        .populate('currentClass', 'name');

    if (!profile) {
        return next(new AppError(`Student profile not found with id of ${req.params.id}`, 404));
    }

    res.status(200).json({
        success: true,
        data: profile,
    });
});

// @desc    Update a student profile
// @route   PUT /api/students/:id
// @access  Private/Admin, Teacher
exports.updateStudentProfile = asyncHandler(async (req, res, next) => {
    // Prevent updating userId or studentId easily
    const { userId, studentId, ...updateData } = req.body;

    const profile = await StudentProfile.findByIdAndUpdate(req.params.id, updateData, {
        new: true,
        runValidators: true,
    });

    if (!profile) {
        return next(new AppError(`Student profile not found with id of ${req.params.id}`, 404));
    }

    res.status(200).json({
        success: true,
        data: profile,
    });
});

// @desc    Delete a student profile
// @route   DELETE /api/students/:id
// @access  Private/Admin
exports.deleteStudentProfile = asyncHandler(async (req, res, next) => {
    const profile = await StudentProfile.findById(req.params.id);

    if (!profile) {
        return next(new AppError(`Student profile not found with id of ${req.params.id}`, 404));
    }

    await profile.deleteOne();

    res.status(200).json({
        success: true,
        data: {},
    });
});

// @desc    Get a student's QR code image
// @route   GET /api/students/:id/qrcode
// @access  Private/Admin, Teacher
exports.getStudentQrCode = asyncHandler(async (req, res, next) => {
    const profile = await StudentProfile.findById(req.params.id);

    if (!profile) {
        return next(new AppError(`Student profile not found with id of ${req.params.id}`, 404));
    }

    // Generate QR code image from the stored string
    qrcode.toDataURL(profile.qrCode, (err, url) => {
        if (err) {
            return next(new AppError('Could not generate QR code', 500));
        }
        res.status(200).json({
            success: true,
            data: {
                qrCodeDataUrl: url
            }
        });
    });
});
