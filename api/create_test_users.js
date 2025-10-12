// Script to create test users with proper password hashing

const { MongoClient } = require('mongodb');
const bcrypt = require('bcrypt');
require('dotenv').config();

const SALT_ROUNDS = 10;

async function createTestUsers() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/SmartCore';
  console.log('Connecting to MongoDB with URI:', uri.substring(0, 50) + '...');
  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db('SmartCore');

    console.log('Connected to MongoDB');

    // Test users with real passwords
    const testUsers = [
      {
        username: "john.smith",
        password: "teacher123",
        role: "Teacher",
        fullName: "John Smith",
        idNumber: "USR001",
        smartSchoolId: 2001,
        ascTeacherUid: "ASC001"
      },
      {
        username: "jane.doe",
        password: "admin123",
        role: "Admin",
        fullName: "Jane Doe",
        idNumber: "USR002",
        smartSchoolId: 2002,
        ascTeacherUid: "ASC002"
      },
      {
        username: "robert.johnson",
        password: "teacher456",
        role: "Teacher",
        fullName: "Robert Johnson",
        idNumber: "USR003",
        smartSchoolId: 2003,
        ascTeacherUid: "ASC003"
      }
    ];

    // Hash passwords and create user documents
    for (const user of testUsers) {
      console.log(`Creating user: ${user.username}`);
      
      // Hash the password
      const hashedPassword = await bcrypt.hash(user.password, SALT_ROUNDS);
      
      // Create UserPerson document
      const userPerson = {
        userId: null, // Will be set after insertion
        idNumber: user.idNumber,
        fullName: user.fullName,
        globalLock: false,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      // Insert UserPerson and get the inserted ID
      const userPersonResult = await db.collection('userPersons').insertOne(userPerson);
      const userId = userPersonResult.insertedId;
      
      // Update the userId field
      await db.collection('userPersons').updateOne(
        { _id: userId },
        { $set: { userId: userId } }
      );
      
      // Create UserCredential document
      const userCredential = {
        credentialId: null, // Let MongoDB auto-generate if needed
        userId: userId,
        schoolCode: "SC001",
        username: user.username,
        passHash: hashedPassword,
        role: user.role,
        isLocked: false,
        lastLoginAt: null,
        passwordUpdatedAt: new Date(),
        createdAt: new Date(),
        ascTeacherUid: user.ascTeacherUid,
        smartSchoolId: user.smartSchoolId
      };
      
      // Insert UserCredential
      await db.collection('userCredentials').insertOne(userCredential);
      
      console.log(`User ${user.username} created successfully with password: ${user.password}`);
    }

    console.log('All test users created successfully!');

  } catch (error) {
    console.error('Error creating test users:', error);
  } finally {
    await client.close();
    console.log('Disconnected from MongoDB');
  }
}

// Run the script
createTestUsers().catch(console.error);

console.log(`
Test Users Created:
1. Teacher: john.smith / teacher123
2. Admin: jane.doe / admin123
3. Teacher: robert.johnson / teacher456
`);