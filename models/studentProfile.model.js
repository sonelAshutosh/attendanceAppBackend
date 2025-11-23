const mongoose = require('mongoose');

const StudentProfileSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true, // A User can only have one StudentProfile
  },
  studentId: {
    type: String,
    required: true,
    unique: true, // Unique internal ID for the student
    trim: true,
  },
  qrCode: {
    type: String,
    required: true,
    unique: true, // Each student has a unique QR code for attendance
  },
  currentClass: { // Denormalized for quick access to primary class
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
    required: false, // Student might not be assigned to a class immediately
  },
  // We can add more student-specific details here, like guardian info, address etc.
}, { timestamps: true });

module.exports = mongoose.model('StudentProfile', StudentProfileSchema);
