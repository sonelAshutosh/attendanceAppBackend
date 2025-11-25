const mongoose = require('mongoose')

const AttendanceSessionSchema = new mongoose.Schema(
  {
    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Class',
      required: [true, 'Class ID is required for an attendance session'],
    },
    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Teacher ID is required for an attendance session'],
    },
    sessionDate: {
      type: Date,
      required: [true, 'Session date is required'],
      default: Date.now,
    },
    startTime: {
      type: Date,
      required: [true, 'Session start time is required'],
    },
    endTime: {
      type: Date,
      default: null, // Null if the session is still active
    },
    status: {
      type: String,
      enum: ['Active', 'Completed', 'Cancelled'],
      default: 'Active',
      required: true,
    },
    attendanceType: {
      type: String,
      enum: ['QR', 'Swipe'],
      required: [true, 'Attendance type is required'],
    },
  },
  { timestamps: true }
)

module.exports = mongoose.model('AttendanceSession', AttendanceSessionSchema)
