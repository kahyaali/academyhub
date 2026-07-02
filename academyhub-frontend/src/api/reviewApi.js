// src/api/reviewApi.js
import api from './api';

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

export default reviewApi;