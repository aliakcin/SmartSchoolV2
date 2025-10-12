cat > /Users/meteakcin/Downloads/populate_mongodb.js << 'EOF'
// MongoDB Population Script for School Management System

// Connect to your database
use SmartCore

// Collections and Indexes
print("Creating collections and indexes...");

db.createCollection("schools")
db.schools.createIndex({ "schoolCode": 1 }, { unique: true })

db.createCollection("departments")
db.departments.createIndex({ "schoolCode": 1, "academicPeriod": 1, "departmentName": 1 }, { unique: true })
db.departments.createIndex({ "departmentKey": 1 }, { unique: true })

db.createCollection("courses")
db.courses.createIndex({ "schoolCode": 1, "academicPeriod": 1, "courseId": 1 }, { unique: true })
db.courses.createIndex({ "courseKey": 1 }, { unique: true })

db.createCollection("students")
db.students.createIndex({ "idNumber": 1 }, { unique: true })

db.createCollection("studentAcademics")
db.studentAcademics.createIndex({ "studentId": 1, "schoolCode": 1, "departmentKey": 1 }, { unique: true })
db.studentAcademics.createIndex({ "smartId": 1 })

db.createCollection("studentCourses")
db.studentCourses.createIndex({ "studentAcademicId": 1, "courseKey": 1 }, { unique: true })

db.createCollection("userPersons")
db.userPersons.createIndex({ "idNumber": 1 }, { unique: true })
db.userPersons.createIndex({ "userId": 1 }, { unique: true })

db.createCollection("userCredentials")
db.userCredentials.createIndex({ "username": 1, "schoolCode": 1 }, { unique: true })
db.userCredentials.createIndex({ "userId": 1 })
db.userCredentials.createIndex({ "smartSchoolId": 1 })

db.createCollection("instructorCourseMaps")
db.instructorCourseMaps.createIndex({ "userId": 1, "courseKey": 1 }, { unique: true })

db.createCollection("courseClassMaps")
db.courseClassMaps.createIndex({ "courseKey": 1, "departmentKey": 1 }, { unique: true })

db.createCollection("timeTables")
db.timeTables.createIndex({ "id": 1 }, { unique: true })

db.createCollection("periodDefs")
db.periodDefs.createIndex({ "schoolCode": 1, "academicPeriod": 1, "periodNo": 1 }, { unique: true })

print("Collections and indexes created successfully.");

// Sample Data
print("Populating sample data...");

db.schools.insertMany([
  {
    schoolCode: "SC001",
    schoolName: "Smart High School",
    createdAt: new Date()
  },
  {
    schoolCode: "SC002",
    schoolName: "Intelligent Elementary School",
    createdAt: new Date()
  }
])

db.departments.insertMany([
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
])

db.courses.insertMany([
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
  }
])

db.students.insertMany([
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
])

db.studentAcademics.insertMany([
  {
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
    studentId: 2,
    smartId: 1002,
    schoolNumber: 12346,
    schoolCode: "SC001",
    classId: 1,
    departmentKey: 1,
    status: 1,
    createdAt: new Date()
  }
])

db.userPersons.insertMany([
  {
    idNumber: "USR001",
    fullName: "John Smith",
    globalLock: false,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    idNumber: "USR002",
    fullName: "Jane Doe",
    globalLock: false,
    createdAt: new Date(),
    updatedAt: new Date()
  }
])

db.userCredentials.insertMany([
  {
    userId: 1,
    schoolCode: "SC001",
    username: "john.smith",
    passHash: "\$2b\$10\$example_hash",
    role: "Teacher",
    isLocked: false,
    lastLoginAt: new Date(),
    passwordUpdatedAt: new Date(),
    createdAt: new Date(),
    ascTeacherUid: "ASC001",
    smartSchoolId: 2001
  },
  {
    userId: 2,
    schoolCode: "SC001",
    username: "jane.doe",
    passHash: "\$2b\$10\$example_hash",
    role: "Admin",
    isLocked: false,
    lastLoginAt: new Date(),
    passwordUpdatedAt: new Date(),
    createdAt: new Date(),
    ascTeacherUid: "ASC002",
    smartSchoolId: 2002
  }
])

db.courseClassMaps.insertMany([
  {
    courseKey: 1,
    departmentKey: 1,
    isActive: true,
    createdAt: new Date()
  },
  {
    courseKey: 2,
    departmentKey: 1,
    isActive: true,
    createdAt: new Date()
  }
])

db.instructorCourseMaps.insertMany([
  {
    userId: 1,
    courseKey: 1,
    isActive: true,
    createdAt: new Date()
  },
  {
    userId: 1,
    courseKey: 2,
    isActive: true,
    createdAt: new Date()
  }
])

db.periodDefs.insertMany([
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
  }
])

db.timeTables.insertMany([
  {
    academicPeriod: "2025-2026",
    schoolCode: "SC001",
    teacherUId: "ASC001",
    dayCode: "MON",
    dayOfWeek: 1,
    periodNo: 1,
    subjectName: "Mathematics",
    classList: "10A",
    roomShortName: "MATH1"
  }
])

print("Sample data populated successfully.");
EOF