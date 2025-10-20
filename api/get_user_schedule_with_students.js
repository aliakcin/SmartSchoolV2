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

async function fetchUserScheduleWithStudents(userId) {
    if (!userId) {
        console.error('Please provide a userId as a command-line argument.');
        console.log('Example: node get_user_schedule_with_students.js 1021');
        return;
    }

    console.log(`Attempting to connect to the database to fetch complete schedule with students for user ${userId}...`);
    let pool;
    try {
        pool = await sql.connect(sqlConfig);
        console.log('Connection successful. Fetching schedule and student data...');
        
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
        
        // Get the academic period for this school
        const academicPeriodResult = await pool.request()
            .input('schoolCode', sql.NVarChar, user.SchoolCode)
            .query(`
                SELECT TOP 1 AcademicPeriod 
                FROM TimeTable 
                WHERE SchoolCode = @schoolCode
                ORDER BY AcademicPeriod DESC
            `);
        
        const academicPeriod = academicPeriodResult.recordset.length > 0 
            ? academicPeriodResult.recordset[0].AcademicPeriod 
            : new Date().getFullYear() + '-' + (new Date().getFullYear() + 1);
        
        console.log(`Using academic period: ${academicPeriod}`);
        
        // Get period definitions for this school
        const periodDefsResult = await pool.request()
            .input('schoolCode', sql.NVarChar, user.SchoolCode)
            .input('academicPeriod', sql.NVarChar, academicPeriod)
            .query(`
                SELECT 
                    PeriodNo,
                    StartTime,
                    EndTime
                FROM perioddef
                WHERE SchoolCode = @schoolCode AND AcademicPeriod = @academicPeriod
                ORDER BY PeriodNo
            `);
        
        if (periodDefsResult.recordset.length > 0) {
            console.log(`\n=== Period Definitions for ${user.SchoolName} ===`);
            console.table(periodDefsResult.recordset);
        }
        
        // Get timetable information for this instructor with period details
        const timetableWithPeriodsResult = await pool.request()
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
                    pd.StartTime,
                    pd.EndTime,
                    s.SchoolName
                FROM TimeTable tt
                LEFT JOIN perioddef pd ON tt.SchoolCode = pd.SchoolCode 
                    AND tt.AcademicPeriod = pd.AcademicPeriod 
                    AND tt.PeriodNo = pd.PeriodNo
                INNER JOIN School s ON tt.SchoolCode = s.SchoolCode
                WHERE tt.TeacherUId = @teacherUId
                ORDER BY tt.DayOfWeek, tt.PeriodNo
            `);
        
        if (timetableWithPeriodsResult.recordset.length === 0) {
            console.log(`No timetable found for user ${userId}.`);
            return;
        }
        
        console.log(`\n=== Timetable with Period Details for user ${userId} ===`);
        console.table(timetableWithPeriodsResult.recordset);
        
        // For each timetable entry, get the associated course and students
        for (const timetableEntry of timetableWithPeriodsResult.recordset) {
            console.log(`\n--- ${timetableEntry.DayCode} - Period ${timetableEntry.PeriodNo}: ${timetableEntry.SubjectName} ---`);
            console.log(`Time: ${timetableEntry.StartTime || 'N/A'} - ${timetableEntry.EndTime || 'N/A'}`);
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
                // We need to find the department(s) associated with this course and class
                const studentsResult = await pool.request()
                    .input('userId', sql.Int, userId)
                    .input('courseKey', sql.Int, course.CourseKey)
                    .input('classList', sql.NVarChar, timetableEntry.ClassList)
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
                            AND d.DepartmentName LIKE '%' + @classList + '%'
                        ORDER BY s.LastName, s.FirstName
                    `);
                
                if (studentsResult.recordset.length > 0) {
                    console.log(`Students enrolled (${studentsResult.recordset.length}):`);
                    console.table(studentsResult.recordset);
                } else {
                    // If no students found with class filter, get all students for this course
                    const allStudentsResult = await pool.request()
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
                    
                    if (allStudentsResult.recordset.length > 0) {
                        console.log(`Students enrolled in course (${allStudentsResult.recordset.length}):`);
                        console.table(allStudentsResult.recordset);
                    } else {
                        console.log('No students enrolled in this course.');
                    }
                }
            } else {
                console.log('No matching course found in the system.');
                
                // Even if no course found, try to get students based on class list
                const classStudentsResult = await pool.request()
                    .input('classList', sql.NVarChar, timetableEntry.ClassList)
                    .query(`
                        SELECT 
                            s.IdNumber,
                            s.FirstName,
                            s.LastName,
                            s.Gender,
                            sa.SmartId,
                            sa.SchoolNumber,
                            sa.ClassId,
                            d.DepartmentName
                        FROM StudentAcademic sa
                        INNER JOIN Student s ON sa.StudentId = s.Id
                        INNER JOIN Department d ON sa.DepartmentKey = d.DepartmentKey
                        WHERE d.DepartmentName LIKE '%' + @classList + '%'
                        ORDER BY s.LastName, s.FirstName
                    `);
                
                if (classStudentsResult.recordset.length > 0) {
                    console.log(`Students in class ${timetableEntry.ClassList} (${classStudentsResult.recordset.length}):`);
                    console.table(classStudentsResult.recordset);
                } else {
                    console.log(`No students found for class ${timetableEntry.ClassList}.`);
                }
            }
        }
        
        return {
            user: user,
            periods: periodDefsResult.recordset,
            timetable: timetableWithPeriodsResult.recordset
        };
    } catch (err) {
        console.error('Error fetching schedule and student data:', err);
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
fetchUserScheduleWithStudents(userId);

module.exports = fetchUserScheduleWithStudents;