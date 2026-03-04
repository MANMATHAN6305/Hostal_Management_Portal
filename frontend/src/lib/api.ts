import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

export const api = axios.create({
  baseURL: API_BASE_URL
});

const AUTH_TOKEN_KEYS = ['token', 'authToken', 'accessToken'];
const SESSION_KEYS = ['isLoggedIn', 'token', 'authToken', 'accessToken', 'userId', 'userEmail', 'userName', 'userRole', 'studentId'];

const normalizeToken = (rawToken: string | null): string | null => {
  if (!rawToken) return null;

  let token = rawToken.trim();
  if (!token) return null;

  if (token.toLowerCase() === 'null' || token.toLowerCase() === 'undefined') {
    return null;
  }

  token = token.replace(/^"(.+)"$/, '$1').trim();
  token = token.replace(/^Bearer\s+/i, '').trim();

  if (!token || token.toLowerCase() === 'null' || token.toLowerCase() === 'undefined') {
    return null;
  }

  return token;
};

const getStoredToken = (): string | null => {
  for (const key of AUTH_TOKEN_KEYS) {
    const token = normalizeToken(localStorage.getItem(key));
    if (token) return token;
  }
  return null;
};

const clearSession = () => {
  SESSION_KEYS.forEach((key) => localStorage.removeItem(key));
};

