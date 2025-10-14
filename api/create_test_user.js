const sql = require('mssql');
const bcrypt = require('bcrypt');
require('dotenv').config();

// --- Configuration for the test user and school ---
const TEST_SCHOOL = {
    schoolCode: 'SC001',
    schoolName: 'Default Test School'
};

const TEST_USER = {
    idNumber: 'TEST9999',
    fullName: 'Test Admin User',
    globalLock: false,
    
    schoolCode: TEST_SCHOOL.schoolCode, // Use the school code from above
    username: 'testadmin',
    password: 'Password123!', // This will be hashed
    role: 'Admin',
    isLocked: false,
    smartSchoolId: 9999
};
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

async function createTestUser() {
    let pool;
    try {
        console.log('Connecting to SQL Server...');
        pool = await sql.connect(sqlConfig);
        console.log('Connected successfully.');

        // 1. Ensure the school exists
        const checkSchoolResult = await pool.request()
            .input('schoolCode', sql.NVarChar, TEST_SCHOOL.schoolCode)
            .query('SELECT * FROM School WHERE SchoolCode = @schoolCode');

        if (checkSchoolResult.recordset.length === 0) {
            console.log(`School with SchoolCode '${TEST_SCHOOL.schoolCode}' not found. Creating it...`);
            await pool.request()
                .input('schoolCode', sql.NVarChar, TEST_SCHOOL.schoolCode)
                .input('schoolName', sql.NVarChar, TEST_SCHOOL.schoolName)
                .query('INSERT INTO School (SchoolCode, SchoolName) VALUES (@schoolCode, @schoolName)');
            console.log('School created successfully.');
        } else {
            console.log(`School '${TEST_SCHOOL.schoolCode}' already exists.`);
        }

        // 2. Check if the user already exists by username
        const checkUserResult = await pool.request()
            .input('username', sql.NVarChar, TEST_USER.username)
            .input('schoolCode', sql.NVarChar, TEST_USER.schoolCode)
            .query('SELECT * FROM UserCredential WHERE Username = @username AND SchoolCode = @schoolCode');

        if (checkUserResult.recordset.length > 0) {
            console.log(`User with username '${TEST_USER.username}' already exists. Skipping user creation.`);
            return;
        }
        
        console.log('Creating entry in UserPerson...');
        // 3. Create the UserPerson entry and get the new UserId
        const personResult = await pool.request()
            .input('idNumber', sql.NVarChar, TEST_USER.idNumber)
            .input('fullName', sql.NVarChar, TEST_USER.fullName)
            .input('globalLock', sql.Bit, TEST_USER.globalLock)
            .query(`
                INSERT INTO UserPerson (IdNumber, FullName, GlobalLock, CreatedAt, UpdatedAt)
                OUTPUT INSERTED.UserId
                VALUES (@idNumber, @fullName, @globalLock, GETUTCDATE(), GETUTCDATE())
            `);
            
        const newUserId = personResult.recordset[0].UserId;
        console.log(`UserPerson entry created with UserId: ${newUserId}`);

        // 4. Hash the password
        console.log('Hashing password...');
        const saltRounds = 10;
        const passHash = await bcrypt.hash(TEST_USER.password, saltRounds);
        console.log('Password hashed.');

        // 5. Create the UserCredential entry
        console.log('Creating entry in UserCredential...');
        await pool.request()
            .input('userId', sql.Int, newUserId)
            .input('schoolCode', sql.NVarChar, TEST_USER.schoolCode)
            .input('username', sql.NVarChar, TEST_USER.username)
            .input('passHash', sql.NVarChar, passHash)
            .input('role', sql.NVarChar, TEST_USER.role)
            .input('isLocked', sql.Bit, TEST_USER.isLocked)
            .input('smartSchoolId', sql.Int, TEST_USER.smartSchoolId)
            .query(`
                INSERT INTO UserCredential (UserId, SchoolCode, Username, PassHash, Role, IsLocked, CreatedAt, SmartSchoolId)
                VALUES (@userId, @schoolCode, @username, @passHash, @role, @isLocked, GETUTCDATE(), @smartSchoolId)
            `);
        console.log('UserCredential entry created.');

        console.log('\n--- Test User Created Successfully! ---');
        console.log(`Username: ${TEST_USER.username}`);
        console.log(`Password: ${TEST_USER.password}`);
        console.log(`School Code: ${TEST_USER.schoolCode}`);
        console.log('--------------------------------------');

    } catch (err) {
        console.error('Error creating test user:', err.message);
    } finally {
        if (pool) {
            await pool.close();
            console.log('Database connection closed.');
        }
    }
}

createTestUser();