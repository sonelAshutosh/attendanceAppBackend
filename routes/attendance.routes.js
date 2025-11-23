const express = require('express');
const {
    startSession,
    endSession,
    cancelSession,
    getActiveTeacherSessions,
    getSessionDetails,
    getAllSessions,
    markQrAttendance,
    markSwipeAttendance,
    getSessionRecords,
    getStudentRecords,
    updateAttendanceRecord
} = require('../controllers/attendance.controller');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');

const router = express.Router();

// All routes are protected
router.use(protect);

// Session management routes (mostly for Teachers)
router.post('/sessions/start', authorizeRoles('Teacher'), startSession);
router.put('/sessions/:id/end', authorizeRoles('Teacher'), endSession);
router.put('/sessions/:id/cancel', authorizeRoles('Teacher'), cancelSession);
router.get('/sessions/active', authorizeRoles('Teacher'), getActiveTeacherSessions);
router.get('/sessions/:id', authorizeRoles('Admin', 'Teacher'), getSessionDetails);
router.get('/sessions', authorizeRoles('Admin', 'Teacher'), getAllSessions);

// Attendance record routes
router.post('/records/qr', authorizeRoles('Teacher'), markQrAttendance);
router.post('/records/swipe', authorizeRoles('Teacher'), markSwipeAttendance);
router.get('/records/session/:sessionId', authorizeRoles('Admin', 'Teacher'), getSessionRecords);
router.get('/records/student/:studentProfileId', authorizeRoles('Admin', 'Teacher', 'Student'), getStudentRecords);
router.put('/records/:id', authorizeRoles('Admin', 'Teacher'), updateAttendanceRecord);

module.exports = router;
