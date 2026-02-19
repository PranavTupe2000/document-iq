import axios from 'axios';
// TODO: remove localhost later
const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const api = axios.create({ baseURL: BASE_URL });

// Attach token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('diq-token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 globally
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('diq-token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// ─── Auth ────────────────────────────────────────────────
export const loginApi = (email, password) => {
  const form = new URLSearchParams();
  form.append('username', email);
  form.append('password', password);
  return api.post('/auth/login', form, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
  });
};

export const registerOrgApi = (data) =>
  api.post('/auth/register-organization', data);

export const registerUserApi = (data) =>
  api.post('/auth/register-user', data);

// ─── Organization ─────────────────────────────────────────
export const getMyOrgApi    = ()           => api.get('/organizations/me');
export const updateMyOrgApi = (name)       => api.put(`/organizations/me?name=${encodeURIComponent(name)}`);
export const deleteMyOrgApi = ()           => api.delete('/organizations/me');

// ─── Users ────────────────────────────────────────────────
export const getMyProfileApi  = ()                   => api.get('/users/me');
export const listUsersApi     = ()                   => api.get('/users/');
export const updateUserApi    = (id, params)         => api.put(`/users/${id}`, null, { params });
export const deleteUserApi    = (id)                 => api.delete(`/users/${id}`);

// ─── Groups ───────────────────────────────────────────────
export const listGroupsApi  = ()     => api.get('/groups/');
export const createGroupApi = (name) => api.post('/groups/', { name });
export const deleteGroupApi = (id)   => api.delete(`/groups/${id}`);

// ─── Documents ────────────────────────────────────────────
export const analyzeDocumentApi   = (data)       => api.post('/documents/analyze', data);
export const getDocStatusApi      = (id)         => api.get(`/documents/${id}/status`);
export const getDocResultApi      = (id)         => api.get(`/documents/${id}/result`);
export const getDocumentApi      = (id)      => api.get(`/documents/${id}`);
export const deleteDocumentApi   = (id)      => api.delete(`/documents/${id}`);
export const getDocsByGroupApi   = (groupId) => api.get(`/documents/group/${groupId}`);
export const downloadDocumentApi = (id)      => api.get(`/documents/${id}/download`, { responseType: 'blob' });

// ─── RAG / Query ──────────────────────────────────────────
export const queryGroupApi = (groupId, question) =>
  api.post(`/groups/${groupId}/query`, { group_id: groupId, question });

export default api;
