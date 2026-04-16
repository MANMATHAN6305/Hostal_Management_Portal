import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import Login from './pages/Login';
import Register from './pages/Register';
import ProtectedRoute from './components/auth/ProtectedRoute';
import DashboardLayout from './components/layout/DashboardLayout';
import StudentDashboardLayout from './components/layout/StudentDashboardLayout';
import PageTransition from './components/ui/PageTransition';

import Dashboard from './pages/admin/Dashboard';
import Rooms from './pages/admin/Rooms';
import AddRoom from './pages/admin/AddRoom';
import EditRoom from './pages/admin/EditRoom';
import Students from './pages/admin/Students';
import AddStudent from './pages/admin/AddStudent';
import EditStudent from './pages/admin/EditStudent';
import Allocations from './pages/admin/Allocations';
import AddAllocation from './pages/admin/AddAllocation';
import EditAllocation from './pages/admin/EditAllocation';
import AdminMenu from './pages/admin/Menu';
import AdminStaff from './pages/admin/Staff';
import AdminAttendanceReports from './pages/admin/AttendanceReports';
import AdminHostels from './pages/admin/Hostels';
import Wardens from './pages/admin/Wardens';
import AddWarden from './pages/admin/AddWarden';
import EditWarden from './pages/admin/EditWarden';
import WardenDetails from './pages/admin/WardenDetails';
import AdminMessages from './pages/admin/AdminMessages';

import StudentDashboard from './pages/student/StudentDashboard';
import StudentAttendance from './pages/student/Attendance';
import MyRoom from './pages/student/MyRoom';
import StudentComplaints from './pages/student/Complaints';
import StudentMenu from './pages/student/Menu';
import ApplyHostel from './pages/student/ApplyHostel';
import StudentRequests from './pages/student/Requests';

import WardenDashboard from './pages/warden/Dashboard';
import WardenStudentsList from './pages/warden/StudentsList';
import WardenRequests from './pages/warden/Requests';
import WardenAttendance from './pages/warden/Attendance';
import WardenMessages from './pages/warden/Messages';
import MenuFeedback from './pages/warden/MenuFeedback';

import StaffDashboard from './pages/staff/Dashboard';
import StaffComplaints from './pages/staff/Complaints';

function App() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait" initial={false}>
      <Routes location={location} key={location.pathname}>
        <Route path="/login" element={<PageTransition><Login /></PageTransition>} />
        <Route path="/sign-in" element={<PageTransition><Login /></PageTransition>} />
        <Route path="/signin" element={<PageTransition><Login /></PageTransition>} />
        <Route path="/signup" element={<Navigate to="/register" replace />} />
        <Route path="/sign-up" element={<Navigate to="/register" replace />} />
        <Route path="/register" element={<PageTransition><Register /></PageTransition>} />

        <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
          <Route path="/" element={<DashboardLayout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="students" element={<Students />} />
            <Route path="students/add" element={<AddStudent />} />
            <Route path="students/edit/:id" element={<EditStudent />} />
            <Route path="wardens" element={<Wardens />} />
            <Route path="wardens/add" element={<AddWarden />} />
            <Route path="wardens/edit/:id" element={<EditWarden />} />
            <Route path="wardens/:id" element={<WardenDetails />} />
            <Route path="rooms" element={<Rooms />} />
            <Route path="rooms/add" element={<AddRoom />} />
            <Route path="rooms/edit/:id" element={<EditRoom />} />
            <Route path="allocations" element={<Allocations />} />
            <Route path="allocations/add" element={<AddAllocation />} />
            <Route path="allocations/edit/:id" element={<EditAllocation />} />
            <Route path="menu" element={<AdminMenu />} />
            <Route path="staff" element={<AdminStaff />} />
            <Route path="attendance" element={<AdminAttendanceReports />} />
            <Route path="hostels" element={<AdminHostels />} />
            <Route path="admin-messages" element={<AdminMessages />} />
          </Route>
        </Route>

        <Route element={<ProtectedRoute allowedRoles={['STUDENT']} />}>
          <Route path="/student" element={<StudentDashboardLayout />}>
            <Route index element={<Navigate to="/student/dashboard" replace />} />
            <Route path="dashboard" element={<StudentDashboard />} />
            <Route path="attendance" element={<StudentAttendance />} />
            <Route path="apply" element={<ApplyHostel />} />
            <Route path="room" element={<MyRoom />} />
            <Route path="complaints" element={<StudentComplaints />} />
            <Route path="requests" element={<StudentRequests />} />
            <Route path="menu" element={<StudentMenu />} />
          </Route>
        </Route>

        <Route element={<ProtectedRoute allowedRoles={['WARDEN']} />}>
          <Route path="/warden" element={<DashboardLayout />}>
            <Route index element={<Navigate to="/warden/dashboard" replace />} />
            <Route path="messages" element={<WardenMessages />} />
            <Route path="dashboard" element={<WardenDashboard />} />
            <Route path="students" element={<WardenStudentsList />} />
            <Route path="requests" element={<WardenRequests />} />
            <Route path="attendance" element={<WardenAttendance />} />
            <Route path="menu" element={<MenuFeedback />} />
          </Route>
        </Route>

        <Route element={<ProtectedRoute allowedRoles={['STAFF']} />}>
          <Route path="/staff" element={<DashboardLayout />}>
            <Route index element={<Navigate to="/staff/dashboard" replace />} />
            <Route path="dashboard" element={<StaffDashboard />} />
            <Route path="complaints" element={<StaffComplaints />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </AnimatePresence>
  );
}

export default App;
