import axios from 'axios';

const api = axios.create({
  baseURL: 'https://getit-e2kz.onrender.com',
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000, // 10 seconds
});

export default api;