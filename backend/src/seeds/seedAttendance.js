require('dotenv').config();
const { Op } = require('sequelize');
const { sequelize } = require('../config/database');
require('../models');

const Student = require('../models/Student');
const Attendance = require('../models/Attendance');

const SAMPLE_DAYS = Number.parseInt(process.env.ATTENDANCE_SAMPLE_DAYS || '14', 10);
const STUDENT_LIMIT = Number.parseInt(process.env.ATTENDANCE_SAMPLE_STUDENT_LIMIT || '50', 10);
const PRESENT_PROBABILITY = 0.82;
const DEVICE_IDS = ['BIO-A1', 'BIO-A2', 'BIO-B1', 'BIO-C1'];

const formatDate = (date) => date.toISOString().split('T')[0];

const toTime = (hours, minutes) => {
  const hh = String(hours).padStart(2, '0');
  const mm = String(minutes).padStart(2, '0');
  return `${hh}:${mm}:00`;
};

const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

const buildSampleTimes = () => {
  const checkInHour = randomInt(6, 9);
  const checkInMinute = randomInt(0, 59);
  const checkOutHour = randomInt(17, 21);
  const checkOutMinute = randomInt(0, 59);

  return {
    checkInTime: toTime(checkInHour, checkInMinute),
    checkOutTime: toTime(checkOutHour, checkOutMinute)
  };
};

async function seedAttendance() {
  try {
    console.log('Connecting to database...');
    await sequelize.authenticate();
    await sequelize.sync();

    const students = await Student.findAll({
      order: [['id', 'ASC']],
      limit: STUDENT_LIMIT
    });

    if (students.length === 0) {
      console.log('No students found. Create students before seeding attendance.');
      process.exit(0);
    }

    let createdCount = 0;
    let skippedCount = 0;

    for (const student of students) {
      for (let offset = 0; offset < SAMPLE_DAYS; offset += 1) {
        const date = new Date();
        date.setDate(date.getDate() - offset);
        const dateString = formatDate(date);

        const existing = await Attendance.findOne({
          where: {
            StudentId: student.id,
            date: {
              [Op.eq]: dateString
            }
          }
        });

        if (existing) {
          skippedCount += 1;
          continue;
        }

        const isPresent = Math.random() <= PRESENT_PROBABILITY;
        const timings = isPresent ? buildSampleTimes() : { checkInTime: null, checkOutTime: null };

        await Attendance.create({
          StudentId: student.id,
          date: dateString,
          checkInTime: timings.checkInTime,
          checkOutTime: timings.checkOutTime,
          deviceId: DEVICE_IDS[randomInt(0, DEVICE_IDS.length - 1)]
        });

        createdCount += 1;
      }
    }

    console.log(`Students processed: ${students.length}`);
    console.log(`Attendance records created: ${createdCount}`);
    console.log(`Attendance records skipped (already existed): ${skippedCount}`);
    console.log('Attendance sample seeding complete.');

    process.exit(0);
  } catch (error) {
    console.error('Attendance seed failed:', error);
    process.exit(1);
  }
}

seedAttendance();