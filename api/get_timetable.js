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

async function fetchTimeTableByTeacherUId(teacherUId) {
    if (!teacherUId) {
        console.error('Please provide a TeacherUId as a command-line argument.');
        console.log('Example: node get_timetable.js 1021');
        return;
    }

    console.log(`Attempting to connect to the database to fetch data for TeacherUId: ${teacherUId}...`);
    try {
        await sql.connect(sqlConfig);
        console.log('Connection successful. Fetching TimeTable data...');
        
        const result = await sql.query`SELECT * FROM TimeTable WHERE TeacherUId = ${teacherUId}`;
        
        console.log(`TimeTable Data for TeacherUId ${teacherUId}:`);
        if (result.recordset.length > 0) {
            console.table(result.recordset);
        } else {
            console.log(`No data found in TimeTable for TeacherUId ${teacherUId}.`);
        }
    } catch (err) {
        console.error('Error fetching TimeTable data:', err);
    } finally {
        await sql.close();
        console.log('Database connection closed.');
    }
}

// Get the TeacherUId from command-line arguments
const teacherUId = process.argv[2];
fetchTimeTableByTeacherUId(teacherUId);