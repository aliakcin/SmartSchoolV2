const sql = require('mssql');
const bcrypt = require('bcrypt');
require('dotenv').config();

// --- CONFIGURE THE USER TO DIAGNOSE ---
const USERNAME_TO_CHECK = '5840259698';
const PASSWORD_TO_TEST = '12345';
// ------------------------------------

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

async function diagnoseHash() {
    let pool;
    try {
        console.log('Connecting to SQL Server...');
        pool = await sql.connect(sqlConfig);
        console.log('Connected successfully.');

        console.log(`Fetching hash for user '${USERNAME_TO_CHECK}'...`);
        const result = await pool.request()
            .input('username', sql.NVarChar, USERNAME_TO_CHECK)
            .query('SELECT PassHash FROM UserCredential WHERE Username = @username');

        if (result.recordset.length === 0) {
            console.error(`\n--- ERROR: User '${USERNAME_TO_CHECK}' not found. ---`);
            return;
        }

        const storedHash = result.recordset[0].PassHash;

        console.log('\n--- DIAGNOSTIC RESULTS ---');
        console.log('Stored Hash:', storedHash);

        // Test 1: Check the length of the hash
        console.log(`\n[Test 1: Hash Length]`);
        console.log(`Hash length is: ${storedHash.length} characters.`);
        if (storedHash.length < 60) {
            console.warn('WARNING: Hash is shorter than the standard 60 characters. It may have been truncated by the database column.');
        } else {
            console.log('OK: Hash length appears to be correct.');
        }

        // Test 2: Standard comparison
        console.log(`\n[Test 2: Standard Comparison]`);
        const isStandardMatch = await bcrypt.compare(PASSWORD_TO_TEST, storedHash);
        console.log(`Result: ${isStandardMatch ? 'MATCH FOUND' : 'NO MATCH'}`);

        // Test 3: Check for null terminator issue
        if (!isStandardMatch) {
            console.log(`\n[Test 3: Null Terminator Check]`);
            const hashWithoutNull = storedHash.replace(/\0/g, ''); // Remove any null characters
            if (hashWithoutNull.length < storedHash.length) {
                console.log('INFO: Null terminator character was found and removed for this test.');
                const isNullTerminatedMatch = await bcrypt.compare(PASSWORD_TO_TEST, hashWithoutNull);
                console.log(`Result after removing null char: ${isNullTerminatedMatch ? 'MATCH FOUND' : 'NO MATCH'}`);
                if (isNullTerminatedMatch) {
                    console.log('CONCLUSION: The hash was created by a different library that adds a null terminator.');
                }
            } else {
                console.log('OK: No null terminator was found.');
            }
        }
        console.log('--------------------------');


    } catch (err) {
        console.error('\nAn error occurred during diagnosis:', err.message);
    } finally {
        if (pool) {
            await pool.close();
            console.log('Database connection closed.');
        }
    }
}

diagnoseHash();