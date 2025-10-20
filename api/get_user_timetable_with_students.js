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

async function fetchUserTimetableWithStudents(userId) {
    if (!userId) {
        console.error('Please provide a userId as a command-line argument.');
        console.log('Example: node get_user_timetable_with_students.js 1021');
        return;
    }

    console.log(`Attempting to connect to the database to fetch timetable with students for user ${userId}...`);
    let pool;
    try {
        pool = await sql.connect(sqlConfig);
        console.log('Connection successful. Fetching timetable and student data...');
        
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
        
        // Get timetable information for this instructor
        const timetableResult = await pool.request()
            .input('teacherUId', sql.NVarChar, user.AscTeacherUid)
            .query(`
                SELECT 
                    tt.Id,
                    tt.AcademicPeriod,
                    tt.SchoolCode,
                    tt.TeacherUId,
                    tt.DayCode,
                    tt.DayOfWeek,
                    tt.PeriodNo,
                    tt.SubjectName,
                    tt.ClassList,
                    tt.RoomShortName,
                    s.SchoolName
                FROM TimeTable tt
                INNER JOIN School s ON tt.SchoolCode = s.SchoolCode
                WHERE tt.TeacherUId = @teacherUId
                ORDER BY tt.DayOfWeek, tt.PeriodNo
            `);
        
        if (timetableResult.recordset.length === 0) {
            console.log(`No timetable found for user ${userId}.`);
            return;
        }
        
        console.log(`\n=== Timetable for user ${userId} ===`);
        console.table(timetableResult.recordset);
        
        // For each timetable entry, get the associated course and students
        for (const timetableEntry of timetableResult.recordset) {
            console.log(`\n--- Course: ${timetableEntry.SubjectName} (${timetableEntry.DayCode} - Period ${timetableEntry.PeriodNo}) ---`);
            console.log(`Room: ${timetableEntry.RoomShortName} | Class: ${timetableEntry.ClassList}`);
            
            // Try to find the course that matches this timetable entry
            const courseResult = await pool.request()
                .input('courseName', sql.NVarChar, timetableEntry.SubjectName)
                .input('userId', sql.Int, userId)
                .query(`
                    SELECT DISTINCT
                        c.CourseKey,
                        c.CourseId,
                        c.CourseName,
                        c.CourseNameEn
                    FROM Course c
                    INNER JOIN InstructorCourseMap icm ON c.CourseKey = icm.CourseKey
                    WHERE c.CourseName = @courseName AND icm.UserId = @userId AND icm.IsActive = 1
                `);
            
            if (courseResult.recordset.length > 0) {
                const course = courseResult.recordset[0];
                console.log(`Course Key: ${course.CourseKey} | Course ID: ${course.CourseId}`);
                
                // Get students enrolled in this course
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
                    console.log(`Students enrolled (${studentsResult.recordset.length}):`);
                    console.table(studentsResult.recordset);
                } else {
                    console.log('No students enrolled in this course.');
                }
            } else {
                console.log('No matching course found in the system.');
            }
        }
        
        return {
            user: user,
            timetable: timetableResult.recordset
        };
    } catch (err) {
        console.error('Error fetching timetable and student data:', err);
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
fetchUserTimetableWithStudents(userId);

module.exports = fetchUserTimetableWithStudents;