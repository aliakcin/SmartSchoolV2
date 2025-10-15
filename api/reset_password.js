const sql = require('mssql');
const bcrypt = require('bcrypt');
require('dotenv').config();

// --- CONFIGURE THE USER AND NEW PASSWORD ---
const USERNAME_TO_RESET = '5840259698';
const NEW_PASSWORD = '12345';
// -----------------------------------------

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

async function resetPassword() {
    let pool;
    try {
        console.log('Connecting to SQL Server...');
        pool = await sql.connect(sqlConfig);
        console.log('Connected successfully.');

        console.log(`Searching for user '${USERNAME_TO_RESET}' to reset password...`);
        const userResult = await pool.request()
            .input('username', sql.NVarChar, USERNAME_TO_RESET)
            .query('SELECT UserId, SchoolCode FROM UserCredential WHERE Username = @username');

        if (userResult.recordset.length === 0) {
            console.error(`\n--- ERROR: User '${USERNAME_TO_RESET}' not found. ---`);
            return;
        }
        const userRecord = userResult.recordset[0];
        console.log(`User found in School '${userRecord.SchoolCode}'. Proceeding with password reset.`);

        console.log('Generating a salt with the older "$2a$" version for compatibility...');
        const saltRounds = 10;
        // Generate a standard salt (which starts with $2b$) and replace it with the older version prefix
        const salt = bcrypt.genSaltSync(saltRounds).replace('$2b$', '$2a$');
        console.log('Generated compatibility salt:', salt);

        console.log(`Hashing new password "${NEW_PASSWORD}" with the compatibility salt...`);
        const newPassHash = await bcrypt.hash(NEW_PASSWORD, salt);
        console.log('New compatible hash generated:', newPassHash);

        console.log('Updating user record in the database...');
        const updateResult = await pool.request()
            .input('username', sql.NVarChar, USERNAME_TO_RESET)
            .input('schoolCode', sql.NVarChar, userRecord.SchoolCode)
            .input('newPassHash', sql.NVarChar, newPassHaƒsh)
            .query('UPDATE UserCredential SET PassHash = @newPassHash WHERE Username = @username AND SchoolCode = @schoolCode');

        if (updateResult.rowsAffected[0] === 1) {
            console.log('\n--- SUCCESS ---');
            console.log(`Password for user '${USERNAME_TO_RESET}' has been reset using a compatible hash.`);
            console.log('Both the Node.js app and the C# app should now be able to log in.');
            console.log('---------------');
        } else {
            console.error('\n--- FAILED ---');
            console.error('Failed to update the user password in the database.');
            console.error('--------------');
        }

    } catch (err) {
        console.error('An error occurred during the password reset process:', err.message);
    } finally {
        if (pool) {
            await pool.close();
            console.log('Database connection closed.');
        }
    }
}

resetPassword();