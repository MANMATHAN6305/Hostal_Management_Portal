# Database Schema (MySQL)

This project uses MySQL (schema: `hostel_portal`) with Sequelize.

## 1) Current Workbench Tables (Reference)

Your screenshot shows these existing tables:

- `users`
- `students`
- `rooms`
- `allocations`
- `complaints`
- `menus`

## 2) Core Table Purpose

- `users`: Login, JWT auth, and role info (`ADMIN`, `WARDEN`, `STAFF`, `STUDENT`)
- `students`: Student profile data
- `rooms`: Room inventory and occupancy
- `allocations`: Student-room assignment history
- `complaints`: Complaint lifecycle and assignment
- `menus`: Weekly hostel menu

## 3) MySQL DDL (Core Tables)

```sql
CREATE DATABASE IF NOT EXISTS hostel_portal;
USE hostel_portal;

CREATE TABLE IF NOT EXISTS Users (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  fullName VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password VARCHAR(255) NULL,
  role ENUM('ADMIN','WARDEN','STAFF','STUDENT','Select Role') DEFAULT 'STUDENT',
  staffRole ENUM('ELECTRICIAN','CLEANER','CARETAKER') NULL,
  phone VARCHAR(20) NULL,
  googleId VARCHAR(100) NULL,
  isActive TINYINT(1) DEFAULT 1,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS Students (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  studentId VARCHAR(50) NOT NULL UNIQUE,
  firstName VARCHAR(100) NOT NULL,
  lastName VARCHAR(100) NULL,
  email VARCHAR(150) UNIQUE,
  phone VARCHAR(20) NULL,
  address TEXT NULL,
  department VARCHAR(100) NULL,
  year INT NULL,
  dateOfBirth DATE NULL,
  guardianName VARCHAR(100) NULL,
  guardianPhone VARCHAR(20) NULL,
  bloodGroup VARCHAR(10) NULL,
  gender ENUM('MALE','FEMALE','Select Gender') DEFAULT 'Select Gender',
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS Rooms (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  roomNumber VARCHAR(20) NOT NULL UNIQUE,
  roomType ENUM('SINGLE','DOUBLE','TRIPLE','FOUR_BED','FIVE_BED','EIGHT_BED','DORMITORY','Select Room Type') DEFAULT 'Select Room Type',
  gender ENUM('MALE','FEMALE') DEFAULT 'MALE',
  capacity INT DEFAULT 1,
  occupied INT DEFAULT 0,
  floorNumber INT DEFAULT 1,
  blockName VARCHAR(50) DEFAULT 'A',
  status ENUM('AVAILABLE','OCCUPIED','MAINTENANCE','Select Room Status') DEFAULT 'Select Room Status',
  pricePerNight DECIMAL(10,2) DEFAULT 0,
  description TEXT NULL,
  amenities VARCHAR(255) NULL,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS Allocations (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  StudentId BIGINT NULL,
  RoomId BIGINT NULL,
  academicYear VARCHAR(20) NULL,
  semester VARCHAR(20) NULL,
  status ENUM('ACTIVE','VACATED','PENDING','Select Room Status') DEFAULT 'Select Room Status',
  allocationDate DATE NULL,
  endDate DATE NULL,
  specialRequests TEXT NULL,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_alloc_student FOREIGN KEY (StudentId) REFERENCES Students(id) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_alloc_room FOREIGN KEY (RoomId) REFERENCES Rooms(id) ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS Complaints (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  StudentId BIGINT NULL,
  message TEXT NOT NULL,
  category ENUM('ELECTRICAL','CLEANING','MAINTENANCE','OTHER') DEFAULT 'OTHER',
  status ENUM('PENDING','IN_PROGRESS','RESOLVED') DEFAULT 'PENDING',
  assignedStaffRole ENUM('ELECTRICIAN','CLEANER','CARETAKER') NULL,
  assignedById BIGINT NULL,
  adminReply TEXT NULL,
  resolvedAt DATETIME NULL,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_complaint_student FOREIGN KEY (StudentId) REFERENCES Students(id) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_complaint_assigner FOREIGN KEY (assignedById) REFERENCES Users(id) ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS Menus (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  weekStartDate DATE NOT NULL,
  day ENUM('MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY','SATURDAY','SUNDAY') NOT NULL,
  breakfast VARCHAR(255) NULL,
  lunch VARCHAR(255) NULL,
  dinner VARCHAR(255) NULL,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

## 4) Optional Extension Tables (For Full Smart Portal Features)

If you want all requested modules enabled at DB level, add:

- `Hostels`
- `Applications`
- `Requests`
- `Attendance`
- `Payments`
- `Visitors`

These match the new backend models already present in `src/models`.

To enable them immediately in your MySQL DB:

```bash
npm run migrate:extensions
```

## 5) Notes

- Use `npm run migrate:users` to patch `Users` table columns (`staffRole`, `phone`, `googleId`) if missing.
- Avoid repeated `sequelize.sync({ alter: true })` on old DBs with many duplicate indexes.
- Prefer targeted migration scripts for production-like databases.
