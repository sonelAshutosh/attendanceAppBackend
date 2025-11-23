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

// All routes here are protected and restricted to Admins
router.use(protect);
router.use(authorizeRoles('Admin'));

router.route('/')
  .post(createSubject)
  .get(getSubjects);

router.route('/:id')
  .get(getSubjectById)
  .put(updateSubject)
  .delete(deleteSubject);

module.exports = router;
