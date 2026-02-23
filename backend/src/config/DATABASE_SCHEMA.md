# Database Schema - Hostel Management Portal

## Overview
This document describes the database schema for the Hostel Management Portal application using MySQL with Sequelize ORM.

---

## Database Creation

```sql
-- Create the database
CREATE DATABASE IF NOT EXISTS hostel_portal;

-- Use the database
USE hostel_portal;
```

---

## Tables

### 1. Users
Stores user authentication and role information.

| Column    | Type         | Constraints                                        |
|-----------|--------------|----------------------------------------------------|
| id        | BIGINT       | PRIMARY KEY, AUTO_INCREMENT                        |
| fullName  | VARCHAR(100) | NOT NULL                                           |
| email     | VARCHAR(150) | NOT NULL, UNIQUE                                   |
| password  | VARCHAR(255) | NOT NULL                                           |
| role      | ENUM         | 'ADMIN', 'WARDEN', 'STAFF', 'STUDENT' DEFAULT: 'STAFF' |
| isActive  | BOOLEAN      | DEFAULT TRUE                                       |
| createdAt | DATETIME     | AUTO                                               |
| updatedAt | DATETIME     | AUTO                                               |

```sql
CREATE TABLE Users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    fullName VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('ADMIN', 'WARDEN', 'STAFF', 'STUDENT') DEFAULT 'STAFF',
    isActive BOOLEAN DEFAULT TRUE,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

---

### 2. Students
Stores student information.

| Column        | Type         | Constraints                 |
|---------------|--------------|----------------------------|
| id            | BIGINT       | PRIMARY KEY, AUTO_INCREMENT |
| studentId     | VARCHAR(50)  | NOT NULL, UNIQUE            |
| gender        | ENUM         | 'MALE', 'FEMALE', 'OTHER'   |
| firstName     | VARCHAR(100) | NOT NULL                    |
| lastName      | VARCHAR(100) |                             |
| email         | VARCHAR(150) | UNIQUE                      |
| phone         | VARCHAR(20)  |                             |
| department    | VARCHAR(100) |                             |
| year          | INTEGER      |                             |
| dateOfBirth   | DATE         |                             |
| bloodGroup    | VARCHAR(10)  |                             |
| guardianName  | VARCHAR(100) |                             |
| guardianPhone | VARCHAR(20)  |                             |
| address       | TEXT         |                             |
| createdAt     | DATETIME     | AUTO                        |
| updatedAt     | DATETIME     | AUTO                        |

```sql
CREATE TABLE Students (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    studentId VARCHAR(50) NOT NULL UNIQUE,
    gender ENUM('MALE', 'FEMALE', 'OTHER'),
    firstName VARCHAR(100) NOT NULL,
    lastName VARCHAR(100),
    email VARCHAR(150) UNIQUE,
    phone VARCHAR(20),
    department VARCHAR(100),
    year INT,
    dateOfBirth DATE,
    bloodGroup VARCHAR(10),
    guardianName VARCHAR(100),
    guardianPhone VARCHAR(20),
    address TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

---

### 3. Rooms
Stores hostel room information.

| Column        | Type          | Constraints                                    |
|---------------|---------------|------------------------------------------------|
| id            | BIGINT        | PRIMARY KEY, AUTO_INCREMENT                    |
| roomNumber    | VARCHAR(20)   | NOT NULL, UNIQUE                               |
| blockName     | VARCHAR(50)   | DEFAULT 'A'                                    |
| floorNumber   | INTEGER       | DEFAULT 1                                      |
| roomType      | ENUM          | 'SINGLE', 'DOUBLE', 'TRIPLE', 'DORMITORY'      |
| pricePerNight | DECIMAL(10,2) | DEFAULT 0 (Fee per Semester)                   |
| capacity      | INTEGER       | NOT NULL, DEFAULT 4                            |
| occupied      | INTEGER       | DEFAULT 0                                      |
| status        | ENUM          | 'AVAILABLE', 'OCCUPIED', 'MAINTENANCE'         |
| amenities     | VARCHAR(255)  |                                                |
| description   | TEXT          |                                                |
| createdAt     | DATETIME      | AUTO                                           |
| updatedAt     | DATETIME      | AUTO                                           |

```sql
CREATE TABLE Rooms (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    roomNumber VARCHAR(20) NOT NULL UNIQUE,
    blockName VARCHAR(50) DEFAULT 'A',
    floorNumber INT DEFAULT 1,
    roomType ENUM('SINGLE', 'DOUBLE', 'TRIPLE', 'DORMITORY') DEFAULT 'DOUBLE',
    pricePerNight DECIMAL(10, 2) DEFAULT 0,
    capacity INT NOT NULL DEFAULT 4,
    occupied INT DEFAULT 0,
    status ENUM('AVAILABLE', 'OCCUPIED', 'MAINTENANCE') DEFAULT 'AVAILABLE',
    amenities VARCHAR(255),
    description TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

---

### 4. Allocations
Stores room allocation records linking students to rooms.

| Column          | Type         | Constraints                           |
|-----------------|--------------|---------------------------------------|
| id              | BIGINT       | PRIMARY KEY, AUTO_INCREMENT           |
| StudentId       | BIGINT       | FOREIGN KEY → Students(id)            |
| RoomId          | BIGINT       | FOREIGN KEY → Rooms(id)               |
| academicYear    | VARCHAR(20)  |                                       |
| semester        | VARCHAR(20)  |                                       |
| status          | ENUM         | 'ACTIVE', 'VACATED', 'PENDING'        |
| allocationDate  | DATE         |                                       |
| endDate         | DATE         |                                       |
| specialRequests | TEXT         |                                       |
| createdAt       | DATETIME     | AUTO                                  |
| updatedAt       | DATETIME     | AUTO                                  |

```sql
CREATE TABLE Allocations (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    StudentId BIGINT,
    RoomId BIGINT,
    academicYear VARCHAR(20),
    semester VARCHAR(20),
    status ENUM('ACTIVE', 'VACATED', 'PENDING') DEFAULT 'ACTIVE',
    allocationDate DATE,
    endDate DATE,
    specialRequests TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (StudentId) REFERENCES Students(id) ON DELETE SET NULL ON UPDATE CASCADE,
    FOREIGN KEY (RoomId) REFERENCES Rooms(id) ON DELETE SET NULL ON UPDATE CASCADE
);
```

---

## Complete SQL Script

```sql
-- =============================================
-- HOSTEL MANAGEMENT PORTAL - DATABASE SCHEMA
-- =============================================

-- Create database
CREATE DATABASE IF NOT EXISTS hostel_portal;
USE hostel_portal;

-- Drop tables if they exist (for fresh setup)
DROP TABLE IF EXISTS Allocations;
DROP TABLE IF EXISTS Students;
DROP TABLE IF EXISTS Rooms;
DROP TABLE IF EXISTS Users;

-- Create Users table
CREATE TABLE Users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    fullName VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('ADMIN', 'WARDEN', 'STAFF', 'STUDENT') DEFAULT 'STAFF',
    isActive BOOLEAN DEFAULT TRUE,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create Students table
CREATE TABLE Students (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    studentId VARCHAR(50) NOT NULL UNIQUE,
    gender ENUM('MALE', 'FEMALE', 'OTHER'),
    firstName VARCHAR(100) NOT NULL,
    lastName VARCHAR(100),
    email VARCHAR(150) UNIQUE,
    phone VARCHAR(20),
    department VARCHAR(100),
    year INT,
    dateOfBirth DATE,
    bloodGroup VARCHAR(10),
    guardianName VARCHAR(100),
    guardianPhone VARCHAR(20),
    address TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create Rooms table
CREATE TABLE Rooms (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    roomNumber VARCHAR(20) NOT NULL UNIQUE,
    blockName VARCHAR(50) DEFAULT 'A',
    floorNumber INT DEFAULT 1,
    roomType ENUM('SINGLE', 'DOUBLE', 'TRIPLE', 'DORMITORY') DEFAULT 'DOUBLE',
    pricePerNight DECIMAL(10, 2) DEFAULT 0,
    capacity INT NOT NULL DEFAULT 4,
    occupied INT DEFAULT 0,
    status ENUM('AVAILABLE', 'OCCUPIED', 'MAINTENANCE') DEFAULT 'AVAILABLE',
    amenities VARCHAR(255),
    description TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create Allocations table
CREATE TABLE Allocations (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    StudentId BIGINT,
    RoomId BIGINT,
    academicYear VARCHAR(20),
    semester VARCHAR(20),
    status ENUM('ACTIVE', 'VACATED', 'PENDING') DEFAULT 'ACTIVE',
    allocationDate DATE,
    endDate DATE,
    specialRequests TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (StudentId) REFERENCES Students(id) ON DELETE SET NULL ON UPDATE CASCADE,
    FOREIGN KEY (RoomId) REFERENCES Rooms(id) ON DELETE SET NULL ON UPDATE CASCADE
);

-- Create indexes for better performance
CREATE INDEX idx_users_email ON Users(email);
CREATE INDEX idx_students_studentId ON Students(studentId);
CREATE INDEX idx_rooms_roomNumber ON Rooms(roomNumber);
CREATE INDEX idx_allocations_student ON Allocations(StudentId);
CREATE INDEX idx_allocations_room ON Allocations(RoomId);
```

---

## Sample Data

```sql
-- Insert sample admin user
INSERT INTO Users (fullName, email, password, role, isActive) VALUES 
('Admin User', 'admin@hostel.com', 'admin123', 'ADMIN', TRUE),
('Warden John', 'warden@hostel.com', 'warden123', 'WARDEN', TRUE);

-- Insert sample rooms
INSERT INTO Rooms (roomNumber, blockName, floorNumber, roomType, pricePerNight, capacity, status, amenities, description) VALUES 
('101', 'Boys Hostel A', 1, 'SINGLE', 15000, 1, 'AVAILABLE', 'WiFi, AC, Attached Bathroom', 'Single occupancy room with AC'),
('102', 'Boys Hostel A', 1, 'DOUBLE', 12000, 2, 'AVAILABLE', 'WiFi, Fan, Common Bathroom', 'Double sharing room'),
('103', 'Boys Hostel A', 1, 'TRIPLE', 10000, 3, 'AVAILABLE', 'WiFi, Fan', 'Triple sharing room'),
('201', 'Girls Hostel A', 2, 'SINGLE', 15000, 1, 'AVAILABLE', 'WiFi, AC, Attached Bathroom', 'Single occupancy room with AC'),
('202', 'Girls Hostel A', 2, 'DOUBLE', 12000, 2, 'AVAILABLE', 'WiFi, Fan, Common Bathroom', 'Double sharing room'),
('203', 'Girls Hostel B', 2, 'DORMITORY', 8000, 6, 'AVAILABLE', 'WiFi, Fan', 'Dormitory style room');

-- Insert sample students
INSERT INTO Students (studentId, gender, firstName, lastName, email, phone, department, year, dateOfBirth, bloodGroup, guardianName, guardianPhone, address) VALUES 
('2024CSE001', 'MALE', 'John', 'Doe', 'john@example.com', '9876543210', 'Computer Science (CSE)', 2, '2005-03-15', 'O+', 'James Doe', '9876543211', '123 Main St, City'),
('2024ECE002', 'FEMALE', 'Jane', 'Smith', 'jane@example.com', '9876543212', 'Electronics (ECE)', 3, '2004-07-22', 'A+', 'Mary Smith', '9876543213', '456 Oak Ave, Town'),
('2024ME003', 'MALE', 'Bob', 'Johnson', 'bob@example.com', '9876543214', 'Mechanical (ME)', 1, '2006-01-10', 'B+', 'Robert Johnson', '9876543215', '789 Pine Rd, Village');

-- Insert sample allocations
INSERT INTO Allocations (StudentId, RoomId, academicYear, semester, status, allocationDate, endDate, specialRequests) VALUES 
(1, 1, '2026-2027', 'Fall', 'ACTIVE', '2026-02-23', '2026-08-23', 'Ground floor preferred'),
(2, 4, '2026-2027', 'Fall', 'ACTIVE', '2026-02-23', '2026-08-23', NULL),
(3, 2, '2026-2027', 'Fall', 'ACTIVE', '2026-02-23', '2026-08-23', 'Near library');

-- Update room occupancy
UPDATE Rooms SET occupied = 1 WHERE id IN (1, 4);
UPDATE Rooms SET occupied = 1 WHERE id = 2;
```

---

## Useful Queries

### View all allocations with student and room details
```sql
SELECT 
    a.id AS allocation_id,
    s.studentId,
    CONCAT(s.firstName, ' ', s.lastName) AS studentName,
    s.department,
    r.roomNumber,
    r.blockName,
    r.roomType,
    a.academicYear,
    a.semester,
    a.status,
    a.allocationDate,
    a.endDate
FROM Allocations a
LEFT JOIN Students s ON a.StudentId = s.id
LEFT JOIN Rooms r ON a.RoomId = r.id;
```

### View available rooms
```sql
SELECT * FROM Rooms WHERE status = 'AVAILABLE' AND occupied < capacity;
```

### View room occupancy status
```sql
SELECT 
    roomNumber,
    blockName,
    roomType,
    floorNumber,
    capacity,
    occupied,
    (capacity - occupied) AS available_beds,
    status,
    pricePerNight AS fee_per_semester,
    ROUND((occupied / capacity) * 100, 2) AS occupancy_percentage
FROM Rooms;
```

### Count students by department
```sql
SELECT department, COUNT(*) AS student_count 
FROM Students 
GROUP BY department;
```

### View students without room allocation
```sql
SELECT s.* 
FROM Students s
LEFT JOIN Allocations a ON s.id = a.StudentId
WHERE a.id IS NULL OR a.status = 'VACATED';
```

### View active allocations
```sql
SELECT 
    a.*,
    s.firstName,
    s.lastName,
    r.roomNumber,
    r.blockName
FROM Allocations a
JOIN Students s ON a.StudentId = s.id
JOIN Rooms r ON a.RoomId = r.id
WHERE a.status = 'ACTIVE';
```

---

## Entity Relationships

```
┌────────────────┐       ┌──────────────────┐       ┌─────────────────┐
│    Students    │       │   Allocations    │       │      Rooms      │
├────────────────┤       ├──────────────────┤       ├─────────────────┤
│ id (PK)        │──┐    │ id (PK)          │    ┌──│ id (PK)         │
│ studentId      │  │    │ StudentId (FK)   │◄───┘  │ roomNumber      │
│ gender         │  └───►│ RoomId (FK)      │       │ blockName       │
│ firstName      │       │ academicYear     │       │ floorNumber     │
│ lastName       │       │ semester         │       │ roomType        │
│ email          │       │ status           │       │ pricePerNight   │
│ phone          │       │ allocationDate   │       │ capacity        │
│ department     │       │ endDate          │       │ occupied        │
│ year           │       │ specialRequests  │       │ status          │
│ dateOfBirth    │       └──────────────────┘       │ amenities       │
│ bloodGroup     │                                  │ description     │
│ guardianName   │                                  └─────────────────┘
│ guardianPhone  │
│ address        │
└────────────────┘

┌─────────────────┐
│      Users      │
├─────────────────┤
│ id (PK)         │
│ fullName        │
│ email           │
│ password        │
│ role            │
│ isActive        │
└─────────────────┘
```

## Relationships Summary

| Relationship         | Type        | Description                              |
|----------------------|-------------|------------------------------------------|
| Student → Allocation | One-to-Many | A student can have multiple allocations  |
| Room → Allocation    | One-to-Many | A room can have multiple allocations     |

---

## Notes

- All tables include Sequelize-generated `createdAt` and `updatedAt` timestamp columns
- The `occupied` field in Rooms tracks current occupancy count
- Passwords in Users table should be stored as hashed values (bcrypt) in production
- Foreign keys use ON DELETE SET NULL to preserve allocation history
- Indexes are added for commonly queried columns
- Field names use camelCase to match JavaScript/Sequelize conventions
- `pricePerNight` represents the Fee per Semester in the hostel context
- User roles: ADMIN (full access), WARDEN (hostel management), STAFF (limited access), STUDENT (view only)
