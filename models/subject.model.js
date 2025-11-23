const mongoose = require('mongoose');

const SubjectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Subject name is required'],
    unique: true, // Subject names should be unique globally
    trim: true,
  },
  code: {
    type: String,
    required: [true, 'Subject code is required'],
    unique: true, // Subject codes should be unique globally
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
}, { timestamps: true });

module.exports = mongoose.model('Subject', SubjectSchema);
