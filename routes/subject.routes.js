const express = require('express');
const {
  createSubject,
  getSubjects,
  getSubjectById,
  updateSubject,
  deleteSubject,
} = require('../controllers/subject.controller');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');

const router = express.Router();

// Protect all routes
router.use(protect);

router.route('/')
  .post(authorizeRoles('Admin', 'Teacher'), createSubject)
  .get(authorizeRoles('Admin', 'Teacher'), getSubjects);

router.route('/:id')
  .get(authorizeRoles('Admin', 'Teacher'), getSubjectById)
  .put(authorizeRoles('Admin'), updateSubject)
  .delete(authorizeRoles('Admin'), deleteSubject);

module.exports = router;
