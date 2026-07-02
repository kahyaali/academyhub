import React, { useState, useEffect } from 'react';
import { 
    FaStar, FaRegStar, FaUserCircle, 
    FaCheckCircle, FaClock, FaEdit, FaTrash, FaPaperPlane
} from 'react-icons/fa';
import { reviewApi } from '../api/api';
import { useAuth } from '../contexts/AuthContext';
import Swal from 'sweetalert2';
import './CourseReviews.css';

const CourseReviews = ({ courseId }) => {
    const { user } = useAuth();
    const [reviews, setReviews] = useState([]);
    const [averageRating, setAverageRating] = useState(0);
    const [totalReviews, setTotalReviews] = useState(0);
    const [loading, setLoading] = useState(true);
    const [userReview, setUserReview] = useState(null);
    const [showReviewForm, setShowReviewForm] = useState(false);
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');
    const [hoverRating, setHoverRating] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const isAuthenticated = !!user;
    const isAdmin = user?.role === 'Admin' || user?.role === 3;

    useEffect(() => {
        fetchReviews();
    }, [courseId]);

    const fetchReviews = async () => {
        try {
            setLoading(true);
            const res = await reviewApi.getReviewsByCourse(courseId);
            const data = res.data.data;
            setReviews(data.reviews || []);
            setAverageRating(data.averageRating || 0);
            setTotalReviews(data.totalReviews || 0);
            if (isAuthenticated) {
                const myReview = data.reviews?.find(r => r.userId === user?.id);
                if (myReview) {
                    setUserReview(myReview);
                    setRating(myReview.rating);
                    setComment(myReview.comment || '');
                }
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmitReview = async (e) => {
        e.preventDefault();
        if (rating === 0) {
            Swal.fire({
                icon: 'warning',
                title: 'Puan Ver!',
                text: 'Lütfen bir puan seçin.',
                confirmButtonColor: '#667eea'
            });
            return;
        }
        try {
            setIsSubmitting(true);
            await reviewApi.createReview({ courseId, rating, comment });
            Swal.fire({
                icon: 'success',
                title: 'Başarılı!',
                text: 'Yorumunuz admin onayına gönderildi.',
                timer: 1500,
                showConfirmButton: false
            });
            setShowReviewForm(false);
            setRating(0);
            setComment('');
            await fetchReviews();
        } catch (err) {
            Swal.fire({
                icon: 'error',
                title: 'Hata!',
                text: err.response?.data?.message || 'Yorum gönderilemedi!'
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    // 🔥🔥🔥 SADECE BİR TANE handleDeleteReview OLSUN 🔥🔥🔥
    const handleDeleteReview = async (id) => {
        const result = await Swal.fire({
            icon: 'warning',
            title: 'Emin misiniz?',
            text: 'Bu yorumu silmek istediğinize emin misiniz?',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'Evet, sil',
            cancelButtonText: 'İptal'
        });
        if (result.isConfirmed) {
            try {
                await reviewApi.deleteReview(id);
                Swal.fire({
                    icon: 'success',
                    title: 'Silindi!',
                    timer: 1500,
                    showConfirmButton: false
                });
                await fetchReviews();
            } catch (err) {
                Swal.fire({
                    icon: 'error',
                    title: 'Hata!',
                    text: 'Yorum silinirken hata oluştu!'
                });
            }
        }
    };

    const renderStars = (rating) => {
        return [...Array(5)].map((_, i) => (
            <FaStar key={i} className={`star-${i < rating ? 'filled' : 'empty'}`} />
        ));
    };

    const renderRatingInput = () => {
        return [...Array(5)].map((_, i) => (
            <button
                key={i}
                type="button"
                className="rating-star-btn"
                onClick={() => setRating(i + 1)}
                onMouseEnter={() => setHoverRating(i + 1)}
                onMouseLeave={() => setHoverRating(0)}
            >
                {(hoverRating || rating) > i ? (
                    <FaStar className="star-filled" />
                ) : (
                    <FaRegStar className="star-empty" />
                )}
            </button>
        ));
    };

    if (loading) {
        return (
            <div className="reviews-loading">
                <div className="spinner"></div>
            </div>
        );
    }

    return (
        <div className="reviews-container">
            {/* ===== HEADER ===== */}
            <div className="reviews-header">
                <div>
                    <h3 className="reviews-title">💬 Yorumlar</h3>
                    <div className="reviews-rating">
                        <div className="stars">{renderStars(Math.round(averageRating))}</div>
                        <span className="rating-number">{averageRating.toFixed(1)}</span>
                        <span className="rating-count">({totalReviews} yorum)</span>
                    </div>
                </div>
                {isAuthenticated && !userReview && (
                    <button
                        className="btn-review"
                        onClick={() => setShowReviewForm(!showReviewForm)}
                    >
                        {showReviewForm ? '❌ Vazgeç' : '✍️ Yorum Yap'}
                    </button>
                )}
            </div>

            {/* ===== FORM ===== */}
            {showReviewForm && !userReview && (
                <div className="review-form">
                    <form onSubmit={handleSubmitReview}>
                        <div className="form-group">
                            <label className="form-label">⭐ Puanınız</label>
                            <div className="rating-input">
                                {renderRatingInput()}
                                <span className="rating-selected">
                                    {rating > 0 ? `${rating}/5` : 'Puan seçin'}
                                </span>
                            </div>
                        </div>
                        <div className="form-group">
                            <label className="form-label">📝 Yorumunuz</label>
                            <textarea
                                className="form-textarea"
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                placeholder="Bu kurs hakkındaki düşüncelerinizi yazın..."
                                rows="3"
                            />
                        </div>
                        <button
                            type="submit"
                            className="btn-submit"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? (
                                <span className="spinner-small"></span>
                            ) : (
                                <FaPaperPlane className="icon-submit" />
                            )}
                            {isSubmitting ? 'Gönderiliyor...' : 'Yorum Gönder'}
                        </button>
                    </form>
                </div>
            )}

            {/* ===== REVIEWS LIST ===== */}
            {reviews.length === 0 ? (
                <div className="reviews-empty">
                    <div className="empty-icon">📝</div>
                    <p className="empty-text">Henüz yorum yapılmamış.</p>
                    {isAuthenticated && !userReview && (
                        <button
                            className="empty-btn"
                            onClick={() => setShowReviewForm(true)}
                        >
                            ✍️ İlk yorumu sen yap
                        </button>
                    )}
                </div>
            ) : (
                <div className="reviews-list">
                    {reviews.map((review) => (
                        <div key={review.id} className="review-item">
                            <div className="review-avatar">
                                {review.userName?.charAt(0) || 'U'}
                            </div>
                            <div className="review-content">
                                <div className="review-meta">
                                    <span className="review-name">{review.userName || 'Bilinmiyor'}</span>
                                    <div className="review-stars">{renderStars(review.rating)}</div>
                                    {review.isApproved ? (
                                        <span className="badge-approved">
                                            <FaCheckCircle className="badge-icon" /> Onaylandı
                                        </span>
                                    ) : (
                                        <span className="badge-pending">
                                            <FaClock className="badge-icon" /> Bekliyor
                                        </span>
                                    )}
                                </div>
                                {review.comment && (
                                    <p className="review-comment">{review.comment}</p>
                                )}
                                <div className="review-footer">
                                    <span className="review-date">
                                        {new Date(review.createdDate).toLocaleDateString('tr-TR')}
                                    </span>
                                    {(review.userId === user?.id || isAdmin) && (
                                        <div className="review-actions">
                                            {review.userId === user?.id && !review.isApproved && (
                                                <button
                                                    className="action-btn edit"
                                                    onClick={() => {
                                                        setUserReview(review);
                                                        setRating(review.rating);
                                                        setComment(review.comment || '');
                                                        setShowReviewForm(true);
                                                    }}
                                                >
                                                    <FaEdit />
                                                </button>
                                            )}
                                            {(review.userId === user?.id || isAdmin) && (
                                                <button
                                                    className="action-btn delete"
                                                    onClick={() => handleDeleteReview(review.id)}
                                                >
                                                    <FaTrash />
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default CourseReviews;