// Script to clear existing users and create fresh test users

const { MongoClient } = require('mongodb');
const bcrypt = require('bcrypt');
require('dotenv').config();

const SALT_ROUNDS = 10;

async function resetAndCreateTestUsers() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("Error: MONGODB_URI is not defined in your .env file.");
    return;
  }
  console.log('Connecting to MongoDB...');
  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db('SmartCore');
    console.log('Connected to MongoDB');

    // 1. Clear existing user data
    console.log('Clearing old user data from userPersons and userCredentials collections...');
    await db.collection('userPersons').deleteMany({});
    await db.collection('userCredentials').deleteMany({});
    console.log('Old user data cleared.');

    // 2. Define test users
    const testUsers = [
      { username: "john.smith", password: "teacher123", role: "Teacher", fullName: "John Smith", idNumber: "USR001", smartSchoolId: 2001, ascTeacherUid: "ASC001", userId: 1 },
      { username: "jane.doe", password: "admin123", role: "Admin", fullName: "Jane Doe", idNumber: "USR002", smartSchoolId: 2002, ascTeacherUid: "ASC002", userId: 2 },
      { username: "robert.johnson", password: "teacher456", role: "Teacher", fullName: "Robert Johnson", idNumber: "USR003", smartSchoolId: 2003, ascTeacherUid: "ASC003", userId: 3 }
    ];

    // 3. Create fresh user documents
    for (const user of testUsers) {
      console.log(`Creating user: ${user.username}`);
      
      const hashedPassword = await bcrypt.hash(user.password, SALT_ROUNDS);
      
      const userPerson = {
        userId: user.userId,
        idNumber: user.idNumber,
        fullName: user.fullName,
        globalLock: false,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      await db.collection('userPersons').insertOne(userPerson);
      
      const userCredential = {
        credentialId: user.userId, // Use userId for simplicity
        userId: user.userId,
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
      await db.collection('userCredentials').insertOne(userCredential);
      
      console.log(`User ${user.username} created successfully. Password: ${user.password}`);
    }

    console.log('All test users created successfully!');

  } catch (error) {
    console.error('Error during script execution:', error);
  } finally {
    await client.close();
    console.log('Disconnected from MongoDB');
  }
}

resetAndCreateTestUsers().catch(console.error);