const asyncHandler = require('../utils/asyncHandler')
const AppError = require('../utils/appError')
const AttendanceSession = require('../models/attendanceSession.model')
const AttendanceRecord = require('../models/attendanceRecord.model')
const StudentProfile = require('../models/studentProfile.model')
const Class = require('../models/class.model')

// @desc    Start a new attendance session
// @route   POST /api/attendance/sessions/start
// @access  Private/Teacher
exports.startSession = asyncHandler(async (req, res, next) => {
  const { classId, attendanceType } = req.body
  const teacherId = req.user._id

  if (!classId || !attendanceType) {
    return next(new AppError('Please provide classId and attendanceType', 400))
  }

  // Ensure the teacher is assigned to this class
  const assignedClass = await Class.findOne({
    _id: classId,
    teacherId: teacherId,
  })
  if (!assignedClass) {
    return next(
      new AppError(
        'You are not authorized to start a session for this class',
        403
      )
    )
  }

  // Check for an existing active session for the same class
  const existingSession = await AttendanceSession.findOne({
    classId,
    status: 'Active',
  })
  if (existingSession) {
    return next(
      new AppError('An active session for this class already exists', 400)
    )
  }

  const session = await AttendanceSession.create({
    classId,
    teacherId,
    attendanceType,
    startTime: Date.now(),
  })

  res.status(201).json({ success: true, data: session })
})

// @desc    End an attendance session
// @route   PUT /api/attendance/sessions/:id/end
// @access  Private/Teacher
exports.endSession = asyncHandler(async (req, res, next) => {
  const session = await AttendanceSession.findById(req.params.id)

  if (!session) {
    return next(new AppError('Session not found', 404))
  }
  if (session.teacherId.toString() !== req.user._id.toString()) {
    return next(new AppError('Not authorized to end this session', 403))
  }
  if (session.status !== 'Active') {
    return next(new AppError(`Session is already ${session.status}`, 400))
  }

  session.status = 'Completed'
  session.endTime = Date.now()
  await session.save()

  res.status(200).json({ success: true, data: session })
})

// @desc    Cancel an attendance session
// @route   PUT /api/attendance/sessions/:id/cancel
// @access  Private/Teacher
exports.cancelSession = asyncHandler(async (req, res, next) => {
  const session = await AttendanceSession.findById(req.params.id)

  if (!session) {
    return next(new AppError('Session not found', 404))
  }
  if (session.teacherId.toString() !== req.user._id.toString()) {
    return next(new AppError('Not authorized to cancel this session', 403))
  }

  session.status = 'Cancelled'
  session.endTime = Date.now()
  await session.save()

  res.status(200).json({ success: true, data: session })
})

// @desc    Get active sessions for a teacher
// @route   GET /api/attendance/sessions/active
// @access  Private/Teacher
exports.getActiveTeacherSessions = asyncHandler(async (req, res, next) => {
  const sessions = await AttendanceSession.find({
    teacherId: req.user._id,
    status: 'Active',
  }).populate('classId', 'name subject')
  res.status(200).json({ success: true, data: sessions })
})

// @desc    Get all sessions (filtered)
// @route   GET /api/attendance/sessions
// @access  Private/Admin, Teacher
exports.getAllSessions = asyncHandler(async (req, res, next) => {
  let query = { ...req.query }
  if (req.user.role === 'Teacher') {
    query.teacherId = req.user._id.toString()
  }
  const sessions = await AttendanceSession.find(query)
    .populate('classId', 'name subject')
    .sort({ startTime: -1 })

  res
    .status(200)
    .json({ success: true, count: sessions.length, data: sessions })
})

// @desc    Get session details
// @route   GET /api/attendance/sessions/:id
// @access  Private/Admin, Teacher
exports.getSessionDetails = asyncHandler(async (req, res, next) => {
  const session = await AttendanceSession.findById(req.params.id).populate(
    'classId',
    'name subject'
  )

  if (!session) {
    return next(new AppError('Session not found', 404))
  }
  // Auth check
  if (
    req.user.role === 'Teacher' &&
    session.teacherId.toString() !== req.user._id.toString()
  ) {
    return next(new AppError('Not authorized to view this session', 403))
  }
  res.status(200).json({ success: true, data: session })
})

