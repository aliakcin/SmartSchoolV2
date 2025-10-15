const sql = require('mssql');
require('dotenv').config();

// --- CONFIGURATION ---
const SOURCE_SCHOOL_CODE = '24001';
const TARGET_SCHOOL_CODE = '34002';
const TARGET_ACADEMIC_PERIOD = '2025-2026';
// ---------------------

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

/**
 * Formats a JavaScript Date object into a 'HH:mm:ss' string.
 * @param {Date} date The date object to format.
 * @returns {string} The formatted time string.
 */
function formatTime(date) {
    // The mssql driver returns a Date object with the time set correctly,
    // but the date part is a default (like 1970-01-01). We only need the time.
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
}

async function populateNewPeriods() {
    let pool;
    try {
        console.log('Connecting to SQL Server...');
        pool = await sql.connect(sqlConfig);
        console.log('Connected successfully.');

        // 1. Fetch the period definitions from the source school
        console.log(`Fetching period definitions from source school: ${SOURCE_SCHOOL_CODE}...`);
        const sourcePeriodsResult = await pool.request()
            .input('SourceSchoolCode', sql.NVarChar, SOURCE_SCHOOL_CODE)
            .query('SELECT PeriodNo, StartTime, EndTime FROM perioddef WHERE SchoolCode = @SourceSchoolCode');

        if (sourcePeriodsResult.recordset.length === 0) {
            console.error('\n--- ERROR ---');
            console.error(`No period definitions found for source school code '${SOURCE_SCHOOL_CODE}'. Cannot proceed.`);
            console.error('---------------');
            return;
        }
        
        const sourcePeriods = sourcePeriodsResult.recordset;
        console.log(`Found ${sourcePeriods.length} period definitions to duplicate.`);

        // 2. Start a transaction to ensure all or nothing is inserted
        const transaction = new sql.Transaction(pool);
        await transaction.begin();
        console.log('Transaction started.');

        try {
            for (const period of sourcePeriods) {
                const formattedStartTime = formatTime(period.StartTime);
                const formattedEndTime = formatTime(period.EndTime);

                console.log(`Inserting Period No: ${period.PeriodNo} for school ${TARGET_SCHOOL_CODE} (${formattedStartTime} - ${formattedEndTime})`);
                
                const request = new sql.Request(transaction);
                await request
                    .input('SchoolCode', sql.NVarChar, TARGET_SCHOOL_CODE)
                    .input('AcademicPeriod', sql.NVarChar, TARGET_ACADEMIC_PERIOD)
                    .input('PeriodNo', sql.Int, period.PeriodNo)
                    .input('StartTime', sql.NVarChar, formattedStartTime)
                    .input('EndTime', sql.NVarChar, formattedEndTime)
                    .query(`
                        INSERT INTO perioddef (SchoolCode, AcademicPeriod, PeriodNo, StartTime, EndTime)
                        VALUES (@SchoolCode, @AcademicPeriod, @PeriodNo, @StartTime, @EndTime)
                    `);
            }
            
            await transaction.commit();
            console.log('\n--- SUCCESS ---');
            console.log(`Successfully inserted ${sourcePeriods.length} new period definitions for school ${TARGET_SCHOOL_CODE}.`);
            console.log('---------------');

        } catch (err) {
            await transaction.rollback();
            console.error('\n--- TRANSACTION ROLLED BACK ---');
            console.error('An error occurred during the insert process:', err.message);
            console.error('No data was inserted.');
            console.error('---------------------------------');
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

populateNewPeriods();