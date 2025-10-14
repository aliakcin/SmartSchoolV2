# Smart School API

This is the API for the Smart School application. It provides RESTful endpoints for managing students, courses, grades, and other school-related data.

## Versions

- **MongoDB Version**: The original version using MongoDB as the database
- **SQL Server Version**: New version using SQL Server as the database (see [README_SQL_SERVER.md](README_SQL_SERVER.md))

## Quick Start (MongoDB Version)

1. Install dependencies:
   ```bash
   cd api
   npm install
   ```

2. Start the server:
   ```bash
   npm start
   ```
   
   Or for development with auto-restart:
   ```bash
   npm run dev
   ```

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `GET /api/user/profile` - Get user profile (protected)

### Health Check
- `GET /api/health` - API health status

## Environment Variables

The API uses the following environment variables (set in `.env` file):

- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - Secret key for JWT token generation
- `PORT` - Server port (default: 3000)

## Testing the API

### Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "test.teacher",
    "password": "password123",
    "schoolCode": "SC001"
  }'
```

## Dependencies

- Express.js - Web framework
- MongoDB - Database driver
- Bcrypt - Password hashing
- JWT - Token authentication
- Cors - Cross-origin resource sharing
- Dotenv - Environment variable management