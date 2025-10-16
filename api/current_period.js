const sql = require('mssql');
require('dotenv').config();

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

function getCurrentTime() {
    const now = new Date();
    // Format as HH:MM:SS
    return now.toTimeString().split(' ')[0];
}

function timeToMinutes(timeStr) {
    const [hours, minutes, seconds] = timeStr.split(':').map(Number);
    return hours * 60 + minutes + seconds / 60;
}

function findCurrentPeriod(periods, currentTime) {
    const currentMinutes = timeToMinutes(currentTime);
    
    for (const period of periods) {
        const startMinutes = timeToMinutes(period.StartTime);
        const endMinutes = timeToMinutes(period.EndTime);
        
        // Check if current time falls within this period (inclusive of start, exclusive of end)
        if (currentMinutes >= startMinutes && currentMinutes < endMinutes) {
            return period;
        }
    }
    
    return null; // No period found
}

async function getCurrentPeriodForSchool(schoolCode) {
    let pool;
    try {
        console.log(`Connecting to SQL Server for school: ${schoolCode}...`);
        pool = await sql.connect(sqlConfig);
        console.log('Connected successfully.');

        // Query period definitions for the specified school
        const result = await pool.request()
            .input('schoolCode', sql.NVarChar, schoolCode)
            .query('SELECT * FROM perioddef WHERE SchoolCode = @schoolCode ORDER BY PeriodNo');

        if (result.recordset.length === 0) {
            console.warn(`\nNo period definitions found for school code: ${schoolCode}`);
            return null;
        }

        const periods = result.recordset;
        const currentTime = getCurrentTime();
        console.log(`\nCurrent time: ${currentTime}`);
        
        console.log('\n=== PERIOD DEFINITIONS ===');
        console.log('PeriodNo | StartTime | EndTime   | PeriodName');
        console.log('---------|-----------|-----------|----------------');
        
        periods.forEach(period => {
            console.log(
                `${String(period.PeriodNo).padEnd(8)} | ` +
                `${String(period.StartTime).padEnd(9)} | ` +
                `${String(period.EndTime).padEnd(9)} | ` +
                `${period.PeriodName || ''}`
            );
        });

        // Find the current period
        const currentPeriod = findCurrentPeriod(periods, currentTime);
        
        if (currentPeriod) {
            console.log(`\n=== CURRENT PERIOD ===`);
            console.log(`Period ${currentPeriod.PeriodNo} is currently active`);
            console.log(`Time range: ${currentPeriod.StartTime} - ${currentPeriod.EndTime}`);
            if (currentPeriod.PeriodName) {
                console.log(`Name: ${currentPeriod.PeriodName}`);
            }
        } else {
            console.log(`\n=== CURRENT PERIOD ===`);
            console.log('No period is currently active');
        }
        
        return currentPeriod;

    } catch (err) {
        console.error('An error occurred:', err.message);
        return null;
    } finally {
        if (pool) {
            await pool.close();
            console.log('Database connection closed.');
        }
    }
}

// Main execution
async function main() {
    // Get school code from command line arguments
    const schoolCode = process.argv[2] || '34002'; // Default to SC001 if not provided
    
    console.log(`Checking current period for school: ${schoolCode}`);
    await getCurrentPeriodForSchool(schoolCode);
}

main();
