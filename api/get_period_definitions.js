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

async function getPeriodDefinitions() {
    let pool;
    try {
        console.log('Connecting to SQL Server...');
        pool = await sql.connect(sqlConfig);
        console.log('Connected successfully.');

        console.log('Fetching all records from perioddef table...');
        const result = await pool.request().query('SELECT * FROM perioddef');

        if (result.recordset.length === 0) {
            console.warn('\n--- NO RECORDS FOUND ---');
            console.warn('The perioddef table is empty.');
            console.warn('----------------------');
            return;
        }

        console.log('\n--- PERIOD DEFINITIONS ---');
        console.table(result.recordset);
        console.log('--------------------------');

    } catch (err) {
        console.error('An error occurred:', err.message);
    } finally {
        if (pool) {
            await pool.close();
            console.log('Database connection closed.');
        }
    }
}

getPeriodDefinitions();