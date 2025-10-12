const { MongoClient } = require('mongodb');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/SmartCore';
const SCHOOL_CODE = 'SC001';
const ACADEMIC_PERIOD = '2025-2026';

const periods = [
    { periodNo: 1, startTime: '08:00:00', endTime: '08:45:00' },
    { periodNo: 2, startTime: '08:55:00', endTime: '09:40:00' },
    { periodNo: 3, startTime: '09:50:00', endTime: '10:35:00' },
    { periodNo: 4, startTime: '10:45:00', endTime: '11:30:00' },
    { periodNo: 5, startTime: '11:40:00', endTime: '12:25:00' },
    { periodNo: 6, startTime: '13:25:00', endTime: '14:10:00' },
    { periodNo: 7, startTime: '14:20:00', endTime: '15:05:00' },
    { periodNo: 8, startTime: '15:15:00', endTime: '16:00:00' },
    { periodNo: 9, startTime: '16:10:00', endTime: '16:55:00' }
];

async function populatePeriodDefinitions() {
    let client;
    try {
        client = new MongoClient(MONGODB_URI);
        await client.connect();
        const db = client.db('SmartCore');
        const periodDefsCollection = db.collection('periodDefs');

        // Clear existing period definitions for the specified school and academic period
        await periodDefsCollection.deleteMany({
            schoolCode: SCHOOL_CODE,
            academicPeriod: ACADEMIC_PERIOD
        });

        console.log('Cleared existing period definitions.');

        const allPeriodDocs = periods.map(period => ({
            schoolCode: SCHOOL_CODE,
            academicPeriod: ACADEMIC_PERIOD,
            ...period
        }));

        // Insert new period definitions
        const result = await periodDefsCollection.insertMany(allPeriodDocs);
        console.log(`${result.insertedCount} period definitions have been successfully inserted.`);

    } catch (error) {
        console.error('An error occurred while populating period definitions:', error);
    } finally {
        if (client) {
            await client.close();
            console.log('MongoDB connection closed.');
        }
    }
}

populatePeriodDefinitions();