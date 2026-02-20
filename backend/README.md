# Hotel Management Portal - Backend

Spring Boot REST API backend for the Hotel Management Portal.

## Tech Stack

- **Framework**: Spring Boot 3.5
- **Language**: Java 21
- **Build Tool**: Maven

## Project Structure

```
backend/
├── src/main/java/com/hotelmanagement/
│   ├── HotelManagementApplication.java   # Main entry point
│   ├── controller/                       # REST API endpoints
│   │   ├── HomeController.java
│   │   ├── RoomController.java
│   │   ├── BookingController.java
│   │   └── GuestController.java
│   ├── service/                          # Business logic
│   │   └── impl/                         # Service implementations
│   ├── model/                            # Entity classes
│   ├── dto/                              # Data Transfer Objects
│   ├── config/                           # Configuration classes
│   ├── exception/                        # Exception handling
│   └── repository/                       # Data access layer
└── src/main/resources/
    └── application.properties
```

## Getting Started

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Run the application:
   ```bash
   ./mvnw spring-boot:run
   ```
   On Windows:
   ```bash
   mvnw.cmd spring-boot:run
   ```

3. The API will be available at `http://localhost:8080`

## API Endpoints

### Health Check
- `GET /` - Welcome message
- `GET /api/health` - Health status

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

## Running Tests

```bash
./mvnw test
```
