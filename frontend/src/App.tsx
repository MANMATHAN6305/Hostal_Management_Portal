import { Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Register from './pages/Register'
import DashboardLayout from './components/layout/DashboardLayout'
import StudentDashboardLayout from './components/layout/StudentDashboardLayout'

// Admin Pages
import Dashboard from './pages/admin/Dashboard'
import Rooms from './pages/admin/Rooms'
import AddRoom from './pages/admin/AddRoom'
import EditRoom from './pages/admin/EditRoom'
import Students from './pages/admin/Students'
import AddStudent from './pages/admin/AddStudent'
import EditStudent from './pages/admin/EditStudent'
import Allocations from './pages/admin/Allocations'
import AddAllocation from './pages/admin/AddAllocation'
import EditAllocation from './pages/admin/EditAllocation'
import AdminComplaints from './pages/admin/Complaints'
import AdminMenu from './pages/admin/Menu'

// Student Pages
import StudentDashboard from './pages/student/StudentDashboard'
import MyRoom from './pages/student/MyRoom'
import StudentComplaints from './pages/student/Complaints'
import StudentMenu from './pages/student/Menu'

function App() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      
      {/* Admin/Staff Protected Routes with Dashboard Layout */}
      <Route path="/" element={<DashboardLayout />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="rooms" element={<Rooms />} />
        <Route path="rooms/add" element={<AddRoom />} />
        <Route path="rooms/edit/:id" element={<EditRoom />} />
        <Route path="students" element={<Students />} />
        <Route path="students/add" element={<AddStudent />} />
        <Route path="students/edit/:id" element={<EditStudent />} />
        <Route path="allocations" element={<Allocations />} />
        <Route path="allocations/add" element={<AddAllocation />} />
        <Route path="allocations/edit/:id" element={<EditAllocation />} />
        <Route path="complaints" element={<AdminComplaints />} />
        <Route path="menu" element={<AdminMenu />} />
      </Route>

      {/* Student Protected Routes with Student Dashboard Layout */}
      <Route path="/student" element={<StudentDashboardLayout />}>
        <Route index element={<Navigate to="/student/dashboard" replace />} />
        <Route path="dashboard" element={<StudentDashboard />} />
        <Route path="room" element={<MyRoom />} />
        <Route path="complaints" element={<StudentComplaints />} />
        <Route path="menu" element={<StudentMenu />} />
      </Route>

      {/* Catch all redirect */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}

export default App
