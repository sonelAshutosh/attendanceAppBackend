const express = require('express')
const {
  createClass,
  getClasses,
  getClassById,
  updateClass,
  deleteClass,
  addStudentToClass,
  removeStudentFromClass,
  joinClass,
} = require('../controllers/class.controller')
const { protect, authorizeRoles } = require('../middleware/authMiddleware')

const router = express.Router()

// Admin-only routes for creating, updating, deleting classes
router
  .route('/')
  .post(protect, authorizeRoles('Admin', 'Teacher'), createClass)
  .get(protect, authorizeRoles('Admin', 'Teacher', 'Student'), getClasses) // Teachers and Students can view classes

// IMPORTANT: Specific routes must come before parameterized routes
router.post('/join', protect, authorizeRoles('Student'), joinClass)

router
  .route('/:id')
  .get(protect, authorizeRoles('Admin', 'Teacher'), getClassById)
  .put(protect, authorizeRoles('Admin'), updateClass)
  .delete(protect, authorizeRoles('Admin'), deleteClass)

// Routes for managing students in a class
// Admins or the assigned Teacher can manage their class
router
  .route('/:id/students')
  .post(protect, authorizeRoles('Admin', 'Teacher'), addStudentToClass)

router
  .route('/:classId/students/:studentProfileId')
  .delete(protect, authorizeRoles('Admin', 'Teacher'), removeStudentFromClass)

module.exports = router
