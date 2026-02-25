const API_BASE_URL = 'http://localhost:5000/api';

// Auth API
export const authApi = {
  login: async (email: string, password: string) => {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    return response.json();
  },

  register: async (data: { fullName: string; email: string; password: string; role?: string }) => {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return response.json();
  },

  // Handle Google OAuth callback
  handleGoogleCallback: () => {
    // Parse URL params
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const userId = params.get('userId');
    const email = params.get('email');
    const fullName = params.get('fullName');
    const role = params.get('role');
    const studentId = params.get('studentId');

    if (token && userId) {
      localStorage.setItem('isLoggedIn', 'true');
      localStorage.setItem('token', token);
      localStorage.setItem('userId', userId);
      localStorage.setItem('userEmail', email || '');
      localStorage.setItem('userName', fullName || '');
      localStorage.setItem('userRole', role || '');
      if (studentId) {
        localStorage.setItem('studentId', studentId);
      }
      
      // Clear URL params
      window.history.replaceState({}, '', window.location.pathname);
      
      return { success: true, role };
    }
    
    return { success: false };
  }
};

// Rooms API
export const roomsApi = {
  getAll: async () => {
    const response = await fetch(`${API_BASE_URL}/rooms`);
    return response.json();
  },

  getById: async (id: number) => {
    const response = await fetch(`${API_BASE_URL}/rooms/${id}`);
    return response.json();
  },

  create: async (data: any) => {
    const response = await fetch(`${API_BASE_URL}/rooms`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || 'Failed to create room');
    }
    return result;
  },

  update: async (id: number, data: any) => {
    const response = await fetch(`${API_BASE_URL}/rooms/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || 'Failed to update room');
    }
    return result;
  },

  delete: async (id: number) => {
    const response = await fetch(`${API_BASE_URL}/rooms/${id}`, {
      method: 'DELETE',
    });
    return response.ok;
  },

  getAvailable: async () => {
    const response = await fetch(`${API_BASE_URL}/rooms/available`);
    return response.json();
  },
};

// Students API
export const studentsApi = {
  getAll: async () => {
    const response = await fetch(`${API_BASE_URL}/students`);
    return response.json();
  },

  getById: async (id: number) => {
    const response = await fetch(`${API_BASE_URL}/students/${id}`);
    return response.json();
  },

  create: async (data: any) => {
    const response = await fetch(`${API_BASE_URL}/students`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || 'Failed to create student');
    }
    return result;
  },

  update: async (id: number, data: any) => {
    const response = await fetch(`${API_BASE_URL}/students/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || 'Failed to update student');
    }
    return result;
  },

  delete: async (id: number) => {
    const response = await fetch(`${API_BASE_URL}/students/${id}`, {
      method: 'DELETE',
    });
    return response.ok;
  },
};

// Allocations API
export const allocationsApi = {
  getAll: async () => {
    const response = await fetch(`${API_BASE_URL}/allocations`);
    return response.json();
  },

  getById: async (id: number) => {
    const response = await fetch(`${API_BASE_URL}/allocations/${id}`);
    return response.json();
  },

  create: async (data: any) => {
    const response = await fetch(`${API_BASE_URL}/allocations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || 'Failed to create allocation');
    }
    return result;
  },

  update: async (id: number, data: any) => {
    const response = await fetch(`${API_BASE_URL}/allocations/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || 'Failed to update allocation');
    }
    return result;
  },

  delete: async (id: number) => {
    const response = await fetch(`${API_BASE_URL}/allocations/${id}`, {
      method: 'DELETE',
    });
    return response.ok;
  },
};

// Helper function to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : '',
  };
};

// Student Portal API
export const studentApi = {
  getProfile: async () => {
    const response = await fetch(`${API_BASE_URL}/student/me`, {
      headers: getAuthHeaders(),
    });
    return response.json();
  },

  getRoom: async () => {
    const response = await fetch(`${API_BASE_URL}/student/room`, {
      headers: getAuthHeaders(),
    });
    return response.json();
  },

  getMenu: async () => {
    const response = await fetch(`${API_BASE_URL}/student/menu`, {
      headers: getAuthHeaders(),
    });
    return response.json();
  },

  getComplaints: async () => {
    const response = await fetch(`${API_BASE_URL}/student/complaints`, {
      headers: getAuthHeaders(),
    });
    return response.json();
  },

  submitComplaint: async (data: { message: string; category: string }) => {
    const response = await fetch(`${API_BASE_URL}/student/complaint`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return response.json();
  },

  getDashboard: async () => {
    const response = await fetch(`${API_BASE_URL}/student/dashboard`, {
      headers: getAuthHeaders(),
    });
    return response.json();
  },
};

// Admin API for Complaints and Menu
export const adminApi = {
  // Complaints
  getComplaints: async () => {
    const response = await fetch(`${API_BASE_URL}/admin/complaints`, {
      headers: getAuthHeaders(),
    });
    return response.json();
  },

  getComplaint: async (id: number) => {
    const response = await fetch(`${API_BASE_URL}/admin/complaints/${id}`, {
      headers: getAuthHeaders(),
    });
    return response.json();
  },

  updateComplaint: async (id: number, data: { status?: string; adminReply?: string }) => {
    const response = await fetch(`${API_BASE_URL}/admin/complaints/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return response.json();
  },

  deleteComplaint: async (id: number) => {
    const response = await fetch(`${API_BASE_URL}/admin/complaints/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return response.json();
  },

  // Menu
  getMenu: async () => {
    const response = await fetch(`${API_BASE_URL}/admin/menu`, {
      headers: getAuthHeaders(),
    });
    return response.json();
  },

  updateMenu: async (data: { weekStartDate: string; menuItems: any[] }) => {
    const response = await fetch(`${API_BASE_URL}/admin/menu`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return response.json();
  },

  // Stats
  getStats: async () => {
    const response = await fetch(`${API_BASE_URL}/admin/stats`, {
      headers: getAuthHeaders(),
    });
    return response.json();
  },
};
