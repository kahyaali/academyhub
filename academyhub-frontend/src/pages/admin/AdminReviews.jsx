import React, { useState, useEffect } from 'react';
import { FaCheck, FaTimes, FaStar, FaClock } from 'react-icons/fa';
import { reviewApi } from '../../api/api';
import Swal from 'sweetalert2';
import './AdminReviews.css';

const AdminReviews = () => {
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshTimer, setRefreshTimer] = useState(null);

    useEffect(() => {
        fetchPendingReviews();
        
        //  HER 10 SANİYEDE BİR YENİ YORUMLARI KONTROL ET
        const timer = setInterval(() => {
            fetchPendingReviews(true);
        }, 10000);
        
        setRefreshTimer(timer);
        
        return () => {
            if (refreshTimer) {
                clearInterval(refreshTimer);
            }
        };
    }, []);

    const fetchPendingReviews = async (silent = false) => {
        try {
            if (!silent) setLoading(true);
            const res = await reviewApi.getPendingReviews();
            console.log('📦 Bekleyen yorumlar:', res.data);
            
            const newReviews = res.data.data || [];
            
            //  Yeni yorum varsa güncelle
            if (newReviews.length !== reviews.length && !silent) {
                // Yeni yorum geldi
                if (newReviews.length > reviews.length) {
                    console.log('🔔 Yeni yorum geldi!');
                }
            }
            
            setReviews(newReviews);
        } catch (err) {
            console.error('Bekleyen yorumlar yüklenirken hata:', err);
        } finally {
            if (!silent) setLoading(false);
        }
    };

    const handleApprove = async (id) => {
        try {
            const response = await reviewApi.approveReview(id);
            console.log('📥 Onay cevabı:', response.data);
            
            if (response.data.success) {
                Swal.fire({
                    icon: 'success',
                    title: '✅ Onaylandı!',
                    text: 'Yorum başarıyla onaylandı.',
                    timer: 1500,
                    showConfirmButton: false,
                    background: '#f0fdf4',
                    iconColor: '#10b981'
                });
                
                //  LİSTEDEN KALDIR
                setReviews(prevReviews => 
                    prevReviews.filter(review => review.id !== id)
                );
            }
        } catch (err) {
            console.error('❌ Onay hatası:', err);
            Swal.fire({
                icon: 'error',
                title: 'Hata!',
                text: err.response?.data?.message || 'Yorum onaylanırken hata oluştu!'
            });
        }
    };

    const handleReject = async (id) => {
        const result = await Swal.fire({
            icon: 'warning',
            title: 'Emin misiniz?',
            text: 'Bu yorumu reddetmek istediğinize emin misiniz?',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'Evet, reddet',
            cancelButtonText: 'İptal'
        });

        if (result.isConfirmed) {
            try {
                const response = await reviewApi.rejectReview(id);
                console.log('📥 Red cevabı:', response.data);
                
                if (response.data.success) {
                    Swal.fire({
                        icon: 'success',
                        title: '❌ Reddedildi!',
                        text: 'Yorum başarıyla reddedildi.',
                        timer: 1500,
                        showConfirmButton: false,
                        background: '#fef2f2',
                        iconColor: '#ef4444'
                    });
                    
                    //  LİSTEDEN KALDIR
                    setReviews(prevReviews => 
                        prevReviews.filter(review => review.id !== id)
                    );
                }
            } catch (err) {
                console.error('❌ Red hatası:', err);
                Swal.fire({
                    icon: 'error',
                    title: 'Hata!',
                    text: err.response?.data?.message || 'Yorum reddedilirken hata oluştu!'
                });
            }
        }
    };

    const renderStars = (rating) => {
        return [...Array(5)].map((_, i) => (
            <FaStar
                key={i}
                className={`star ${i < rating ? 'star-filled' : 'star-empty'}`}
            />
        ));
    };

    const getStatusBadge = (review) => {
        if (review.isApproved) {
            return <span className="badge badge-approved">✅ Onaylandı</span>;
        }
        return <span className="badge badge-pending">⏳ Bekliyor</span>;
    };

    if (loading) {
        return (
            <div className="admin-reviews-loading">
                <div className="spinner"></div>
                <p>Yorumlar yükleniyor...</p>
            </div>
        );
    }

    return (
        <div className="admin-reviews-container">
            {/* HEADER */}
            <div className="admin-reviews-header">
                <div>
                    <h1 className="page-title">📝 Yorum Onayları</h1>
                    <p className="page-subtitle">Admin onayı bekleyen yorumları yönetin</p>
                </div>
                <div className="header-stats">
                    <div className="stat-badge">
                        <FaClock className="stat-icon" />
                        <span>{reviews.length} yorum bekliyor</span>
                    </div>
                </div>
            </div>

            {/* CONTENT */}
            {reviews.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-icon">✅</div>
                    <h3 className="empty-title">Bekleyen Yorum Yok</h3>
                    <p className="empty-text">Tüm yorumlar onaylanmış veya reddedilmiş.</p>
                </div>
            ) : (
                <div className="reviews-grid">
                    {reviews.map((review) => (
                        <div key={review.id} className="review-card">
                            <div className="review-card-header">
                                <div className="user-info">
                                    <div className="user-avatar">
                                        {review.userName?.charAt(0) || 'U'}
                                    </div>
                                    <div>
                                        <div className="user-name">{review.userName || 'Bilinmiyor'}</div>
                                        <div className="course-name">{review.courseTitle || 'Kurs'}</div>
                                    </div>
                                </div>
                                {getStatusBadge(review)}
                            </div>

                            <div className="review-card-body">
                                <div className="rating-section">
                                    <div className="stars-wrapper">
                                        {renderStars(review.rating)}
                                    </div>
                                    <span className="rating-text">{review.rating}/5</span>
                                </div>
                                {review.comment && (
                                    <div className="comment-wrapper">
                                        <div className="comment-icon">💬</div>
                                        <p className="comment-text">{review.comment}</p>
                                    </div>
                                )}
                                <div className="review-date">
                                    <FaClock className="date-icon" />
                                    {new Date(review.createdDate).toLocaleString('tr-TR')}
                                </div>
                            </div>

                            <div className="review-card-actions">
                                <button
                                    onClick={() => handleApprove(review.id)}
                                    className="btn-approve"
                                >
                                    <FaCheck className="btn-icon" />
                                    Onayla
                                </button>
                                <button
                                    onClick={() => handleReject(review.id)}
                                    className="btn-reject"
                                >
                                    <FaTimes className="btn-icon" />
                                    Reddet
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default AdminReviews;