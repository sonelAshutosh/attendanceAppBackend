const express = require('express')
const {
  getTeachers,
  updateUser,
  changeEmail,
  changePassword,
} = require('../controllers/user.controller')
const { protect, authorizeRoles } = require('../middleware/authMiddleware')

const router = express.Router()

router.get(
  '/teachers',
  protect,
  authorizeRoles('Admin', 'Teacher'),
  getTeachers
)
router.put('/change-email', protect, changeEmail)
router.put('/change-password', protect, changePassword)
router.put('/:id', protect, updateUser)

module.exports = router
