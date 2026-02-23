# Hostel Management Portal

A full-stack hostel management application with Node.js/Express backend and React frontend.

## Project Structure

```
hostel-management-portal/
├── node-backend/                        # Node.js/Express Backend
│   ├── src/
│   │   ├── config/                      # Database configuration
│   │   ├── models/                      # Sequelize models
│   │   ├── routes/                      # Express route handlers
│   │   └── index.js                     # Main server entry
│   ├── package.json                     # Node.js dependencies
│   └── .env                             # Environment configuration
│
├── backend/                             # (Legacy) Spring Boot Backend
│   └── ...                              # Kept for reference
│
├── frontend/                            # React Frontend
│   ├── src/
│   │   ├── components/                  # Reusable components
│   │   ├── pages/                       # Page components
│   │   ├── lib/                         # API services
│   │   └── types/                       # TypeScript types
│   └── package.json                     # Frontend dependencies
│
└── README.md
```

## Tech Stack

### Backend (Node.js)
- **Runtime**: Node.js 18+
- **Framework**: Express.js 4.x
- **ORM**: Sequelize 6.x
- **Database**: MySQL

### Frontend
- **Framework**: React with Vite
- **Language**: TypeScript
- **Styling**: Tailwind CSS

## Getting Started

### Prerequisites
- Node.js 18 or higher
- MySQL server (e.g., XAMPP with MySQL on port 3307)

### Backend Setup

1. Navigate to node-backend directory:
   ```bash
   cd node-backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment (edit `.env` if needed):
   ```env
   PORT=8080
   DB_HOST=localhost
   DB_PORT=3307
   DB_NAME=hostel_management_db
   DB_USER=root
   DB_PASSWORD=
   ```

4. Start the server:
   ```bash
   npm run dev
   ```

5. Backend will be available at `http://localhost:8080`

### Frontend Setup

1. Navigate to frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start development server:
   ```bash
   npm run dev
   ```

4. Frontend will be available at `http://localhost:3000`

## API Endpoints

### Rooms
- `GET /api/rooms` - Get all rooms
- `GET /api/rooms/{id}` - Get room by ID
- `POST /api/rooms` - Create new room
- `PUT /api/rooms/{id}` - Update room
- `DELETE /api/rooms/{id}` - Delete room

### Bookings
- `GET /api/bookings` - Get all bookings
- `GET /api/bookings/{id}` - Get booking by ID
- `POST /api/bookings` - Create new booking
- `PUT /api/bookings/{id}` - Update booking
- `DELETE /api/bookings/{id}` - Delete booking

### Guests
- `GET /api/guests` - Get all guests
- `GET /api/guests/{id}` - Get guest by ID
- `POST /api/guests` - Create new guest
- `PUT /api/guests/{id}` - Update guest
- `DELETE /api/guests/{id}` - Delete guest

## Features

- **Dashboard**: Overview of hotel statistics and recent bookings
- **Room Management**: CRUD operations for hotel rooms
- **Booking Management**: Create and manage room bookings
- **Guest Management**: Manage guest information
- **Responsive Design**: Works on desktop and mobile devices

## Development

### Running Tests

Backend tests:
```bash
cd backend
./mvnw test
```

Frontend tests:
```bash
cd frontend
npm run lint
```

## License

This project is for educational purposes.
