import axiosClient from './axiosClient';

export const userApi = {
  searchUsers: (query) => axiosClient.get(`/users/search?q=${encodeURIComponent(query || '')}`),
  getAllUsers: () => axiosClient.get('/users'),
  getUserById: (id) => axiosClient.get(`/users/${id}`),
};

export default userApi;
