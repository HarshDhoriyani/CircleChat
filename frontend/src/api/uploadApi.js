import axiosClient from './axiosClient';

export const uploadApi = {
  uploadFile: async (file, onProgress) => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await axiosClient.post('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percentCompleted);
        }
      },
    });

    return response;
  },
};

export default uploadApi;
