const sql = require('mssql');
const bcrypt = require('bcrypt');
require('dotenv').config();

// --- CONFIGURE THE USER TO TEST ---
const TEST_USERNAME = '5840259698';
const TEST_PASSWORD = '12345';
// ----------------------------------

// SQL Server configuration from .env
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

async function verifyPassword() {
    let pool;
    try {
        console.log('Connecting to SQL Server...');
        pool = await sql.connect(sqlConfig);
        console.log('Connected successfully.');

        console.log(`Searching for user '${TEST_USERNAME}' across all schools...`);
        const result = await pool.request()
            .input('username', sql.NVarChar, TEST_USERNAME)
            .query('SELECT UserId, SchoolCode, PassHash FROM UserCredential WHERE Username = @username');

        if (result.recordset.length === 0) {
            console.error('\n--- ERROR ---');
            console.error(`User not found with username '${TEST_USERNAME}' in any school.`);
            console.error('-------------');
            return;
        }

        if (result.recordset.length > 1) {
            console.warn('\n--- AMBIGUOUS USER ---');
            console.warn(`Found multiple users with username '${TEST_USERNAME}'. Please specify a school code.`);
            console.table(result.recordset);
            console.warn('----------------------');
            return;
        }

        // --- Exactly one user was found ---
        const userRecord = result.recordset[0];
        const storedHash = userRecord.PassHash;
        const correctSchoolCode = userRecord.SchoolCode;
        
        console.log(`User found with School Code: ${correctSchoolCode}`);
        console.log('Stored Hash:', storedHash);
        
        console.log(`\nComparing plaintext password "${TEST_PASSWORD}" with the stored hash...`);

        const isMatch = await bcrypt.compare(TEST_PASSWORD, storedHash);

        if (isMatch) {
            console.log('\n--- SUCCESS ---');
            console.log('Password matches!');
            console.log(`The correct School Code for this user is: ${correctSchoolCode}`);
            console.log('If login still fails, ensure the app is sending this School Code.');
            console.log('---------------');
        } else {
            console.log('\n--- FAILURE ---');
            console.log('Password does NOT match.');
            console.log('The password "12345" is not the correct password for this user\'s stored hash.');
            console.log('---------------');
        }

    } catch (err) {
        console.error('An error occurred:', err.message);
    } finally {
        if (pool) {
            await pool.close();
            console.log('Database connection closed.');
        }
    }
}

verifyPassword();