// @desc    Mark attendance via QR code
// @route   POST /api/attendance/records/qr
// @access  Private/Teacher
exports.markQrAttendance = asyncHandler(async (req, res, next) => {
  const { sessionId, qrCode } = req.body

  const session = await AttendanceSession.findById(sessionId)
  if (!session || session.status !== 'Active') {
    return next(new AppError('Session is not active or does not exist', 400))
  }

  // Auth check
  if (session.teacherId.toString() !== req.user._id.toString()) {
    return next(new AppError('Not authorized for this session', 403))
  }

  const studentProfile = await StudentProfile.findOne({ qrCode: qrCode })
  if (!studentProfile) {
    return next(new AppError('Invalid QR code. Student not found.', 404))
  }

  // Check if student is in the class for this session
  const classData = await Class.findById(session.classId)
  if (!classData.students.includes(studentProfile._id)) {
    return next(
      new AppError(
        `Student ${studentProfile.studentId} is not in this class.`,
        400
      )
    )
  }

  const existingRecord = await AttendanceRecord.findOne({
    sessionId,
    studentProfileId: studentProfile._id,
  })
  if (existingRecord) {
    return next(
      new AppError('Student has already been marked for this session', 400)
    )
  }

  const record = await AttendanceRecord.create({
    sessionId,
    studentProfileId: studentProfile._id,
    status: 'Present', // QR scan always marks as present
  })

  res.status(201).json({ success: true, data: record })
})

// @desc    Mark manual attendance (for Swipe/List view)
// @route   POST /api/attendance/records/manual
// @access  Private/Teacher
exports.markManualAttendance = asyncHandler(async (req, res, next) => {
  const { sessionId, studentProfileId, status } = req.body

  const session = await AttendanceSession.findById(sessionId)
  if (!session || session.status !== 'Active') {
    return next(new AppError('Session is not active or does not exist', 400))
  }

  // Auth check
  if (session.teacherId.toString() !== req.user._id.toString()) {
    return next(new AppError('Not authorized for this session', 403))
  }

  // Check if student is in the class for this session
  const classData = await Class.findById(session.classId)
  if (!classData.students.includes(studentProfileId)) {
    return next(new AppError('Student is not in this class', 400))
  }

  // Check if record exists
  let record = await AttendanceRecord.findOne({
    sessionId,
    studentProfileId,
  })

  if (record) {
    // Update existing record
    record.status = status
    record.timestamp = Date.now()
    await record.save()
  } else {
    // Create new record
    record = await AttendanceRecord.create({
      sessionId,
      studentProfileId,
      status, // 'Present' or 'Absent'
      timestamp: Date.now(),
    })
  }

  res.status(201).json({ success: true, data: record })
})

// @desc    Mark attendance via swipe
// @route   POST /api/attendance/records/swipe
// @access  Private/Teacher
exports.markSwipeAttendance = asyncHandler(async (req, res, next) => {
  const { classId, subjectId, records } = req.body // records is an array of { studentProfileId, status }

  if (!records || records.length === 0) {
    return next(new AppError('No attendance records provided', 400))
  }

  // Start a new session for this swipe action
  const session = await AttendanceSession.create({
    classId,
    subjectId,
    teacherId: req.user._id,
    attendanceType: 'Swipe',
    startTime: Date.now(),
    endTime: Date.now(), // Swipe sessions are completed instantly
    status: 'Completed',
  })

  const recordsToInsert = records.map((rec) => ({
    ...rec,
    sessionId: session._id,
  }))

  const createdRecords = await AttendanceRecord.insertMany(recordsToInsert)

  res.status(201).json({
    success: true,
    data: {
      session,
      createdRecords,
    },
  })
})

// @desc    Get records for a session
// @route   GET /api/attendance/records/session/:sessionId
// @access  Private/Admin, Teacher
exports.getSessionRecords = asyncHandler(async (req, res, next) => {
  const records = await AttendanceRecord.find({
    sessionId: req.params.sessionId,
  }).populate({
    path: 'studentProfileId',
    select: 'studentId',
    populate: { path: 'userId', select: 'firstName lastName' },
  })
  res.status(200).json({ success: true, count: records.length, data: records })
})

// @desc    Get records for a student
// @route   GET /api/attendance/records/student/:studentProfileId
// @access  Private/Admin, Teacher, Student
exports.getStudentRecords = asyncHandler(async (req, res, next) => {
  // If user is a student, they can only see their own records
  if (req.user.role === 'Student') {
    const profile = await StudentProfile.findOne({ userId: req.user._id })
    if (profile._id.toString() !== req.params.studentProfileId) {
      return next(new AppError('Not authorized to view these records', 403))
    }
  }

  const records = await AttendanceRecord.find({
    studentProfileId: req.params.studentProfileId,
  }).populate('sessionId')
  res.status(200).json({ success: true, count: records.length, data: records })
})

// @desc    Update an attendance record
// @route   PUT /api/attendance/records/:id
// @access  Private/Admin, Teacher
exports.updateAttendanceRecord = asyncHandler(async (req, res, next) => {
  const record = await AttendanceRecord.findByIdAndUpdate(
    req.params.id,
    req.body,
    {
      new: true,
      runValidators: true,
    }
  )
  if (!record) {
    return next(new AppError('Record not found', 404))
  }
  res.status(200).json({ success: true, data: record })
})
