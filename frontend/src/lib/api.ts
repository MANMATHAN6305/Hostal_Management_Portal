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
    return response.json();
  },

  update: async (id: number, data: any) => {
    const response = await fetch(`${API_BASE_URL}/rooms/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return response.json();
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
    return response.json();
  },

  update: async (id: number, data: any) => {
    const response = await fetch(`${API_BASE_URL}/students/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return response.json();
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
    return response.json();
  },

  update: async (id: number, data: any) => {
    const response = await fetch(`${API_BASE_URL}/allocations/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return response.json();
  },

  delete: async (id: number) => {
    const response = await fetch(`${API_BASE_URL}/allocations/${id}`, {
      method: 'DELETE',
    });
    return response.ok;
  },
};
