// frontend/src/api.js
import axios from 'axios';
import { auth } from './firebase';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL,
  withCredentials: true
});

// Before every request, grab the current Firebase user token and set it
api.interceptors.request.use(
  async config => {
    const user = auth.currentUser;
    if (user) {
      const token = await user.getIdToken();
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => Promise.reject(error)
);

export default api;



