# Smart Hostel Management Portal - Updated Project Blueprint

## 1) Folder Structure

```text
backend/
  src/
    config/
    middleware/
      auth.js
    models/
      User.js
      Student.js
      Hostel.js
      Room.js
      Allocation.js
      Application.js
      Complaint.js
      Request.js
      Attendance.js
      Payment.js
      Visitor.js
      Menu.js
      index.js
    routes/
      auth.routes.js
      student.routes.js
      room.routes.js
      allocation.routes.js
      studentPortal.routes.js
      admin.routes.js
      complaint.routes.js
      request.routes.js
      attendance.routes.js
      payment.routes.js
      staff.routes.js
      application.routes.js
      hostel.routes.js
      dashboard.routes.js
    seeds/
      seedRooms.js
    index.js

frontend/
  src/
    components/
      auth/ProtectedRoute.tsx
      layout/
      ui/
    lib/
      api.ts
    pages/
      admin/
      student/
      warden/
      staff/
    App.tsx
```

## 2) MySQL Schema Design (Workbench Reference)

This project uses **MySQL (hostel_portal)** with Sequelize.

### Current tables visible in your Workbench reference

- `users`
- `students`
- `rooms`
- `allocations`
- `complaints`
- `menus`

### Core MySQL table mapping

- `users`: authentication and role data (`ADMIN`, `WARDEN`, `STAFF`, `STUDENT`)
- `students`: student profile and guardian data
- `rooms`: room metadata, capacity, occupancy, status
- `allocations`: links students to rooms with semester/year status
- `complaints`: student complaints, category, status, routing fields
- `menus`: weekly/day meal data

### Recommended MySQL extension tables for full smart-hostel scope

- `hostels`
- `applications`
- `requests`
- `attendance`
- `payments`
- `visitors`

## 3) Backend API Routes

- Auth: `/api/auth/*` (JWT + Google OAuth)
- Room management: `/api/rooms/*`
- Allocation: `/api/allocations/*`
- Complaints: `/api/complaints/*`
- Requests: `/api/requests/*`
- Attendance: `/api/attendance/*`
- Staff management: `/api/staff/*`
- Payments: `/api/payments/*`
- Applications: `/api/applications/*`
- Hostels: `/api/hostels/*`
- Dashboard summary (role-based): `/api/dashboard/summary`

## 4) React Pages and Components

- Protected routing: `components/auth/ProtectedRoute.tsx`
- Role-aware navigation: `components/layout/Sidebar.tsx`, `StudentSidebar.tsx`
- Student pages: dashboard, apply hostel, my room, complaints, requests, staff directory, payments, menu
- Warden pages: dashboard, applications, requests, complaints, attendance
- Staff pages: dashboard, assigned complaints
- Admin pages: users/students, staff, rooms, allocations, complaints, payments, attendance, hostels

## 5) Role-Based Access Logic

- JWT `verifyToken` + `authorizeRoles(...roles)` middleware.
- Roles enforced at route level:
  - Admin: full management routes
  - Warden: applications/requests review, complaint assignment, attendance view
  - Staff: assigned complaints + status updates
  - Student: apply, complaints, requests, my room, payments, staff directory

## 6) Complaint Routing Logic

Implemented in `backend/src/routes/complaint.routes.js`:

- `ELECTRICAL -> ELECTRICIAN`
- `CLEANING -> CLEANER`
- `MAINTENANCE -> CARETAKER`

Students and wardens track status via complaint listing APIs; staff only sees complaints mapped to their `staffRole`.

## 7) Sample Seed Data

`backend/src/seeds/seedRooms.js` now seeds:

- Users: admin, warden, electrician, cleaner, caretaker, students
- Hostels and rooms
- Applications and allocations
- Complaints with routed staff roles
- Requests (leave + room change)
- Attendance (biometric fields)
- Payments

Default password for seeded users: `password123`
