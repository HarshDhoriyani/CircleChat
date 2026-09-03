import axiosClient from './axiosClient';

export const authApi = {
  register: (payload) => axiosClient.post('/auth/register', payload),
  login: (payload) => axiosClient.post('/auth/login', payload),
  logout: () => axiosClient.post('/auth/logout'),
  getMe: () => axiosClient.get('/auth/me'),
  updateProfile: (payload) => axiosClient.patch('/auth/profile', payload),
};

export default authApi;