api.interceptors.request.use((config: any) => {
  const token = getStoredToken();
  if (!config.headers) {
    config.headers = {};
  }

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  } else if (config.headers.Authorization) {
    delete config.headers.Authorization;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error: any) => {
    const status = error?.response?.status;
    const requestUrl = String(error?.config?.url || '');
    const isAuthRoute = requestUrl.startsWith('/auth/');

    if (status === 401 && !isAuthRoute) {
      clearSession();
      if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

const unwrap = async (promise: Promise<any>): Promise<any> => (await promise).data;

export const authApi = {
  login: (email: string, password: string) => unwrap(api.post('/auth/login', { email, password })),
  register: (data: { fullName: string; email: string; password: string; role?: string; staffRole?: string }) =>
    unwrap(api.post('/auth/register', data))
};

export const roomsApi = {
  getAll: () => unwrap(api.get('/rooms')),
  getById: (id: number) => unwrap(api.get(`/rooms/${id}`)),
  create: (data: unknown) => unwrap(api.post('/rooms', data)),
  update: (id: number, data: unknown) => unwrap(api.put(`/rooms/${id}`, data)),
  delete: async (id: number) => {
    await api.delete(`/rooms/${id}`);
    return true;
  },
  getAvailable: () => unwrap(api.get('/rooms/available'))
};

export const studentsApi = {
  getAll: () => unwrap(api.get('/students')),
  getById: (id: number) => unwrap(api.get(`/students/${id}`)),
  create: (data: unknown) => unwrap(api.post('/students', data)),
  update: (id: number, data: unknown) => unwrap(api.put(`/students/${id}`, data)),
  delete: async (id: number) => {
    await api.delete(`/students/${id}`);
    return true;
  }
};

export const hostelsApi = {
  getAll: () => unwrap(api.get('/hostels'))
};

export const allocationsApi = {
  getAll: () => unwrap(api.get('/allocations')),
  getById: (id: number) => unwrap(api.get(`/allocations/${id}`)),
  create: (data: unknown) => unwrap(api.post('/allocations', data)),
  autoAllocate: (data: {
    academicYear: string;
    semester: string;
    allocationDate?: string;
    endDate?: string;
    specialRequests?: string;
    strategy?: 'AUTO' | 'RANDOM';
    limit?: number;
    studentIds?: number[];
  }) => unwrap(api.post('/allocations/auto-allocate', data)),
  update: (id: number, data: unknown) => unwrap(api.put(`/allocations/${id}`, data)),
  delete: async (id: number) => {
    await api.delete(`/allocations/${id}`);
    return true;
  }
};

export const studentApi = {
  getProfile: () => unwrap(api.get('/student/me')),
  getRoom: () => unwrap(api.get('/student/room')),
  getMenu: () => unwrap(api.get('/student/menu')),
  getComplaints: () => unwrap(api.get('/complaints')),
  submitComplaint: (data: { message: string; category: string }) => unwrap(api.post('/complaints', data)),
  getDashboard: () => unwrap(api.get('/student/dashboard')),
  submitApplication: (data: {
    fullName: string;
    registerNumber: string;
    department: string;
    yearOfStudy: '1' | '2' | '3' | '4';
    gender: 'MALE' | 'FEMALE' | 'OTHER';
    dateOfBirth: string;
    studentEmail: string;
    mobileNumber: string;
    guardianName: string;
    relationship: string;
    guardianContactNumber: string;
    guardianAddress: string;
  }) => unwrap(api.post('/applications', data)),
  updateApplication: (id: number, data: {
    fullName: string;
    registerNumber: string;
    department: string;
    yearOfStudy: '1' | '2' | '3' | '4';
    gender: 'MALE' | 'FEMALE' | 'OTHER';
    dateOfBirth: string;
    studentEmail: string;
    mobileNumber: string;
    guardianName: string;
    relationship: string;
    guardianContactNumber: string;
    guardianAddress: string;
  }) => unwrap(api.put(`/applications/${id}`, data)),
  getApplications: () => unwrap(api.get('/applications')),
  submitRequest: (data: {
    type: string;
    title: string;
    description: string;
    fromDate?: string;
    toDate?: string;
    targetRoomNumber?: string;
    currentRoomNumber?: string;
    studentName?: string;
    rollNumber?: string;
    reasonForRoomChange?: string;
  }) =>
    unwrap(api.post('/requests', data)),
  getRequests: () => unwrap(api.get('/requests')),
  getStaffDirectory: () => unwrap(api.get('/complaints/directory/staff')),
  getPayments: () => unwrap(api.get('/payments'))
};

export const adminApi = {
  getApplications: () => unwrap(api.get('/applications')),
  getComplaints: () => unwrap(api.get('/complaints')),
  updateComplaint: (id: number, data: { status?: string; adminReply?: string }) => unwrap(api.put(`/complaints/${id}/status`, data)),
  assignComplaint: (id: number, data: { assignedStaffRole: string }) => unwrap(api.put(`/complaints/${id}/assign`, data)),
  deleteComplaint: (id: number) => unwrap(api.delete(`/admin/complaints/${id}`)),
  getStats: () => unwrap(api.get('/dashboard/summary')),
  getMenu: (weekStartDate?: string) =>
    unwrap(api.get('/admin/menu', { params: weekStartDate ? { weekStartDate } : undefined })),
  updateMenu: (data: { weekStartDate: string; menuItems: any[] }) => unwrap(api.post('/admin/menu', data)),
  getStaff: () => unwrap(api.get('/staff')),
  createStaff: (data: unknown) => unwrap(api.post('/staff', data)),
  updateStaff: (id: number, data: unknown) => unwrap(api.put(`/staff/${id}`, data)),
  getPayments: () => unwrap(api.get('/payments')),
  addPayment: (data: unknown) => unwrap(api.post('/payments', data)),
  getAttendance: () => unwrap(api.get('/attendance')),
  addAttendance: (data: unknown) => unwrap(api.post('/attendance', data)),
  getHostels: () => unwrap(api.get('/hostels')),
  addHostel: (data: unknown) => unwrap(api.post('/hostels', data)),
  updateHostel: (id: number, data: unknown) => unwrap(api.put(`/hostels/${id}`, data)),
  deleteHostel: (id: number) => unwrap(api.delete(`/hostels/${id}`)),
  // Warden Management
  getWardens: () => unwrap(api.get('/admin/wardens')),
  getWardenById: (id: number) => unwrap(api.get(`/admin/wardens/${id}`)),
  createWarden: (data: unknown) => unwrap(api.post('/admin/wardens', data)),
  updateWarden: (id: number, data: unknown) => unwrap(api.put(`/admin/wardens/${id}`, data)),
  deleteWarden: (id: number) => unwrap(api.delete(`/admin/wardens/${id}`)),
  // Messages
  getAllMessages: () => unwrap(api.get('/messages/admin/all')),
  sendMessageToWarden: (data: unknown) => unwrap(api.post('/messages/admin/send', data)),
  updateMessageStatus: (id: number, data: { status?: string; adminReply?: string }) => 
    unwrap(api.put(`/messages/admin/${id}/status`, data)),
  deleteMessage: (id: number) => unwrap(api.delete(`/messages/admin/${id}`))
};

export const wardenApi = {
  getDashboard: () => unwrap(api.get('/dashboard/summary')),
  getApplications: () => unwrap(api.get('/applications')),
  reviewApplication: (id: number, data: { status: 'APPROVED' | 'REJECTED'; remarks?: string }) => unwrap(api.put(`/applications/${id}/review`, data)),
  getRequests: () => unwrap(api.get('/requests')),
  reviewRequest: (id: number, data: { status: 'APPROVED' | 'REJECTED'; wardenRemarks?: string }) => unwrap(api.put(`/requests/${id}/review`, data)),
  getComplaints: () => unwrap(api.get('/complaints')),
  assignComplaint: (id: number, assignedStaffRole: string) => unwrap(api.put(`/complaints/${id}/assign`, { assignedStaffRole })),
  updateComplaint: (id: number, data: { status: 'PENDING' | 'IN_PROGRESS' | 'RESOLVED'; adminReply?: string }) =>
    unwrap(api.put(`/complaints/${id}/status`, data)),
  getAttendance: () => unwrap(api.get('/attendance')),
  // Messages
  getSentMessages: () => unwrap(api.get('/messages/warden/sent')),
  getReceivedMessages: () => unwrap(api.get('/messages/warden/received')),
  sendMessage: (data: { title: string; description: string; priority?: string }) => 
    unwrap(api.post('/messages/warden/send', data)),
  markMessageSeen: (id: number) => unwrap(api.put(`/messages/${id}/mark-seen`))
};

export const staffApi = {
  getDashboard: () => unwrap(api.get('/dashboard/summary')),
  getComplaints: () => unwrap(api.get('/complaints')),
  updateComplaintStatus: (id: number, status: 'PENDING' | 'IN_PROGRESS' | 'RESOLVED') => unwrap(api.put(`/complaints/${id}/status`, { status }))
};
