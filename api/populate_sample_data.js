// Sample Data Population Script for Smart School MongoDB

const { MongoClient } = require('mongodb');
require('dotenv').config();

async function populateSampleData() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/SmartCore';
  console.log('Connecting to MongoDB with URI:', uri.substring(0, 50) + '...'); // Log first 50 chars for security
  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db('SmartCore');

    console.log('Connected to MongoDB');

    // Drop existing collections first to avoid index conflicts
    console.log('Dropping existing collections...');
    const collections = [
      'students', 'studentAcademics', 'courses', 'departments', 'studentCourses',
      'userCredentials', 'instructorCourseMaps', 'courseClassMaps', 'periodDefs',
      'schools', 'timeTables', 'userPersons', 'studentAttendances', 'stgDers',
      'stgOgretmen', 'stgSubeDersler', 'studentStg', 'studentAcademicStg', 'studentCourseStg'
    ];

    for (const collectionName of collections) {
      try {
        await db.collection(collectionName).drop();
        console.log(`Dropped collection: ${collectionName}`);
      } catch (err) {
        // Collection doesn't exist, that's fine
        console.log(`Collection ${collectionName} does not exist or already dropped`);
      }
    }

    // Wait a moment for collections to be fully dropped
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Insert Schools
    console.log('Inserting schools...');
    await db.collection('schools').insertMany([
      {
        schoolCode: "SC001",
        schoolName: "Smart High School"
      },
      {
        schoolCode: "SC002",
        schoolName: "Intelligent Elementary School"
      }
    ]);

    // Insert Departments
    console.log('Inserting departments...');
    await db.collection('departments').insertMany([
      {
        departmentKey: 1,
        schoolCode: "SC001",
        academicPeriod: "2025-2026",
        departmentName: "10A",
        departmentExternalId: "10A",
        isActive: true,
        createdAt: new Date()
      },
      {
        departmentKey: 2,
        schoolCode: "SC001",
        academicPeriod: "2025-2026",
        departmentName: "10B",
        departmentExternalId: "10B",
        isActive: true,
        createdAt: new Date()
      }
    ]);

    // Insert Courses
    console.log('Inserting courses...');
    await db.collection('courses').insertMany([
      {
        courseKey: 1,
        schoolCode: "SC001",
        academicPeriod: "2025-2026",
        courseId: 101,
        courseExternalId: "MATH101",
        courseName: "Mathematics",
        courseNameEn: "Mathematics"
      },
      {
        courseKey: 2,
        schoolCode: "SC001",
        academicPeriod: "2025-2026",
        courseId: 102,
        courseExternalId: "PHY101",
        courseName: "Physics",
        courseNameEn: "Physics"
      },
      {
        courseKey: 3,
        schoolCode: "SC001",
        academicPeriod: "2025-2026",
        courseId: 103,
        courseExternalId: "CHEM101",
        courseName: "Chemistry",
        courseNameEn: "Chemistry"
      }
    ]);

    // Insert Students
    console.log('Inserting students...');
    await db.collection('students').insertMany([
      {
        id: 1,
        idNumber: "STU001",
        firstName: "Ahmet",
        lastName: "Yılmaz",
        gender: 1,
        fatherName: "Mehmet Yılmaz",
        motherName: "Fatma Yılmaz",
        createdAt: new Date()
      },
      {
        id: 2,
        idNumber: "STU002",
        firstName: "Ayşe",
        lastName: "Kaya",
        gender: 0,
        fatherName: "Ali Kaya",
        motherName: "Emine Kaya",
        createdAt: new Date()
      },
      {
        id: 3,
        idNumber: "STU003",
        firstName: "Mehmet",
        lastName: "Demir",
        fatherName: "Hasan Demir",
        motherName: "Zeynep Demir",
        gender: 1,
        createdAt: new Date()
      }
    ]);

    // Insert Student Academics
    console.log('Inserting student academics...');
    await db.collection('studentAcademics').insertMany([
      {
        id: 1,
        studentId: 1,
        smartId: 1001,
        schoolNumber: 12345,
        schoolCode: "SC001",
        classId: 1,
        departmentKey: 1,
        status: 1,
        createdAt: new Date()
      },
      {
        id: 2,
        studentId: 2,
        smartId: 1002,
        schoolNumber: 12346,
        schoolCode: "SC001",
        classId: 1,
        departmentKey: 1,
        status: 1,
        createdAt: new Date()
      },
      {
        id: 3,
        studentId: 3,
        smartId: 1003,
        schoolNumber: 12347,
        schoolCode: "SC001",
        classId: 1,
        departmentKey: 2,
        status: 1,
        createdAt: new Date()
      }
    ]);

    // Insert User Persons
    console.log('Inserting user persons...');
    await db.collection('userPersons').insertMany([
      {
        userId: 1,
        idNumber: "USR001",
        fullName: "John Smith",
        globalLock: false,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        userId: 2,
        idNumber: "USR002",
        fullName: "Jane Doe",
        globalLock: false,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        userId: 3,
        idNumber: "USR003",
        fullName: "Robert Johnson",
        globalLock: false,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);

    // Insert User Credentials
    console.log('Inserting user credentials...');
    await db.collection('userCredentials').insertMany([
      {
        credentialId: 1,
        userId: 1,
        schoolCode: "SC001",
        username: "john.smith",
        passHash: "$2b$10$example_hash",
        role: "Teacher",
        isLocked: false,
        lastLoginAt: new Date(),
        passwordUpdatedAt: new Date(),
        createdAt: new Date(),
        ascTeacherUid: "ASC001",
        smartSchoolId: 2001
      },
      {
        credentialId: 2,
        userId: 2,
        schoolCode: "SC001",
        username: "jane.doe",
        passHash: "$2b$10$example_hash",
        role: "Admin",
        isLocked: false,
        lastLoginAt: new Date(),
        passwordUpdatedAt: new Date(),
        createdAt: new Date(),
        ascTeacherUid: "ASC002",
        smartSchoolId: 2002
      },
      {
        credentialId: 3,
        userId: 3,
        schoolCode: "SC001",
        username: "robert.johnson",
        passHash: "$2b$10$example_hash",
        role: "Teacher",
        isLocked: false,
        lastLoginAt: new Date(),
        passwordUpdatedAt: new Date(),
        createdAt: new Date(),
        ascTeacherUid: "ASC003",
        smartSchoolId: 2003
      }
    ]);

    // Insert Course Class Maps
    console.log('Inserting course class maps...');
    await db.collection('courseClassMaps').insertMany([
      {
        id: 1,
        courseKey: 1,
        departmentKey: 1,
        isActive: true,
        createdAt: new Date()
      },
      {
        id: 2,
        courseKey: 2,
        departmentKey: 1,
        isActive: true,
        createdAt: new Date()
      },
      {
        id: 3,
        courseKey: 1,
        departmentKey: 2,
        isActive: true,
        createdAt: new Date()
      }
    ]);

    // Insert Instructor Course Maps
    console.log('Inserting instructor course maps...');
    await db.collection('instructorCourseMaps').insertMany([
      {
        id: 1,
        userId: 1,
        courseKey: 1,
        isActive: true,
        createdAt: new Date()
      },
      {
        id: 2,
        userId: 1,
        courseKey: 2,
        isActive: true,
        createdAt: new Date()
      },
      {
        id: 3,
        userId: 3,
        courseKey: 1,
        isActive: true,
        createdAt: new Date()
      }
    ]);

    // Insert Period Definitions
    console.log('Inserting period definitions...');
    await db.collection('periodDefs').insertMany([
      {
        schoolCode: "SC001",
        academicPeriod: "2025-2026",
        periodNo: 1,
        startTime: "08:30:00",
        endTime: "09:15:00"
      },
      {
        schoolCode: "SC001",
        academicPeriod: "2025-2026",
        periodNo: 2,
        startTime: "09:25:00",
        endTime: "10:10:00"
      },
      {
        schoolCode: "SC001",
        academicPeriod: "2025-2026",
        periodNo: 3,
        startTime: "10:20:00",
        endTime: "11:05:00"
      }
    ]);

    // Insert Time Tables
    console.log('Inserting time tables...');
    await db.collection('timeTables').insertMany([
      {
        id: 1,
        academicPeriod: "2025-2026",
        schoolCode: "SC001",
        teacherUId: "ASC001",
        dayCode: "MON",
        dayOfWeek: 1,
        periodNo: 1,
        subjectName: "Mathematics",
        classList: "10A",
        roomShortName: "MATH1"
      },
      {
        id: 2,
        academicPeriod: "2025-2026",
        schoolCode: "SC001",
        teacherUId: "ASC001",
        dayCode: "MON",
        dayOfWeek: 1,
        periodNo: 2,
        subjectName: "Physics",
        classList: "10A",
        roomShortName: "PHY1"
      },
      {
        id: 3,
        academicPeriod: "2025-2026",
        schoolCode: "SC001",
        teacherUId: "ASC003",
        dayCode: "MON",
        dayOfWeek: 1,
        periodNo: 3,
        subjectName: "Mathematics",
        classList: "10B",
        roomShortName: "MATH2"
      }
    ]);

    // Insert Sample Grades
    console.log('Inserting sample student courses (grades)...');
    await db.collection('studentCourses').insertMany([
      {
        id: 1,
        studentAcademicId: 1,
        courseKey: 1,
        homeWork1: 85,
        midterm1: 78,
        final1: 82,
        homeWork2: null,
        midterm2: null,
        final2: null,
        letterGrade1: "BB",
        letterGrade2: null,
        effortGrade1: "Good",
        effortGrade2: null,
        isNumber: true,
        updatedAtUtc: new Date(),
        updatedBy: "john.smith"
      },
      {
        id: 2,
        studentAcademicId: 1,
        courseKey: 2,
        homeWork1: 90,
        midterm1: 85,
        final1: 88,
        homeWork2: 92,
        midterm2: 88,
        final2: 90,
        letterGrade1: "BA",
        letterGrade2: "A",
        effortGrade1: "Very Good",
        effortGrade2: "Excellent",
        isNumber: true,
        updatedAtUtc: new Date(),
        updatedBy: "john.smith"
      },
      {
        id: 3,
        studentAcademicId: 2,
        courseKey: 1,
        homeWork1: 75,
        midterm1: 80,
        final1: 77,
        homeWork2: null,
        midterm2: null,
        final2: null,
        letterGrade1: "CB",
        letterGrade2: null,
        effortGrade1: "Good",
        effortGrade2: null,
        isNumber: true,
        updatedAtUtc: new Date(),
        updatedBy: "john.smith"
      }
    ]);

    // Insert Student Attendances
    console.log('Inserting student attendances...');
    await db.collection('studentAttendances').insertMany([
      {
        id: 1,
        studentAcademicId: 1,
        courseKey: 1,
        attendanceDate: new Date("2025-10-12"),
        periodNo: 1,
        status: 1, // Present
        note: "On time",
        updatedAtUtc: new Date(),
        updatedBy: "john.smith"
      },
      {
        id: 2,
        studentAcademicId: 1,
        courseKey: 1,
        attendanceDate: new Date("2025-10-13"),
        periodNo: 1,
        status: 0, // Absent
        note: "Sick leave",
        updatedAtUtc: new Date(),
        updatedBy: "john.smith"
      },
      {
        id: 3,
        studentAcademicId: 2,
        courseKey: 1,
        attendanceDate: new Date("2025-10-12"),
        periodNo: 1,
        status: 1, // Present
        note: "Late by 5 minutes",
        updatedAtUtc: new Date(),
        updatedBy: "john.smith"
      }
    ]);

    // Insert Staging Data - Stg_Ders
    console.log('Inserting staging ders data...');
    await db.collection('stgDers').insertMany([
      {
        schoolCode: "SC001",
        academicPeriod: "2025-2026",
        id: 101,
        dersadi: "Mathematics",
        ingilizceadi: "Mathematics",
        kisaadi: "MATH",
        ascid: "MATH001"
      },
      {
        schoolCode: "SC001",
        academicPeriod: "2025-2026",
        id: 102,
        dersadi: "Physics",
        ingilizceadi: "Physics",
        kisaadi: "PHY",
        ascid: "PHY001"
      }
    ]);

    // Insert Staging Data - Stg_Ogretmen
    console.log('Inserting staging ogretmen data...');
    await db.collection('stgOgretmen').insertMany([
      {
        schoolCode: "SC001",
        academicPeriod: "2025-2026",
        sirano: 2001,
        ascid: "ASC001"
      },
      {
        schoolCode: "SC001",
        academicPeriod: "2025-2026",
        sirano: 2002,
        ascid: "ASC002"
      }
    ]);

    // Insert Staging Data - Stg_SubeDersler
    console.log('Inserting staging sube dersler data...');
    await db.collection('stgSubeDersler').insertMany([
      {
        schoolCode: "SC001",
        academicPeriod: "2025-2026",
        dersid: 101,
        sinifsube: "10A",
        dersogretmenino: 2001,
        dersogretmenino2: null,
        dersogretmenino3: null,
        dersogretmenino4: null,
        dersogretmenino5: null,
        dersogretmenino6: null,
        dersogretmenino7: null,
        dersogretmenino8: null,
        dersogretmenino9: null,
        dersogretmenino10: null,
        aktif: true
      },
      {
        schoolCode: "SC001",
        academicPeriod: "2025-2026",
        dersid: 102,
        sinifsube: "10A",
        dersogretmenino: 2001,
        dersogretmenino2: 2003, // Assigning a second teacher
        dersogretmenino3: null,
        dersogretmenino4: null,
        dersogretmenino5: null,
        dersogretmenino6: null,
        dersogretmenino7: null,
        dersogretmenino8: null,
        dersogretmenino9: null,
        dersogretmenino10: null,
        aktif: true
      }
    ]);

    // Insert Staging Data - Student_Stg
    console.log('Inserting staging student data...');
    await db.collection('studentStg').insertMany([
      {
        idNumber: "STU001",
        firstName: "Ahmet",
        lastName: "Yılmaz",
        gender: 1,
        fatherName: "Mehmet Yılmaz",
        motherName: "Fatma Yılmaz",
        createdAt: new Date()
      },
      {
        idNumber: "STU002",
        firstName: "Ayşe",
        lastName: "Kaya",
        gender: 0,
        fatherName: "Ali Kaya",
        motherName: "Emine Kaya",
        createdAt: new Date()
      }
    ]);

    // Insert Staging Data - StudentAcademic_Stg
    console.log('Inserting staging student academic data...');
    await db.collection('studentAcademicStg').insertMany([
      {
        idNumber: "STU001",
        smartId: 1001,
        schoolNumber: 12345,
        schoolCode: "SC001",
        classId: 1,
        departmentName: "10A",
        status: 1,
        createdAt: new Date(),
        academicPeriod: "2025-2026"
      },
      {
        idNumber: "STU002",
        smartId: 1002,
        schoolNumber: 12346,
        schoolCode: "SC001",
        classId: 1,
        departmentName: "10A",
        status: 1,
        createdAt: new Date(),
        academicPeriod: "2025-2026"
      }
    ]);

    // Insert Staging Data - StudentCourse_Stg
    console.log('Inserting staging student course data...');
    await db.collection('studentCourseStg').insertMany([
      {
        smartSchoolId: 1001,
        schoolCode: "SC001",
        academicPeriod: "2025-2026",
        courseId: 101,
        departmentName: "10A",
        homeWork1: 85,
        midterm1: 78,
        final1: 82,
        homeWork2: null,
        midterm2: null,
        final2: null,
        letterGrade1: "BB",
        letterGrade2: null,
        effortGrade1: "Good",
        effortGrade2: null,
        isNumber: true,
        updatedAtUtc: new Date(),
        updatedBy: "john.smith"
      },
      {
        smartSchoolId: 1001,
        schoolCode: "SC001",
        academicPeriod: "2025-2026",
        courseId: 102,
        departmentName: "10A",
        homeWork1: 90,
        midterm1: 85,
        final1: 88,
        homeWork2: 92,
        midterm2: 88,
        final2: 90,
        letterGrade1: "BA",
        letterGrade2: "A",
        effortGrade1: "Very Good",
        effortGrade2: "Excellent",
        isNumber: true,
        updatedAtUtc: new Date(),
        updatedBy: "john.smith"
      }
    ]);

    console.log('Sample data populated successfully!');

  } catch (error) {
    console.error('Error populating sample data:', error);
  } finally {
    await client.close();
    console.log('Disconnected from MongoDB');
  }
}

// Run the script
populateSampleData().catch(console.error);