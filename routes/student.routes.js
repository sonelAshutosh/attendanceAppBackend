const express = require('express');
const {
    createStudentProfile,
    getStudentProfiles,
    getStudentProfileById,
    updateStudentProfile,
    deleteStudentProfile,
    getStudentQrCode,
    joinClass, // Import new function
    registerSubject // Import new function
} = require('../controllers/student.controller');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');

const router = express.Router();

// Routes for Admin and Teachers to manage student profiles
router.route('/')
    .post(protect, authorizeRoles('Admin', 'Teacher'), createStudentProfile)
    .get(protect, authorizeRoles('Admin', 'Teacher'), getStudentProfiles);

router.route('/:id')
    .get(protect, authorizeRoles('Admin', 'Teacher', 'Student'), getStudentProfileById) // Student can get their own profile
    .put(protect, authorizeRoles('Admin', 'Teacher', 'Student'), updateStudentProfile) // Student can update their own profile
    .delete(protect, authorizeRoles('Admin'), deleteStudentProfile); // Only Admin can delete

router.route('/:id/qrcode').get(protect, authorizeRoles('Admin', 'Teacher', 'Student'), getStudentQrCode); // Student can get their own QR code

// New routes for students to interact with classes and subjects
router.route('/join-class').post(protect, authorizeRoles('Student'), joinClass);
router.route('/register-subject').post(protect, authorizeRoles('Student'), registerSubject);

module.exports = router;
