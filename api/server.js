const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/SmartCore';
const JWT_SECRET = process.env.JWT_SECRET || 'smart_school_secret_key_2025';

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB connection
let db;
let client;

async function connectToDatabase() {
  try {
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    db = client.db('SmartCore');
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
}

// Authentication middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
}

// Authorization middleware for role-based access
function authorizeRole(roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
}

// Routes

// Login endpoint
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password, schoolCode } = req.body;

    // Validate input
    if (!username || !password) {
      return res.status(400).json({ 
        error: 'Username and password are required' 
      });
    }

    // Find user credential
    const userCredential = await db.collection('userCredentials').findOne({
      username: username,
      schoolCode: schoolCode || 'SC001' // Default to SC001 if not provided
    });

    if (!userCredential) {
      return res.status(401).json({ 
        error: 'Invalid username or password' 
      });
    }

    // Check if user is locked
    if (userCredential.isLocked) {
      return res.status(403).json({ 
        error: 'Account is locked. Please contact administrator.' 
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, userCredential.passHash);
    
    // For development/testing, also check our simple hash
    let isSimplePasswordValid = false;
    if (userCredential.passHash.startsWith('$2b$10$simplehash')) {
      // Simple hash verification for development
      function simpleHash(password) {
        let hash = 0;
        for (let i = 0; i < password.length; i++) {
          const char = password.charCodeAt(i);
          hash = ((hash << 5) - hash) + char;
          hash = hash & hash;
        }
        return "$2b$10$simplehash" + Math.abs(hash).toString(36);
      }
      isSimplePasswordValid = userCredential.passHash === simpleHash(password);
    }

    if (!isPasswordValid && !isSimplePasswordValid) {
      return res.status(401).json({ 
        error: 'Invalid username or password' 
      });
    }

    // Find user person details
    const userPerson = await db.collection('userPersons').findOne({
      userId: userCredential.userId
    });

    if (!userPerson) {
      return res.status(500).json({ 
        error: 'User profile not found' 
      });
    }

    // Update last login time
    await db.collection('userCredentials').updateOne(
      { _id: userCredential._id },
      { $set: { lastLoginAt: new Date() } }
    );

    // Create JWT token
    const token = jwt.sign(
      {
        userId: userCredential.userId,
        username: userCredential.username,
        schoolCode: userCredential.schoolCode,
        role: userCredential.role
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Return user data and token
    const userData = {
      userId: userCredential.userId,
      username: userCredential.username,
      fullName: userPerson.fullName,
      role: userCredential.role,
      schoolCode: userCredential.schoolCode,
      accessToken: token
    };

    res.json({
      message: 'Login successful',
      user: userData
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      error: 'Internal server error' 
    });
  }
});

// Get user profile (protected route)
app.get('/api/user/profile', authenticateToken, async (req, res) => {
  try {
    // Find user credential
    const userCredential = await db.collection('userCredentials').findOne({
      userId: req.user.userId,
      schoolCode: req.user.schoolCode
    });

    if (!userCredential) {
      return res.status(404).json({ 
        error: 'User not found' 
      });
    }

    // Find user person details
    const userPerson = await db.collection('userPersons').findOne({
      userId: userCredential.userId
    });

    if (!userPerson) {
      return res.status(404).json({ 
        error: 'User profile not found' 
      });
    }

    const userData = {
      userId: userCredential.userId,
      username: userCredential.username,
      fullName: userPerson.fullName,
      role: userCredential.role,
      schoolCode: userCredential.schoolCode,
      createdAt: userCredential.createdAt
    };

    res.json(userData);

  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ 
      error: 'Internal server error' 
    });
  }
});

