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

async function fetchStudentsForCourse(userId, courseKey) {
    if (!userId || !courseKey) {
        console.error('Please provide both userId and courseKey as command-line arguments.');
        console.log('Example: node get_students_for_course.js 1021 5');
        return;
    }

    console.log(`Attempting to connect to the database to fetch students for course ${courseKey} taught by user ${userId}...`);
    let pool;
    try {
        pool = await sql.connect(sqlConfig);
        console.log('Connection successful. Fetching student data...');
        
        const result = await pool.request()
            .input('userId', sql.Int, userId)
            .input('courseKey', sql.Int, courseKey)
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
                    sc.effortGrade1,
                    c.courseName,
                    c.courseNameEn
                FROM StudentAcademic sa
                INNER JOIN Student s ON sa.studentId = s.id
                INNER JOIN StudentCourse sc ON sa.id = sc.studentAcademicId
                INNER JOIN Course c ON sc.courseKey = c.courseKey
                INNER JOIN InstructorCourseMap icm ON c.courseKey = icm.courseKey
                WHERE icm.userId = @userId AND c.courseKey = @courseKey
                ORDER BY s.lastName, s.firstName
            `);
        
        console.log(`Students enrolled in course ${courseKey} taught by user ${userId}:`);
        if (result.recordset.length > 0) {
            console.table(result.recordset);
        } else {
            console.log(`No students found for course ${courseKey} taught by user ${userId}.`);
        }
        
        return result.recordset;
    } catch (err) {
        console.error('Error fetching student data:', err);
        throw err;
    } finally {
        if (pool) {
            await pool.close();
        }
        console.log('Database connection closed.');
    }
}

// Get the userId and courseKey from command-line arguments
const userId = process.argv[2];
const courseKey = process.argv[3];
fetchStudentsForCourse(userId, courseKey);

module.exports = fetchStudentsForCourse;