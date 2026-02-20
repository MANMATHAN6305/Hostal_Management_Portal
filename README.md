# Hotel Management Portal

A full-stack hotel management application with Spring Boot backend and React (Next.js) frontend.

## Project Structure

```
hotel-management-portal/
├── backend/                             # Spring Boot Backend
│   ├── src/main/java/com/hotelmanagement/
│   │   ├── controller/                  # REST API controllers
│   │   ├── service/                     # Business logic
│   │   ├── repository/                  # Data access layer
│   │   ├── model/                       # Entity classes
│   │   ├── dto/                         # Data Transfer Objects
│   │   ├── config/                      # Configuration classes
│   │   └── exception/                   # Exception handling
│   ├── src/main/resources/              # Application configuration
│   └── pom.xml                          # Maven configuration
│
├── frontend/                            # React (Next.js) Frontend
│   ├── app/                             # Pages and routes
│   ├── components/                      # Reusable components
│   ├── services/                        # API services
│   ├── types/                           # TypeScript types
│   └── hooks/                           # Custom hooks
│
└── README.md
```

## Tech Stack

### Backend
- **Framework**: Spring Boot 3.5
- **Language**: Java 21
- **Build Tool**: Maven

### Frontend
- **Framework**: Next.js 16 (React)
- **Language**: TypeScript
- **Styling**: Tailwind CSS

## Getting Started

### Prerequisites
- Java 21 or higher
- Node.js 18 or higher
- Maven 3.8 or higher

### Backend Setup

1. Navigate to backend directory:
   ```bash
   cd backend
   ```

2. Run the Spring Boot application:
   ```bash
   ./mvnw spring-boot:run
   ```
3. Backend will be available at `http://localhost:8080`

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
