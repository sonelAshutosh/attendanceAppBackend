const express = require('express');
const {
  createClass,
  getClasses,
  getClassById,
  updateClass,
  deleteClass,
  addStudentToClass,
  removeStudentFromClass,
  addSubjectToClass,
  removeSubjectFromClass,
} = require('../controllers/class.controller');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');

const router = express.Router();

// Admin-only routes for creating, updating, deleting classes
router
  .route('/')
  .post(protect, authorizeRoles('Admin', 'Teacher'), createClass)
  .get(protect, authorizeRoles('Admin', 'Teacher'), getClasses); // Teachers can view classes

router
  .route('/:id')
  .get(protect, authorizeRoles('Admin', 'Teacher'), getClassById)
  .put(protect, authorizeRoles('Admin'), updateClass)
  .delete(protect, authorizeRoles('Admin'), deleteClass);

// Routes for managing students and subjects in a class
// Admins or the assigned Teacher can manage their class
router
  .route('/:id/students')
  .post(protect, authorizeRoles('Admin', 'Teacher'), addStudentToClass);

router
  .route('/:classId/students/:studentProfileId')
  .delete(protect, authorizeRoles('Admin', 'Teacher'), removeStudentFromClass);

router
  .route('/:id/subjects')
  .post(protect, authorizeRoles('Admin', 'Teacher'), addSubjectToClass);

router
  .route('/:classId/subjects/:subjectId')
  .delete(protect, authorizeRoles('Admin', 'Teacher'), removeSubjectFromClass);

module.exports = router;
