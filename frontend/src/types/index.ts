// Room Types (Hostel)
export interface Room {
  id: number;
  roomNumber: string;
  roomType: RoomType;
  pricePerNight: number;
  status: RoomStatus;
  description: string;
  capacity: number;
  occupied: number;
  floorNumber: number;
  blockName: string;
  gender: 'MALE' | 'FEMALE';
  amenities: string;
  hostelId?: number | string | null;
}

export type RoomType = 'SINGLE' | 'DOUBLE' | 'TRIPLE' | 'FOUR_BED' | 'FIVE_BED' | 'EIGHT_BED' | 'DORMITORY';
export type RoomStatus = 'AVAILABLE' | 'OCCUPIED' | 'MAINTENANCE';

// Room Allocation Types
export interface Allocation {
  id: number;
  roomId: number;
  studentId: number;
  allocationDate: string;
  endDate: string;
  status: AllocationStatus;
  academicYear: string;
  semester: string;
  specialRequests?: string;
  roomNumber?: string;
  studentName?: string;
  blockName?: string;
}

export type Booking = Allocation;
export type AllocationStatus = 'ACTIVE' | 'VACATED' | 'PENDING';
export type BookingStatus = AllocationStatus;

// Student Types
export interface Student {
  id: number;
  studentId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  department: string;
  year: number;
  dateOfBirth: string;
  guardianName: string;
  guardianPhone: string;
  bloodGroup: string;
  gender: 'MALE' | 'FEMALE';
}

export type Guest = Student;

// User/Login Types
export interface User {
  id: number;
  fullName: string;
  email: string;
  role: 'ADMIN' | 'WARDEN' | 'STAFF' | 'STUDENT';
  staffRole?: 'ELECTRICIAN' | 'CLEANER' | 'CARETAKER';
  isActive: boolean;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  userId: number | null;
  fullName: string | null;
  email: string | null;
  role: string | null;
}
