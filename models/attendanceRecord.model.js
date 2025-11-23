const mongoose = require('mongoose');

const AttendanceRecordSchema = new mongoose.Schema({
  sessionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AttendanceSession',
    required: [true, 'Session ID is required for an attendance record'],
  },
  studentProfileId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'StudentProfile',
    required: [true, 'Student Profile ID is required for an attendance record'],
  },
  status: {
    type: String,
    enum: ['Present', 'Absent', 'Late', 'Excused'], // Keeping options open for future expansion
    default: 'Present', // Most common status
    required: true,
  },
  markedAt: { // When the attendance was marked for this specific student
    type: Date,
    default: Date.now,
  },
  // Optional: If we want to record who manually marked/overrode the attendance
  // markedBy: {
  //   type: mongoose.Schema.Types.ObjectId,
  //   ref: 'User',
  //   required: false,
  // },
}, { timestamps: true });

// Ensure a student has only one attendance record per session
AttendanceRecordSchema.index({ sessionId: 1, studentProfileId: 1 }, { unique: true });

module.exports = mongoose.model('AttendanceRecord', AttendanceRecordSchema);
