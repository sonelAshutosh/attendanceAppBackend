const express = require('express');
const { getTeachers } = require('../controllers/user.controller');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/teachers', protect, authorizeRoles('Admin', 'Teacher'), getTeachers);

module.exports = router;
