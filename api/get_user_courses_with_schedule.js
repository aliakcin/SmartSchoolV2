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

async function fetchUserCoursesWithSchedule(userId) {
    if (!userId) {
        console.error('Please provide a userId as a command-line argument.');
        console.log('Example: node get_user_courses_with_schedule.js 1021');
        return;
    }

    console.log(`Attempting to connect to the database to fetch courses with schedule for user ${userId}...`);
    let pool;
    try {
        pool = await sql.connect(sqlConfig);
        console.log('Connection successful. Fetching course and schedule data...');
        
        // Get user information first
        const userResult = await pool.request()
            .input('userId', sql.Int, userId)
            .query(`
                SELECT uc.AscTeacherUid, uc.Username, s.SchoolName, s.SchoolCode
                FROM UserCredential uc
                INNER JOIN School s ON uc.SchoolCode = s.SchoolCode
                WHERE uc.UserId = @userId
            `);
        
        if (userResult.recordset.length === 0) {
            console.log(`No user found with ID ${userId}.`);
            return;
        }
        
        const user = userResult.recordset[0];
        console.log(`Found user: ${user.Username} with Teacher UID: ${user.AscTeacherUid}`);
        
        // Get all courses taught by this instructor
        const coursesResult = await pool.request()
            .input('userId', sql.Int, userId)
            .query(`
                SELECT DISTINCT
                    c.CourseKey,
                    c.CourseId,
                    c.CourseName,
                    c.CourseNameEn,
                    s.SchoolName,
                    s.SchoolCode
                FROM Course c
                INNER JOIN InstructorCourseMap icm ON c.CourseKey = icm.CourseKey
                INNER JOIN School s ON c.SchoolCode = s.SchoolCode
                WHERE icm.UserId = @userId AND icm.IsActive = 1
                ORDER BY c.CourseName
            `);
        
        if (coursesResult.recordset.length === 0) {
            console.log(`No courses found for user ${userId}.`);
            return;
        }
        
        console.log(`\n=== Courses for user ${userId} ===`);
        console.table(coursesResult.recordset);
        
        // Get timetable information for this instructor
        const timetableResult = await pool.request()
            .input('teacherUId', sql.NVarChar, user.AscTeacherUid)
            .query(`
                SELECT *
                FROM TimeTable
                WHERE TeacherUId = @teacherUId
                ORDER BY DayOfWeek, PeriodNo
            `);
        
        if (timetableResult.recordset.length > 0) {
            console.log(`\n=== Timetable for user ${userId} ===`);
            console.table(timetableResult.recordset);
        } else {
            console.log(`\nNo timetable found for user ${userId}.`);
        }
        
        // For each course, get all students enrolled
        for (const course of coursesResult.recordset) {
            console.log(`\n--- Students in course: ${course.CourseName} (ID: ${course.CourseId}) ---`);
            
            const studentsResult = await pool.request()
                .input('userId', sql.Int, userId)
                .input('courseKey', sql.Int, course.CourseKey)
                .query(`
                    SELECT 
                        s.IdNumber,
                        s.FirstName,
                        s.LastName,
                        s.Gender,
                        sa.SmartId,
                        sa.SchoolNumber,
                        sa.ClassId,
                        d.DepartmentName,
                        sc.HomeWork1,
                        sc.Midterm1,
                        sc.Final1,
                        sc.LetterGrade1,
                        sc.EffortGrade1
                    FROM StudentAcademic sa
                    INNER JOIN Student s ON sa.StudentId = s.Id
                    INNER JOIN StudentCourse sc ON sa.Id = sc.StudentAcademicId
                    INNER JOIN Course c ON sc.CourseKey = c.CourseKey
                    INNER JOIN InstructorCourseMap icm ON c.CourseKey = icm.CourseKey
                    INNER JOIN Department d ON sa.DepartmentKey = d.DepartmentKey
                    WHERE icm.UserId = @userId 
                        AND c.CourseKey = @courseKey
                    ORDER BY s.LastName, s.FirstName
                `);
            
            if (studentsResult.recordset.length > 0) {
                console.table(studentsResult.recordset);
            } else {
                console.log('No students enrolled in this course.');
            }
        }
        
        return {
            user: user,
            courses: coursesResult.recordset,
            timetable: timetableResult.recordset
        };
    } catch (err) {
        console.error('Error fetching course and schedule data:', err);
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
fetchUserCoursesWithSchedule(userId);

module.exports = fetchUserCoursesWithSchedule;