// STUDENTS API
// Get all students (protected)
app.get('/api/students', authenticateToken, async (req, res) => {
  try {
    const students = await db.collection('students').find({}).toArray();
    res.json(students);
  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get student by ID
app.get('/api/students/:id', authenticateToken, async (req, res) => {
  try {
    const student = await db.collection('students').findOne({ 
      _id: new ObjectId(req.params.id) 
    });
    
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }
    
    res.json(student);
  } catch (error) {
    console.error('Error fetching student:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new student (Admin only)
app.post('/api/students', authenticateToken, authorizeRole(['Admin']), async (req, res) => {
  try {
    const studentData = {
      ...req.body,
      createdAt: new Date()
    };
    
    const result = await db.collection('students').insertOne(studentData);
    
    const newStudent = await db.collection('students').findOne({ 
      _id: result.insertedId 
    });
    
    res.status(201).json(newStudent);
  } catch (error) {
    console.error('Error creating student:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update student (Admin only)
app.put('/api/students/:id', authenticateToken, authorizeRole(['Admin']), async (req, res) => {
  try {
    const updateData = { ...req.body };
    delete updateData._id; // Remove ID from update data
    
    const result = await db.collection('students').updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: updateData }
    );
    
    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'Student not found' });
    }
    
    const updatedStudent = await db.collection('students').findOne({ 
      _id: new ObjectId(req.params.id) 
    });
    
    res.json(updatedStudent);
  } catch (error) {
    console.error('Error updating student:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete student (Admin only)
app.delete('/api/students/:id', authenticateToken, authorizeRole(['Admin']), async (req, res) => {
  try {
    const result = await db.collection('students').deleteOne({ 
      _id: new ObjectId(req.params.id) 
    });
    
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Student not found' });
    }
    
    res.json({ message: 'Student deleted successfully' });
  } catch (error) {
    console.error('Error deleting student:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// STUDENT ACADEMICS API
// Get student academics by student ID
app.get('/api/student-academics/student/:studentId', authenticateToken, async (req, res) => {
  try {
    const academics = await db.collection('studentAcademics').find({ 
      studentId: parseInt(req.params.studentId) 
    }).toArray();
    
    res.json(academics);
  } catch (error) {
    console.error('Error fetching student academics:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create student academic record
app.post('/api/student-academics', authenticateToken, authorizeRole(['Admin']), async (req, res) => {
  try {
    const academicData = {
      ...req.body,
      createdAt: new Date()
    };
    
    const result = await db.collection('studentAcademics').insertOne(academicData);
    
    const newAcademic = await db.collection('studentAcademics').findOne({ 
      _id: result.insertedId 
    });
    
    res.status(201).json(newAcademic);
  } catch (error) {
    console.error('Error creating student academic record:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update student academic record
app.put('/api/student-academics/:id', authenticateToken, authorizeRole(['Admin']), async (req, res) => {
  try {
    const updateData = { ...req.body };
    delete updateData._id;
    
    const result = await db.collection('studentAcademics').updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: updateData }
    );
    
    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'Student academic record not found' });
    }
    
    const updatedAcademic = await db.collection('studentAcademics').findOne({ 
      _id: new ObjectId(req.params.id) 
    });
    
    res.json(updatedAcademic);
  } catch (error) {
    console.error('Error updating student academic record:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// COURSES API
// Get all courses
app.get('/api/courses', authenticateToken, async (req, res) => {
  try {
    const courses = await db.collection('courses').find({}).toArray();
    res.json(courses);
  } catch (error) {
    console.error('Error fetching courses:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get course by ID
app.get('/api/courses/:id', authenticateToken, async (req, res) => {
  try {
    const course = await db.collection('courses').findOne({ 
      _id: new ObjectId(req.params.id) 
    });
    
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }
    
    res.json(course);
  } catch (error) {
    console.error('Error fetching course:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new course (Admin only)
app.post('/api/courses', authenticateToken, authorizeRole(['Admin']), async (req, res) => {
  try {
    const courseData = {
      ...req.body
    };
    
    const result = await db.collection('courses').insertOne(courseData);
    
    const newCourse = await db.collection('courses').findOne({ 
      _id: result.insertedId 
    });
    
    res.status(201).json(newCourse);
  } catch (error) {
    console.error('Error creating course:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update course (Admin only)
app.put('/api/courses/:id', authenticateToken, authorizeRole(['Admin']), async (req, res) => {
  try {
    const updateData = { ...req.body };
    delete updateData._id;
    
    const result = await db.collection('courses').updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: updateData }
    );
    
    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'Course not found' });
    }
    
    const updatedCourse = await db.collection('courses').findOne({ 
      _id: new ObjectId(req.params.id) 
    });
    
    res.json(updatedCourse);
  } catch (error) {
    console.error('Error updating course:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DEPARTMENTS API
// Get all departments
app.get('/api/departments', authenticateToken, async (req, res) => {
  try {
    const departments = await db.collection('departments').find({}).toArray();
    res.json(departments);
  } catch (error) {
    console.error('Error fetching departments:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get department by ID
app.get('/api/departments/:id', authenticateToken, async (req, res) => {
  try {
    const department = await db.collection('departments').findOne({ 
      _id: new ObjectId(req.params.id) 
    });
    
    if (!department) {
      return res.status(404).json({ error: 'Department not found' });
    }
    
    res.json(department);
  } catch (error) {
    console.error('Error fetching department:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new department (Admin only)
app.post('/api/departments', authenticateToken, authorizeRole(['Admin']), async (req, res) => {
  try {
    const departmentData = {
      ...req.body,
      createdAt: new Date(),
      isActive: req.body.isActive !== undefined ? req.body.isActive : true
    };
    
    const result = await db.collection('departments').insertOne(departmentData);
    
    const newDepartment = await db.collection('departments').findOne({ 
      _id: result.insertedId 
    });
    
    res.status(201).json(newDepartment);
  } catch (error) {
    console.error('Error creating department:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update department (Admin only)
app.put('/api/departments/:id', authenticateToken, authorizeRole(['Admin']), async (req, res) => {
  try {
    const updateData = { ...req.body };
    delete updateData._id;
    
    const result = await db.collection('departments').updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: updateData }
    );
    
    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'Department not found' });
    }
    
    const updatedDepartment = await db.collection('departments').findOne({ 
      _id: new ObjectId(req.params.id) 
    });
    
    res.json(updatedDepartment);
  } catch (error) {
    console.error('Error updating department:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// STUDENT COURSES (GRADES) API
// Get grades for a student academic record
app.get('/api/student-courses/student-academic/:studentAcademicId', authenticateToken, async (req, res) => {
  try {
    const courses = await db.collection('studentCourses').find({ 
      studentAcademicId: parseInt(req.params.studentAcademicId) 
    }).toArray();
    
    res.json(courses);
  } catch (error) {
    console.error('Error fetching student courses:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get grades for a specific course and student
app.get('/api/student-courses/student-academic/:studentAcademicId/course/:courseKey', authenticateToken, async (req, res) => {
  try {
    const courseGrade = await db.collection('studentCourses').findOne({ 
      studentAcademicId: parseInt(req.params.studentAcademicId),
      courseKey: parseInt(req.params.courseKey)
    });
    
    res.json(courseGrade);
  } catch (error) {
    console.error('Error fetching student course grade:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update/Create student course grades (Teacher only)
app.post('/api/student-courses', authenticateToken, authorizeRole(['Teacher', 'Admin']), async (req, res) => {
  try {
    const { studentAcademicId, courseKey, ...gradeData } = req.body;
    
    const gradeRecord = {
      studentAcademicId: parseInt(studentAcademicId),
      courseKey: parseInt(courseKey),
      ...gradeData,
      updatedAtUtc: new Date(),
      updatedBy: req.user.username
    };
    
    // Use upsert to create or update
    const result = await db.collection('studentCourses').updateOne(
      { 
        studentAcademicId: parseInt(studentAcademicId),
        courseKey: parseInt(courseKey)
      },
      { $set: gradeRecord },
      { upsert: true }
    );
    
    // Get the updated/created record
    const updatedGrade = await db.collection('studentCourses').findOne({ 
      studentAcademicId: parseInt(studentAcademicId),
      courseKey: parseInt(courseKey)
    });
    
    res.json(updatedGrade);
  } catch (error) {
    console.error('Error updating student course grades:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// TEACHER COURSES API
// Get courses taught by a teacher
app.get('/api/teacher-courses/:userId', authenticateToken, async (req, res) => {
  try {
    // First get the course mappings for this teacher
    const courseMappings = await db.collection('instructorCourseMaps').find({ 
      userId: parseInt(req.params.userId),
      isActive: true
    }).toArray();
    
    // Get the actual course details
    const courseKeys = courseMappings.map(mapping => mapping.courseKey);
    const courses = await db.collection('courses').find({
      courseKey: { $in: courseKeys }
    }).toArray();
    
    res.json(courses);
  } catch (error) {
    console.error('Error fetching teacher courses:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get departments/classes taught by a teacher
app.get('/api/teacher-departments/:userId', authenticateToken, async (req, res) => {
  try {
    // First get the course mappings for this teacher
    const courseMappings = await db.collection('instructorCourseMaps').find({ 
      userId: parseInt(req.params.userId),
      isActive: true
    }).toArray();
    
    // Get the course keys
    const courseKeys = courseMappings.map(mapping => mapping.courseKey);
    
    // Get the course class mappings
    const classMappings = await db.collection('courseClassMaps').find({
      courseKey: { $in: courseKeys },
      isActive: true
    }).toArray();
    
    // Get the department details
    const departmentKeys = classMappings.map(mapping => mapping.departmentKey);
    const departments = await db.collection('departments').find({
      departmentKey: { $in: departmentKeys }
    }).toArray();
    
    res.json(departments);
  } catch (error) {
    console.error('Error fetching teacher departments:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GRADE ENTRY ROSTER API
// Get grade entry roster for a teacher's course and class
app.get('/api/grade-entry-roster/:userId/:departmentKey/:courseKey', authenticateToken, authorizeRole(['Teacher', 'Admin']), async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const departmentKey = parseInt(req.params.departmentKey);
    const courseKey = parseInt(req.params.courseKey);
    
    // Verify the teacher has access to this course and department
    const hasAccess = await db.collection('instructorCourseMaps').findOne({
      userId: userId,
      courseKey: courseKey,
      isActive: true
    });
    
    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied to this course' });
    }
    
    // Get student academics for this department
    const studentAcademics = await db.collection('studentAcademics').find({
      departmentKey: departmentKey
    }).toArray();
    
    // Get student IDs
    const studentIds = studentAcademics.map(sa => sa.studentId);
    
    // Get student details
    const students = await db.collection('students').find({
      id: { $in: studentIds}
    }).toArray();
    
    // Create a map for quick lookup
    const studentMap = {};
    students.forEach(student => {
      studentMap[student.id] = student;
    });
    
    // Get existing grades
    const studentAcademicIds = studentAcademics.map(sa => sa.id);
    const existingGrades = await db.collection('studentCourses').find({
      studentAcademicId: { $in: studentAcademicIds },
      courseKey: courseKey
    }).toArray();
    
    // Create a map for grades
    const gradeMap = {};
    existingGrades.forEach(grade => {
      gradeMap[grade.studentAcademicId] = grade;
    });
    
    // Combine data into roster format
    const roster = studentAcademics.map(sa => {
      const student = studentMap[sa.studentId];
      const grade = gradeMap[sa.id] || {};
      
      return {
        schoolCode: sa.schoolCode,
        departmentKey: sa.departmentKey,
        courseKey: courseKey,
        studentAcademicId: sa.id,
        studentId: sa.studentId,
        firstName: student ? student.firstName : '',
        lastName: student ? student.lastName : '',
        homeWork1: grade.homeWork1,
        midterm1: grade.midterm1,
        final1: grade.final1,
        homeWork2: grade.homeWork2,
        midterm2: grade.midterm2,
        final2: grade.final2,
        letterGrade1: grade.letterGrade1,
        letterGrade2: grade.letterGrade2,
        effortGrade1: grade.effortGrade1,
        effortGrade2: grade.effortGrade2,
        isNumber: grade.isNumber,
        updatedAtUtc: grade.updatedAtUtc,
        updatedBy: grade.updatedBy
      };
    });
    
    res.json(roster);
  } catch (error) {
    console.error('Error fetching grade entry roster:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// TIMETABLE API
// Get timetable for a teacher
app.get('/api/timetable/teacher/:teacherUId', authenticateToken, async (req, res) => {
  try {
    const timetable = await db.collection('timeTables').find({ 
      teacherUId: req.params.teacherUId 
    }).toArray();
    
    res.json(timetable);
  } catch (error) {
    console.error('Error fetching teacher timetable:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get timetable for a class/department
app.get('/api/timetable/department/:departmentKey', authenticateToken, async (req, res) => {
  try {
    const timetable = await db.collection('timeTables').find({ 
      classList: { $regex: new RegExp(req.params.departmentKey, 'i') } 
    }).toArray();
    
    res.json(timetable);
  } catch (error) {
    console.error('Error fetching department timetable:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PERIOD DEFINITIONS API
// Get period definitions for a school and academic period
app.get('/api/period-definitions/:schoolCode/:academicPeriod', authenticateToken, async (req, res) => {
  try {
    const periods = await db.collection('periodDefs').find({ 
      schoolCode: req.params.schoolCode,
      academicPeriod: req.params.academicPeriod
    }).toArray();
    
    res.json(periods);
  } catch (error) {
    console.error('Error fetching period definitions:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// SCHOOLS API
// Get all schools
app.get('/api/schools', authenticateToken, async (req, res) => {
  try {
    const schools = await db.collection('schools').find({}).toArray();
    res.json(schools);
  } catch (error) {
    console.error('Error fetching schools:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Smart School API is running',
    timestamp: new Date().toISOString()
  });
});

// Connect to database and start server
connectToDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`Smart School API server is running on port ${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/api/health`);
  });
}).catch(error => {
  console.error('Failed to start server:', error);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down gracefully...');
  if (client) {
    await client.close();
  }
  process.exit(0);
});