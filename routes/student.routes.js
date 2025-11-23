const express = require('express');
const {
    createStudentProfile,
    getStudentProfiles,
    getStudentProfileById,
    updateStudentProfile,
    deleteStudentProfile,
    getStudentQrCode
} = require('../controllers/student.controller');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');

const router = express.Router();

// Admin and Teachers can manage student profiles
router.use(protect, authorizeRoles('Admin', 'Teacher'));

router.route('/')
    .post(createStudentProfile)
    .get(getStudentProfiles);

router.route('/:id')
    .get(getStudentProfileById)
    .put(updateStudentProfile)
    .delete(authorizeRoles('Admin'), deleteStudentProfile); // Only Admin can delete

router.route('/:id/qrcode').get(getStudentQrCode);

module.exports = router;
