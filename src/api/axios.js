import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

// Production / Render Backend Link
//const BASE_URL = 'https://salary-calculation-ic6k.onrender.com/api';
// const BASE_URL = 'http://10.59.115.32:5000/api'; // mobile ip
const BASE_URL = 'http://192.168.1.42:5000/api'; // pc ip
//nst BASE_URL = 'http://192.168.1.37:5000/api'; // Local IP (Physical device)
// const BASE_URL = 'http://10.0.2.2:5000/api'; // Android emulator

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor — attach JWT token
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await SecureStore.getItemAsync('authToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.warn('Failed to get token:', error);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor — clean error messages
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    let message = 'Something went wrong. Please try again.';

    if (error.response) {
      // Backend responded, but with an error status code
      if (error.response.status === 401) {
        message = 'Your session has expired or is invalid. Please log in again.';
      } else if (error.response.status === 403) {
        message = 'You do not have permission to perform this action.';
      } else if (error.response.status >= 500) {
        message = 'Our servers are currently experiencing issues. Please try again later.';
      } else if (error.response.data && error.response.data.message) {
        // Only use the backend message directly if it is meant for the user. 
        // Here we format it or use a fallback if it looks like a technical DB error.
        const backendMsg = error.response.data.message.toLowerCase();
        if (backendMsg.includes('duplicate') || backendMsg.includes('unique')) {
          message = 'This record already exists. Please check your data.';
        } else if (backendMsg.includes('validation')) {
          message = 'Some required fields are missing or incorrect.';
        } else {
          message = error.response.data.message;
        }
      }
    } else if (error.request) {
      // The request was made but no response was received (Network error, etc.)
      if (error.message && error.message.toLowerCase().includes('timeout')) {
        message = 'The connection timed out. Please check your internet connection and try again.';
      } else if (error.message && error.message.toLowerCase().includes('network error')) {
        message = 'Unable to connect to the server. Please check your internet connection.';
      } else {
        message = 'Unable to reach our servers right now. Please check your network and try again.';
      }
    } else {
      // Something happened while setting up the request
      message = 'An unexpected error occurred. Please try again.';
    }

    return Promise.reject(new Error(message));
  }
);

export default api;
