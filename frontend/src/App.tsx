import { Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Rooms from './pages/Rooms'
import AddRoom from './pages/AddRoom'
import EditRoom from './pages/EditRoom'
import Students from './pages/Students'
import AddStudent from './pages/AddStudent'
import EditStudent from './pages/EditStudent'
import Allocations from './pages/Allocations'
import AddAllocation from './pages/AddAllocation'
import EditAllocation from './pages/EditAllocation'
import DashboardLayout from './components/layout/DashboardLayout'

function App() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      
      {/* Protected Routes with Dashboard Layout */}
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
      </Route>

      {/* Catch all redirect */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}

export default App
