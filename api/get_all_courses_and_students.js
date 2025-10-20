require('dotenv').config();
const sql = require('mssql');

const sqlConfig = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,
    database: process.env.DB_DATABASE,
    options: {
        encrypt: process.env.DB_ENCRYPT === 'true',
        trustServerCertificate: process.env.DB_TRUST_SERVER_CERTIFICATE === 'true'
    }
};

async function fetchAllCoursesAndStudents(userId) {
    if (!userId) {
        console.error('Please provide a userId as a command-line argument.');
        console.log('Example: node get_all_courses_and_students.js 1021');
        return;
    }

    console.log(`Attempting to connect to the database to fetch all courses and students for user ${userId}...`);
    let pool;
    try {
        pool = await sql.connect(sqlConfig);
        console.log('Connection successful. Fetching course and student data...');
        
        // First, get all courses taught by this instructor
        const coursesResult = await pool.request()
            .input('userId', sql.Int, userId)
            .query(`
                SELECT DISTINCT
                    c.courseKey,
                    c.courseId,
                    c.courseName,
                    c.courseNameEn
                FROM Course c
                INNER JOIN InstructorCourseMap icm ON c.courseKey = icm.courseKey
                WHERE icm.userId = @userId AND icm.isActive = 1
                ORDER BY c.courseName
            `);
        
        if (coursesResult.recordset.length === 0) {
            console.log(`No courses found for user ${userId}.`);
            return;
        }
        
        console.log(`\n=== Courses taught by user ${userId} ===`);
        console.table(coursesResult.recordset);
        
        // For each course, get all students enrolled
        for (const course of coursesResult.recordset) {
            console.log(`\n--- Students in course: ${course.courseName} (ID: ${course.courseId}) ---`);
            
            const studentsResult = await pool.request()
                .input('userId', sql.Int, userId)
                .input('courseKey', sql.Int, course.courseKey)
                .query(`
                    SELECT 
                        s.idNumber,
                        s.firstName,
                        s.lastName,
                        s.gender,
                        sa.smartId,
                        sa.schoolNumber,
                        sa.classId,
                        sc.homeWork1,
                        sc.midterm1,
                        sc.final1,
                        sc.letterGrade1,
                        sc.effortGrade1
                    FROM StudentAcademic sa
                    INNER JOIN Student s ON sa.studentId = s.id
                    INNER JOIN StudentCourse sc ON sa.id = sc.studentAcademicId
                    INNER JOIN Course c ON sc.courseKey = c.courseKey
                    INNER JOIN InstructorCourseMap icm ON c.courseKey = icm.courseKey
                    WHERE icm.userId = @userId 
                        AND c.courseKey = @courseKey
                    ORDER BY s.lastName, s.firstName
                `);
            
            if (studentsResult.recordset.length > 0) {
                console.table(studentsResult.recordset);
            } else {
                console.log('No students enrolled in this course.');
            }
        }
        
        return {
            courses: coursesResult.recordset,
            studentsByCourse: {} // This would be populated in a real implementation
        };
    } catch (err) {
        console.error('Error fetching course and student data:', err);
        throw err;
    } finally {
        if (pool) {
            await pool.close();
        }
        console.log('\nDatabase connection closed.');
    }
}

// Get the userId from command-line arguments
const userId = process.argv[2] || 1; // Default to 1 if not provided for testing
fetchAllCoursesAndStudents(userId);

module.exports = fetchAllCoursesAndStudents;