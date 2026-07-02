import axios from 'axios';

//  Ortama göre otomatik değişir
// Development: http://localhost:7230/api/v1
// Production: https://api.academyhub.com/api/v1
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:7230/api/v1';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ============ EXAM API ============
export const examApi = {
    getExamsByCourse: (courseId) => api.get(`/exam/course/${courseId}`),
    getExam: (examId) => api.get(`/exam/${examId}`),
    startExam: (examId) => api.post(`/exam/${examId}/start`),
    submitExam: (data) => api.post('/exam/submit', data),
    getExamResult: (resultId) => api.get(`/exam/result/${resultId}`),
    getMyExamResults: () => api.get('/exam/results/me'),
};

// ============ CERTIFICATE API ============
export const certificateApi = {
    getMyCertificates: () => api.get('/certificate/me'),
    getCertificateByCourse: (courseId) => api.get(`/certificate/course/${courseId}`),
    getCertificate: (id) => api.get(`/certificate/${id}`),
    verifyCertificate: (certificateNumber) => api.post('/certificate/verify', { certificateNumber }),
};

// ============ MAIL CONFIGURATION API ============
export const mailConfigurationApi = {
    getConfiguration: () => api.get('/mailconfiguration'),
    getActiveConfiguration: () => api.get('/mailconfiguration/active'),
    createConfiguration: (data) => api.post('/mailconfiguration', data),
    updateConfiguration: (data) => api.put('/mailconfiguration', data),
    sendTestEmail: (testEmail) => api.post('/mailconfiguration/test', { testEmail }),
    validateConfiguration: (data) => api.post('/mailconfiguration/validate', data),
};

// ============  REVIEW API  ============
export const reviewApi = {
    // Kursun yorumlarını getir
    getReviewsByCourse: (courseId) => api.get(`/review/course/${courseId}`),
    
    // Kendi yorumlarım
    getMyReviews: () => api.get('/review/me'),
    
    // Yorum detayı
    getReview: (id) => api.get(`/review/${id}`),
    
    // Yorum oluştur
    createReview: (data) => api.post('/review', data),
    
    // Yorum güncelle
    updateReview: (id, data) => api.put(`/review/${id}`, data),
    
    // Yorum sil
    deleteReview: (id) => api.delete(`/review/${id}`),
    
    // Admin - Bekleyen yorumlar
    getPendingReviews: () => api.get('/review/pending'),
    
    // Admin - Yorum onayla
    approveReview: (id) => api.post(`/review/${id}/approve`),
    
    // Admin - Yorum reddet
    rejectReview: (id) => api.post(`/review/${id}/reject`),
};

export default api;