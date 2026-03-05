# Hostel Management Portal - Node.js Backend

This is the Node.js/Express.js backend for the Hostel Management Portal, replacing the original Spring Boot implementation.

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MySQL (via Sequelize ORM)
- **Environment**: dotenv for configuration

## Prerequisites

- Node.js v18+ installed
- MySQL server running (e.g., XAMPP on port 3307)
- Database `hostel_management_db` (will be created automatically)

## Installation

1. Navigate to the node-backend directory:
   ```bash
   cd node-backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables (optional - defaults work with XAMPP):
   Edit `.env` file:
   ```env
   PORT=8080
   DB_HOST=localhost
   DB_PORT=3307
   DB_NAME=hostel_management_db
   DB_USER=root
   DB_PASSWORD=
   FRONTEND_URL=http://localhost:5173
   DB_SYNC=true
   ```

   For deployment, set `FRONTEND_URL` to your frontend domain (for example: `https://hostal-management-portal.onrender.com`).
   For production deployments, set `DB_SYNC=false` to avoid runtime schema sync conflicts.

4. Start the server:
   ```bash
   # Development mode (with hot reload)
   npm run dev

   # Production mode
   npm start
   ```

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/users` - Get all users

### Students
- `GET /api/students` - Get all students
- `GET /api/students/:id` - Get student by ID
- `POST /api/students` - Create new student
- `PUT /api/students/:id` - Update student
- `DELETE /api/students/:id` - Delete student

### Rooms
- `GET /api/rooms` - Get all rooms
- `GET /api/rooms/available` - Get available rooms
- `GET /api/rooms/:id` - Get room by ID
- `POST /api/rooms` - Create new room
- `PUT /api/rooms/:id` - Update room
- `DELETE /api/rooms/:id` - Delete room

### Allocations
- `GET /api/allocations` - Get all allocations
- `GET /api/allocations/:id` - Get allocation by ID
- `POST /api/allocations` - Create new allocation
- `PUT /api/allocations/:id` - Update allocation
- `DELETE /api/allocations/:id` - Delete allocation

## Project Structure

```
node-backend/
├── src/
│   ├── config/
│   │   └── database.js      # Sequelize database configuration
│   ├── models/
│   │   ├── User.js          # User model
│   │   ├── Student.js       # Student model
│   │   ├── Room.js          # Room model
│   │   ├── Allocation.js    # Allocation model
│   │   └── index.js         # Model exports
│   ├── routes/
│   │   ├── auth.routes.js   # Authentication routes
│   │   ├── student.routes.js# Student routes
│   │   ├── room.routes.js   # Room routes
│   │   └── allocation.routes.js # Allocation routes
│   └── index.js             # Main server entry point
├── .env                     # Environment configuration
├── .gitignore
├── package.json
└── README.md
```

## Database Schema

The application uses the same MySQL database schema as the original Spring Boot application, ensuring compatibility with existing data.

### Tables
- `users` - System users for authentication
- `students` - Hostel residents
- `rooms` - Hostel rooms
- `allocations` - Room allocations linking students to rooms

## Migration from Spring Boot

This Node.js backend is a drop-in replacement for the Spring Boot backend:

1. Uses the same database and schema
2. Exposes the same API endpoints
3. Returns the same JSON response format
4. Runs on the same port (8080)

Simply stop the Spring Boot server and start this Node.js server to switch backends.
