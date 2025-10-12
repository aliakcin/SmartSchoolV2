const { MongoClient } = require('mongodb');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/SmartCore';

// --- Configuration ---
// The user we want to link
const TEACHER_USERNAME = 'test.teacher'; 
const SCHOOL_CODE = 'SC001';

// The classes (departments) we want to link the teacher to.
// Make sure these departmentKeys exist in your 'departments' collection.
// The populate_sample_data.js script creates these.
const DEPARTMENT_KEYS_TO_LINK = [1, 2]; // e.g., '10A' and '10B'

// The courses we will link the teacher to.
// Make sure these courseKeys exist in your 'courses' collection.
const COURSE_KEYS_TO_LINK = [101, 102]; // e.g., 'Mathematics' and 'Physics'

async function linkTeacherToClasses() {
    let client;
    try {
        client = new MongoClient(MONGODB_URI);
        await client.connect();
        const db = client.db('SmartCore');
        console.log('Connected to MongoDB.');

        const userCredentials = db.collection('userCredentials');
        const instructorCourseMaps = db.collection('instructorCourseMaps');
        const courseClassMaps = db.collection('courseClassMaps');
        const courses = db.collection('courses');
        const departments = db.collection('departments');

        // 1. Find the teacher's user ID
        const teacher = await userCredentials.findOne({ username: TEACHER_USERNAME, schoolCode: SCHOOL_CODE });
        if (!teacher) {
            console.error(`Error: Teacher with username '${TEACHER_USERNAME}' not found.`);
            return;
        }
        const teacherUserId = teacher.userId;
        console.log(`Found teacher '${TEACHER_USERNAME}' with userId: ${teacherUserId}.`);

        // 2. Verify that the courses and departments exist
        const courseCount = await courses.countDocuments({ courseKey: { $in: COURSE_KEYS_TO_LINK } });
        if (courseCount !== COURSE_KEYS_TO_LINK.length) {
            console.error("Error: One or more courseKeys in COURSE_KEYS_TO_LINK do not exist in the 'courses' collection. Please check your data.");
            return;
        }
        const deptCount = await departments.countDocuments({ departmentKey: { $in: DEPARTMENT_KEYS_TO_LINK } });
        if (deptCount !== DEPARTMENT_KEYS_TO_LINK.length) {
            console.error("Error: One or more departmentKeys in DEPARTMENT_KEYS_TO_LINK do not exist in the 'departments' collection. Please check your data.");
            return;
        }
        console.log('Verified that all specified courses and departments exist.');

        // 3. Create Instructor -> Course mappings
        console.log(`Creating links between teacher and courses...`);
        for (const courseKey of COURSE_KEYS_TO_LINK) {
            await instructorCourseMaps.updateOne(
                { userId: teacherUserId, courseKey: courseKey },
                { $set: { userId: teacherUserId, courseKey: courseKey, isActive: true, createdAt: new Date() } },
                { upsert: true }
            );
            console.log(`  - Linked teacher to courseKey: ${courseKey}`);

            // 4. Create Course -> Department mappings for each course
            console.log(`  - Creating links between course ${courseKey} and departments...`);
            for (const departmentKey of DEPARTMENT_KEYS_TO_LINK) {
                await courseClassMaps.updateOne(
                    { courseKey: courseKey, departmentKey: departmentKey },
                    { $set: { courseKey: courseKey, departmentKey: departmentKey, isActive: true, createdAt: new Date() } },
                    { upsert: true }
                );
                console.log(`    - Linked courseKey ${courseKey} to departmentKey: ${departmentKey}`);
            }
        }
        
        console.log("\nSuccessfully created all necessary links for the teacher.");
        console.log(`The user '${TEACHER_USERNAME}' should now see ${DEPARTMENT_KEYS_TO_LINK.length} classes.`);

    } catch (error) {
        console.error('An error occurred during the linking process:', error);
    } finally {
        if (client) {
            await client.close();
            console.log('MongoDB connection closed.');
        }
    }
}

linkTeacherToClasses();