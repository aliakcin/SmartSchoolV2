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

// This function simulates fetching the current user's schedule
// In a real scenario, you would get the user ID and school code from authentication context
async function fetchMySchedule(userId, schoolCode) {
    let pool;
    try {
        pool = await sql.connect(sqlConfig);
        const result = await pool.request()
            .input('userId', sql.Int, userId)
            .input('schoolCode', sql.NVarChar, schoolCode)
            .query(`
                SELECT tt.* 
                FROM TimeTable AS tt
                INNER JOIN UserCredential AS uc ON tt.TeacherUId = uc.AscTeacherUid AND tt.SchoolCode = uc.SchoolCode
                WHERE uc.UserId = @userId AND uc.SchoolCode = @schoolCode
            `);
        
        console.log(`Schedule for User ID: ${userId}, School Code: ${schoolCode}`);
        console.table(result.recordset);
        return result.recordset;
    } catch (err) {
        console.error('Error fetching schedule:', err);
        throw err;
    } finally {
        if (pool) {
            await pool.close();
        }
    }
}

// Example usage with sample data
// Replace these values with actual user data in a real implementation
const userId = 1; // Example user ID
const schoolCode = '34002'; // Example school code

fetchMySchedule(userId, schoolCode);

module.exports = fetchMySchedule;