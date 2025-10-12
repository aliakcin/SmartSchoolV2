const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { MongoClient } = require('mongodb');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI;
const JWT_SECRET = process.env.JWT_SECRET;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB connection
let db;
let client;

async function connectToDatabase() {
  try {
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    db = client.db('SmartCore');
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
}

// Authentication middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
}

// Routes

// Login endpoint
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password, schoolCode } = req.body;

    // Validate input
    if (!username || !password) {
      return res.status(400).json({ 
        error: 'Username and password are required' 
      });
    }

    // Find user credential
    const userCredential = await db.collection('userCredentials').findOne({
      username: username,
      schoolCode: schoolCode || 'SC001' // Default to SC001 if not provided
    });

    if (!userCredential) {
      return res.status(401).json({ 
        error: 'Invalid username or password' 
      });
    }

    // Check if user is locked
    if (userCredential.isLocked) {
      return res.status(403).json({ 
        error: 'Account is locked. Please contact administrator.' 
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, userCredential.passHash);
    
    // For development/testing, also check our simple hash
    let isSimplePasswordValid = false;
    if (userCredential.passHash.startsWith('$2b$10$simplehash')) {
      // Simple hash verification for development
      function simpleHash(password) {
        let hash = 0;
        for (let i = 0; i < password.length; i++) {
          const char = password.charCodeAt(i);
          hash = ((hash << 5) - hash) + char;
          hash = hash & hash;
        }
        return "$2b$10$simplehash" + Math.abs(hash).toString(36);
      }
      isSimplePasswordValid = userCredential.passHash === simpleHash(password);
    }

    if (!isPasswordValid && !isSimplePasswordValid) {
      return res.status(401).json({ 
        error: 'Invalid username or password' 
      });
    }

    // Find user person details
    const userPerson = await db.collection('userPersons').findOne({
      userId: userCredential.userId
    });

    if (!userPerson) {
      return res.status(500).json({ 
        error: 'User profile not found' 
      });
    }

    // Update last login time
    await db.collection('userCredentials').updateOne(
      { _id: userCredential._id },
      { $set: { lastLoginAt: new Date() } }
    );

    // Create JWT token
    const token = jwt.sign(
      {
        userId: userCredential.userId,
        username: userCredential.username,
        schoolCode: userCredential.schoolCode,
        role: userCredential.role
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Return user data and token
    const userData = {
      userId: userCredential.userId,
      username: userCredential.username,
      fullName: userPerson.fullName,
      role: userCredential.role,
      schoolCode: userCredential.schoolCode,
      accessToken: token
    };

    res.json({
      message: 'Login successful',
      user: userData
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      error: 'Internal server error' 
    });
  }
});

// Get user profile (protected route)
app.get('/api/user/profile', authenticateToken, async (req, res) => {
  try {
    // Find user credential
    const userCredential = await db.collection('userCredentials').findOne({
      userId: req.user.userId,
      schoolCode: req.user.schoolCode
    });

    if (!userCredential) {
      return res.status(404).json({ 
        error: 'User not found' 
      });
    }

    // Find user person details
    const userPerson = await db.collection('userPersons').findOne({
      userId: userCredential.userId
    });

    if (!userPerson) {
      return res.status(404).json({ 
        error: 'User profile not found' 
      });
    }

    const userData = {
      userId: userCredential.userId,
      username: userCredential.username,
      fullName: userPerson.fullName,
      role: userCredential.role,
      schoolCode: userCredential.schoolCode,
      createdAt: userCredential.createdAt
    };

    res.json(userData);

  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ 
      error: 'Internal server error' 
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Smart School API is running',
    timestamp: new Date().toISOString()
  });
});

// Connect to database and start server
connectToDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`Smart School API server is running on port ${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/api/health`);
  });
}).catch(error => {
  console.error('Failed to start server:', error);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down gracefully...');
  if (client) {
    await client.close();
  }
  process.exit(0);
});
