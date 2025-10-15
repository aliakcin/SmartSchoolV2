const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const sql = require('mssql');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'smart_school_secret_key_2025';

// Middleware
app.use(cors());
app.use(express.json());

// SQL Server configuration
const sqlConfig = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,
    database: process.env.DB_DATABASE,
    options: {
        encrypt: process.env.DB_ENCRYPT === 'true',
        trustServerCertificate: process.env.DB_TRUST_SERVER_CERTIFICATE === 'true'
    },
    pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000
    }
};

// SQL Server connection pool
let pool;

async function connectToDatabase() {
  try {
    pool = await sql.connect(sqlConfig);
    console.log('Connected to SQL Server');
  } catch (error) {
    console.error('SQL Server connection error:', error);
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

// --- UPDATED LOGIN ENDPOINT ---
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    // 1. Find all credentials for this username across all schools
    const credentialsResult = await pool.request()
      .input('username', sql.NVarChar, username)
      .query(`
        SELECT uc.UserId, uc.SchoolCode, uc.PassHash, uc.Role, uc.IsLocked, s.SchoolName
        FROM UserCredential uc
        JOIN School s ON uc.SchoolCode = s.SchoolCode
        WHERE uc.Username = @username
      `);

    if (credentialsResult.recordset.length === 0) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    // 2. Find the first valid password match
    let validCredential = null;
    for (const cred of credentialsResult.recordset) {
      if (!cred.IsLocked) {
        const isPasswordValid = await bcrypt.compare(password, cred.PassHash);
        if (isPasswordValid) {
          validCredential = cred;
          break; // Stop after finding the first valid password
        }
      }
    }
    
    if (!validCredential) {
        return res.status(401).json({ error: 'Invalid username or password' });
    }

    // 3. Get user person details
    const userPersonResult = await pool.request()
      .input('userId', sql.Int, validCredential.UserId)
      .query('SELECT * FROM UserPerson WHERE UserId = @userId');
      
    const userPerson = userPersonResult.recordset[0];

    if (!userPerson) {
      return res.status(500).json({ error: 'User profile not found' });
    }

    // 4. Prepare the list of available schools for this user
    const availableSchools = credentialsResult.recordset.map(cred => ({
        schoolCode: cred.SchoolCode,
        schoolName: cred.SchoolName,
        role: cred.Role
    }));

    // 5. Select the default school (lowest school code) and generate a token for it
    const defaultSchool = availableSchools.sort((a, b) => a.schoolCode.localeCompare(b.schoolCode))[0];
    
    await pool.request()
        .input('userId', sql.Int, validCredential.UserId)
        .input('schoolCode', sql.NVarChar, defaultSchool.schoolCode)
        .query('UPDATE UserCredential SET LastLoginAt = GETUTCDATE() WHERE UserId = @userId AND SchoolCode = @schoolCode');

    const token = jwt.sign(
      {
        userId: validCredential.UserId,
        username: username,
        schoolCode: defaultSchool.schoolCode,
        role: defaultSchool.role
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // 6. Build the final user object
    const userData = {
      userId: validCredential.UserId,
      username: username,
      fullName: userPerson.FullName,
      role: defaultSchool.role,
      schoolCode: defaultSchool.schoolCode,
      accessToken: token,
      availableSchools: availableSchools
    };

    res.json({ message: 'Login successful', user: userData });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// --- NEW ENDPOINT FOR SWITCHING SCHOOLS ---
app.post('/api/auth/switch-school', authenticateToken, async (req, res) => {
    try {
        const { newSchoolCode } = req.body;
        const { userId, username } = req.user; // Get user info from the current valid token

        if (!newSchoolCode) {
            return res.status(400).json({ error: 'newSchoolCode is required' });
        }

        // 1. Verify the user has credentials for the requested school
        const credentialResult = await pool.request()
            .input('userId', sql.Int, userId)
            .input('schoolCode', sql.NVarChar, newSchoolCode)
            .query('SELECT Role FROM UserCredential WHERE UserId = @userId AND SchoolCode = @schoolCode');
        
        const newCredential = credentialResult.recordset[0];

        if (!newCredential) {
            return res.status(403).json({ error: 'User does not have access to the requested school.' });
        }

        // 2. Generate a new token with the updated school code and role
        const newToken = jwt.sign(
            {
                userId: userId,
                username: username,
                schoolCode: newSchoolCode,
                role: newCredential.Role
            },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            message: 'Switched school successfully',
            accessToken: newToken,
            schoolCode: newSchoolCode,
            role: newCredential.Role
        });

    } catch (error) {
        console.error('Switch school error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});


// STUDENTS API
app.get('/api/students', authenticateToken, async (req, res) => {
  try {
    const result = await pool.request().query('SELECT * FROM Student');
    res.json(result.recordset);
  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/students/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.request()
      .input('id', sql.Int, req.params.id)
      .query('SELECT * FROM Student WHERE Id = @id');
    
    if (result.recordset.length === 0) {
      return res.status(404).json({ error: 'Student not found' });
    }
    res.json(result.recordset[0]);
  } catch (error) {
    console.error('Error fetching student:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


// STUDENT ACADEMICS API
app.get('/api/student-academics/student/:studentId', authenticateToken, async (req, res) => {
  try {
    const result = await pool.request()
      .input('studentId', sql.Int, req.params.studentId)
      .query('SELECT * FROM StudentAcademic WHERE StudentId = @studentId');
    res.json(result.recordset);
  } catch (error) {
    console.error('Error fetching student academics:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


// COURSES API
app.get('/api/courses', authenticateToken, async (req, res) => {
  try {
    const result = await pool.request().query('SELECT * FROM Course');
    res.json(result.recordset);
  } catch (error) {
    console.error('Error fetching courses:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


// DEPARTMENTS API
app.get('/api/departments', authenticateToken, async (req, res) => {
  try {
    const result = await pool.request().query('SELECT * FROM Department');
    res.json(result.recordset);
  } catch (error) {
    console.error('Error fetching departments:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


// STUDENT COURSES (GRADES) API
app.get('/api/student-courses/student-academic/:studentAcademicId', authenticateToken, async (req, res) => {
  try {
    const result = await pool.request()
      .input('studentAcademicId', sql.Int, req.params.studentAcademicId)
      .query('SELECT * FROM StudentCourse WHERE StudentAcademicId = @studentAcademicId');
    res.json(result.recordset);
  } catch (error) {
    console.error('Error fetching student courses:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/student-courses', authenticateToken, authorizeRole(['Teacher', 'Admin']), async (req, res) => {
  try {
    const { studentAcademicId, courseKey, ...gradeData } = req.body;
    const request = pool.request()
        .input('studentAcademicId', sql.Int, studentAcademicId)
        .input('courseKey', sql.Int, courseKey)
        .input('updatedBy', sql.NVarChar, req.user.username);
    const setClauses = Object.keys(gradeData).map(key => `${key} = @${key}`).join(', ');
    for (const [key, value] of Object.entries(gradeData)) {
        if (value === null) { request.input(key, null); }
        else if (typeof value === 'number') { request.input(key, sql.Decimal(5, 2), value); }
        else if (typeof value === 'boolean') { request.input(key, sql.Bit, value); }
        else { request.input(key, sql.NVarChar, value); }
    }
    const query = `
      MERGE StudentCourse AS target
      USING (SELECT @studentAcademicId AS StudentAcademicId, @courseKey AS CourseKey) AS source
      ON (target.StudentAcademicId = source.StudentAcademicId AND target.CourseKey = source.CourseKey)
      WHEN MATCHED THEN
        UPDATE SET ${setClauses}, UpdatedAtUtc = GETUTCDATE(), UpdatedBy = @updatedBy
      WHEN NOT MATCHED THEN
        INSERT (StudentAcademicId, CourseKey, ${Object.keys(gradeData).join(', ')}, UpdatedAtUtc, UpdatedBy)
        VALUES (@studentAcademicId, @courseKey, ${Object.keys(gradeData).map(k => `@${k}`).join(', ')}, GETUTCDATE(), @updatedBy);
      SELECT * FROM StudentCourse WHERE StudentAcademicId = @studentAcademicId AND CourseKey = @courseKey;
    `;
    const result = await request.query(query);
    res.json(result.recordset[0]);
  } catch (error) {
    console.error('Error updating student course grades:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


// TEACHER COURSES API
app.get('/api/teacher-courses/:userId', authenticateToken, async (req, res) => {
  try {
    const userId = parseInt(req.params.userId, 10);
    const result = await pool.request()
      .input('userId', sql.Int, userId)
      .query(`
        SELECT c.* 
        FROM Course c
        INNER JOIN InstructorCourseMap icm ON c.CourseKey = icm.CourseKey
        WHERE icm.UserId = @userId AND icm.IsActive = 1
      `);
    res.json(result.recordset);
  } catch (error) {
    console.error('Error fetching teacher courses:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/teacher-departments/:userId', authenticateToken, async (req, res) => {
    try {
        const userId = parseInt(req.params.userId, 10);
        const result = await pool.request()
            .input('userId', sql.Int, userId)
            .query(`
                SELECT DISTINCT d.*
                FROM Department d
                INNER JOIN CourseClassMap ccm ON d.DepartmentKey = ccm.DepartmentKey
                INNER JOIN InstructorCourseMap icm ON ccm.CourseKey = icm.CourseKey
                WHERE icm.UserId = @userId AND d.IsActive = 1 AND ccm.IsActive = 1 AND icm.IsActive = 1
            `);
        res.json(result.recordset);
    } catch (error) {
        console.error('Error fetching teacher departments:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});


// GRADE ENTRY ROSTER API
app.get('/api/grade-entry-roster/:userId/:departmentKey/:courseKey', authenticateToken, authorizeRole(['Teacher', 'Admin']), async (req, res) => {
  try {
    const { userId, departmentKey, courseKey } = req.params;
    const result = await pool.request()
      .input('userId', sql.Int, userId)
      .input('departmentKey', sql.Int, departmentKey)
      .input('courseKey', sql.Int, courseKey)
      .query(`
        SELECT 
          sa.SchoolCode, sa.DepartmentKey, @courseKey AS CourseKey, sa.Id AS StudentAcademicId,
          s.Id AS StudentId, s.FirstName, s.LastName,
          sc.HomeWork1, sc.Midterm1, sc.Final1, sc.HomeWork2, sc.Midterm2, sc.Final2,
          sc.LetterGrade1, sc.LetterGrade2, sc.EffortGrade1, sc.EffortGrade2,
          sc.IsNumber, sc.UpdatedAtUtc, sc.UpdatedBy
        FROM StudentAcademic sa
        INNER JOIN Student s ON sa.StudentId = s.Id
        LEFT JOIN StudentCourse sc ON sa.Id = sc.StudentAcademicId AND sc.CourseKey = @courseKey
        WHERE sa.DepartmentKey = @departmentKey AND sa.Status = 1
      `);
    res.json(result.recordset);
  } catch (error) {
    console.error('Error fetching grade entry roster:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


// STUDENT ATTENDANCE API
app.get('/api/student-attendance/student-academic/:studentAcademicId', authenticateToken, async (req, res) => {
    try {
        const result = await pool.request()
            .input('studentAcademicId', sql.Int, req.params.studentAcademicId)
            .query('SELECT * FROM StudentAttendance WHERE StudentAcademicId = @studentAcademicId');
        res.json(result.recordset);
    } catch (error) {
        console.error('Error fetching student attendance:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/api/student-attendance', authenticateToken, authorizeRole(['Teacher', 'Admin']), async (req, res) => {
    try {
        const { studentAcademicId, courseKey, attendanceDate, periodNo, status, note } = req.body;
        const result = await pool.request()
            .input('studentAcademicId', sql.Int, studentAcademicId)
            .input('courseKey', sql.Int, courseKey)
            .input('attendanceDate', sql.Date, attendanceDate)
            .input('periodNo', sql.Int, periodNo)
            .input('status', sql.NVarChar, status)
            .input('note', sql.NVarChar, note)
            .input('updatedBy', sql.NVarChar, req.user.username)
            .query(`
                MERGE StudentAttendance AS target
                USING (SELECT @studentAcademicId AS sid, @attendanceDate AS aDate, @periodNo as pNo) AS source
                ON (target.StudentAcademicId = source.sid AND target.AttendanceDate = source.aDate AND target.PeriodNo = source.pNo)
                WHEN MATCHED THEN
                    UPDATE SET Status = @status, Note = @note, UpdatedAtUtc = GETUTCDATE(), UpdatedBy = @updatedBy
                WHEN NOT MATCHED THEN
                    INSERT (StudentAcademicId, CourseKey, AttendanceDate, PeriodNo, Status, Note, UpdatedAtUtc, UpdatedBy)
                    VALUES (@studentAcademicId, @courseKey, @attendanceDate, @periodNo, @status, @note, GETUTCDATE(), @updatedBy);
                SELECT * FROM StudentAttendance WHERE StudentAcademicId = @studentAcademicId AND AttendanceDate = @attendanceDate AND PeriodNo = @periodNo;
            `);
        res.json(result.recordset[0]);
    } catch (error) {
        console.error('Error saving attendance:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});


// TIMETABLE API
app.get('/api/timetable/teacher/:teacherUId', authenticateToken, async (req, res) => {
  try {
    const result = await pool.request()
      .input('teacherUId', sql.NVarChar, req.params.teacherUId)
      .query('SELECT * FROM TimeTable WHERE TeacherUId = @teacherUId');
    res.json(result.recordset);
  } catch (error) {
    console.error('Error fetching teacher timetable:', error);
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
  });
}).catch(error => {
  console.error('Failed to start server:', error);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down gracefully...');
  if (pool) {
    await pool.close();
  }
  process.exit(0);
});