import axios from 'axios';

/** En dev, requêtes relatives → proxy Vite (même origine, cookies Sanctum OK). */
const API_URL = import.meta.env.DEV ? '' : (import.meta.env.VITE_API_URL || '');

const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  withCredentials: true,
  withXSRFToken: true,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  },
});

api.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(error)
);

export async function initCsrf(): Promise<void> {
  await api.get('/sanctum/csrf-cookie');
}

export default api;
