const mongoose = require('mongoose')
const dotenv = require('dotenv')
const QRCode = require('qrcode')

// Load env vars
dotenv.config({ path: '.env' })

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)

const StudentProfile = require('./models/studentProfile.model')
const User = require('./models/user.model')

const createMissingStudentProfiles = async () => {
  try {
    // Find all students
    const students = await User.find({ role: 'Student' })
    console.log(`Found ${students.length} students`)

    for (const student of students) {
      // Check if student profile exists
      const existingProfile = await StudentProfile.findOne({
        userId: student._id,
      })

      if (!existingProfile) {
        console.log(`Creating profile for ${student.email}...`)

        // Generate student ID
        const studentId = `STU${Date.now().toString().slice(-8)}`

        // Generate QR code
        const qrCodeData = JSON.stringify({
          studentId,
          userId: student._id,
          name: `${student.firstName} ${student.lastName}`,
        })
        const qrCode = await QRCode.toDataURL(qrCodeData)

        // Create student profile
        await StudentProfile.create({
          userId: student._id,
          studentId,
          qrCode,
        })

        console.log(`✓ Created profile for ${student.email}`)
      } else {
        console.log(`Profile already exists for ${student.email}`)
      }
    }

    console.log('Done!')
    process.exit(0)
  } catch (error) {
    console.error('Error:', error)
    process.exit(1)
  }
}

createMissingStudentProfiles()
