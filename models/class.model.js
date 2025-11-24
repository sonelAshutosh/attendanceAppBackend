const mongoose = require('mongoose');

const ClassSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Class name is required'],
    unique: true,
    trim: true,
  },
  code: {
    type: String,
    required: [true, 'Class code is required'],
    unique: true,
    trim: true,
    uppercase: true,
    minlength: 5,
    maxlength: 10,
  },
  description: {
    type: String,
    trim: true,
  },
  teacherId: { // Primary teacher for the class
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'A class must have a primary teacher'],
  },
  students: [{ // Array of students enrolled in this class
    type: mongoose.Schema.Types.ObjectId,
    ref: 'StudentProfile',
  }],
  subjects: [{ // Array of subjects taught in this class
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject',
  }],
}, { timestamps: true });

module.exports = mongoose.model('Class', ClassSchema);
