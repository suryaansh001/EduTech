/**
 * API client for EduTech backend
 * Handles all HTTP requests to the API
 */

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000')
  .replace(/\/api\/?$/, '');
export const API_BASE_URL = `${API_URL}/api`;

/**
 * Fetch with error handling
 */
async function fetchAPI(endpoint, options = {}) {
  const url = `${API_URL}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || 'An error occurred');
  }

  return data;
}

/**
 * Classes/Batches API
 */
export const classesApi = {
  getClasses: async (token, params = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') query.set(k, v);
    });
    const qs = query.toString();
    return fetchAPI(`/api/classes${qs ? `?${qs}` : ''}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },

  getClass: async (id, token) => {
    return fetchAPI(`/api/classes/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },

  createClass: async (data, token) => {
    return fetchAPI('/api/classes', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(data),
    });
  },

  updateClass: async (id, data, token) => {
    return fetchAPI(`/api/classes/${id}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(data),
    });
  },

  deleteClass: async (id, token) => {
    return fetchAPI(`/api/classes/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
  },

  getEnrollments: async (id, token) => {
    return fetchAPI(`/api/classes/${id}/enrollments`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },

  getAvailableStudents: async (id, token, params = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') query.set(k, v);
    });
    const qs = query.toString();
    return fetchAPI(`/api/classes/${id}/available-students${qs ? `?${qs}` : ''}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },

  bulkEnroll: async (id, studentIds, token) => {
    return fetchAPI(`/api/classes/${id}/bulk-enroll`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ studentIds }),
    });
  },

  removeStudent: async (id, studentId, token) => {
    return fetchAPI(`/api/classes/${id}/students/${studentId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
  },
};

/**
 * Quizzes API
 */
export const quizzesApi = {
  getQuizzes: async (token) => {
    return fetchAPI('/api/quizzes', {
      headers: { Authorization: `Bearer ${token}` },
    });
  },

  getQuiz: async (id, token) => {
    return fetchAPI(`/api/quizzes/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },

  createQuiz: async (data, token) => {
    return fetchAPI('/api/quizzes', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(data),
    });
  },
};

/**
 * Chat API
 */
export const chatApi = {
  sendMessage: async (data, token) => {
    return fetchAPI('/api/chat/send', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(data),
    });
  },

  getMessages: async (roomId, token) => {
    return fetchAPI(`/api/chat/messages/${roomId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },
};

/**
 * Auth API
 */
export const authApi = {
  login: async (email, password) => {
    return fetchAPI('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  createUser: async (data, token) => {
    return fetchAPI('/api/auth/create-user', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(data),
    });
  },

  getProfile: async (token) => {
    return fetchAPI('/api/auth/profile', {
      headers: { Authorization: `Bearer ${token}` },
    });
  },
};

/**
 * Users API
 */
export const usersApi = {
  getUsers: async (token, params = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') query.set(k, v);
    });
    const qs = query.toString();
    return fetchAPI(`/api/users${qs ? `?${qs}` : ''}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },

  getUser: async (id, token) => {
    return fetchAPI(`/api/users/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },

  updateUser: async (id, data, token) => {
    return fetchAPI(`/api/users/${id}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(data),
    });
  },

  deleteUser: async (id, token) => {
    return fetchAPI(`/api/users/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
  },
};

/**
 * Analytics API
 */
export const analyticsApi = {
  getDashboard: async (token) => {
    return fetchAPI('/api/analytics/dashboard', {
      headers: { Authorization: `Bearer ${token}` },
    });
  },

  getUserStats: async (userId, token) => {
    return fetchAPI(`/api/analytics/users/${userId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },

  getClassStats: async (classId, token) => {
    return fetchAPI(`/api/analytics/classes/${classId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },
};

/**
 * Announcements API
 */
export const announcementsApi = {
  getAnnouncements: async (token) => {
    return fetchAPI('/api/announcements', {
      headers: { Authorization: `Bearer ${token}` },
    });
  },

  getAnnouncement: async (id, token) => {
    return fetchAPI(`/api/announcements/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },

  createAnnouncement: async (data, token) => {
    return fetchAPI('/api/announcements', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(data),
    });
  },

  updateAnnouncement: async (id, data, token) => {
    return fetchAPI(`/api/announcements/${id}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(data),
    });
  },

  deleteAnnouncement: async (id, token) => {
    return fetchAPI(`/api/announcements/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
  },
};

/**
 * Notes API
 */
export const notesApi = {
  getNotes: async (token) => {
    return fetchAPI('/api/notes', {
      headers: { Authorization: `Bearer ${token}` },
    });
  },

  getNote: async (id, token) => {
    return fetchAPI(`/api/notes/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },

  createNote: async (data, token) => {
    return fetchAPI('/api/notes', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(data),
    });
  },

  updateNote: async (id, data, token) => {
    return fetchAPI(`/api/notes/${id}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(data),
    });
  },

  deleteNote: async (id, token) => {
    return fetchAPI(`/api/notes/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
  },
};

/**
 * Files API
 */
export const filesApi = {
  uploadFile: async (formData, token) => {
    const response = await fetch(`${API_URL}/api/files/upload`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    if (!response.ok) throw new Error('File upload failed');
    return response.json();
  },

  getFiles: async (token) => {
    return fetchAPI('/api/files', {
      headers: { Authorization: `Bearer ${token}` },
    });
  },

  deleteFile: async (id, token) => {
    return fetchAPI(`/api/files/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
  },
};

/**
 * Custom Error class
 */
export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

/**
 * Health check
 */
export async function healthCheck() {
  try {
    const response = await fetch(`${API_URL}/api/health`);
    return response.ok;
  } catch {
    return false;
  }
}

export default {
  fetchAPI,
  classesApi,
  quizzesApi,
  chatApi,
  usersApi,
  analyticsApi,
  announcementsApi,
  notesApi,
  filesApi,
  ApiError,
  healthCheck,
};
