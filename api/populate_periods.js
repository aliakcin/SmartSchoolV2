const { MongoClient } = require('mongodb');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/SmartCore';
const SCHOOL_CODE = 'SC001';
const ACADEMIC_PERIOD = '2025-2026';

const periods = [
    { periodKey: 1, periodName: '1st Period', periodCode: 'P1', startTime: '08:00', endTime: '08:45' },
    { periodKey: 2, periodName: '2nd Period', periodCode: 'P2', startTime: '08:55', endTime: '09:40' },
    { periodKey: 3, periodName: '3rd Period', periodCode: 'P3', startTime: '09:50', endTime: '10:35' },
    { periodKey: 4, periodName: '4th Period', periodCode: 'P4', startTime: '10:45', endTime: '11:30' },
    { periodKey: 5, periodName: '5th Period', periodCode: 'P5', startTime: '11:40', endTime: '12:25' },
    { periodKey: 6, periodName: '6th Period', periodCode: 'P6', startTime: '13:25', endTime: '14:10' },
    { periodKey: 7, periodName: '7th Period', periodCode: 'P7', startTime: '14:20', endTime: '15:05' },
    { periodKey: 8, periodName: '8th Period', periodCode: 'P8', startTime: '15:15', endTime: '16:00' },
    { periodKey: 9, periodName: '9th Period', periodCode: 'P9', startTime: '16:10', endTime: '16:55' }
];

const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

async function populatePeriods() {
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

        const allPeriodDocs = [];
        daysOfWeek.forEach(day => {
            periods.forEach(period => {
                allPeriodDocs.push({
                    schoolCode: SCHOOL_CODE,
                    academicPeriod: ACADEMIC_PERIOD,
                    dayOfWeek: day,
                    ...period
                });
            });
        });

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

populatePeriods();