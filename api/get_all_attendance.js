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

async function fetchAllAttendance() {
    console.log('Attempting to connect to the database to fetch all attendance data...');
    let pool;
    try {
        pool = await sql.connect(sqlConfig);
        console.log('Connection successful. Fetching all attendance data...');
        
        const result = await pool.request().query(`
            SELECT 
                sa.Id AS StudentAcademicId,
                s.IdNumber,
                s.FirstName,
                s.LastName,
                c.CourseName,
                sa.DepartmentKey,
                d.DepartmentName,
                att.AttendanceDate,
                att.PeriodNo,
                att.Status,
                att.Note,
                att.UpdatedAtUtc,
                att.UpdatedBy
            FROM StudentAttendance att
            INNER JOIN StudentAcademic sa ON att.StudentAcademicId = sa.Id
            INNER JOIN Student s ON sa.StudentId = s.Id
            INNER JOIN Course c ON att.CourseKey = c.CourseKey
            INNER JOIN Department d ON sa.DepartmentKey = d.DepartmentKey
            ORDER BY att.AttendanceDate DESC, s.LastName, s.FirstName
        `);
        
        console.log(`Found ${result.recordset.length} attendance records:`);
        if (result.recordset.length > 0) {
            console.table(result.recordset);
        } else {
            console.log('No attendance records found.');
        }
        
        return result.recordset;
    } catch (err) {
        console.error('Error fetching attendance data:', err);
        throw err;
    } finally {
        if (pool) {
            await pool.close();
        }
        console.log('Database connection closed.');
    }
}

fetchAllAttendance();

module.exports = fetchAllAttendance;