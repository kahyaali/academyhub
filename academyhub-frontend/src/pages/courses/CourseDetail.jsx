import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
    FaArrowLeft, FaClock, FaUser, FaStar, FaBookOpen, 
    FaEdit, FaTrash, FaSpinner, FaGraduationCap, 
    FaUsers, FaVideo, FaCheckCircle, FaLayerGroup,
    FaCalendarAlt, FaEye, FaTag, FaAward, FaPlayCircle,
    FaInfoCircle, FaPlus, FaPlay, FaLock, FaChartLine,
    FaListUl, FaFile, FaDownload
} from 'react-icons/fa';
import Swal from 'sweetalert2';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../api/api';
import CourseReviews from '../../components/CourseReviews';  

const CourseDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [course, setCourse] = useState(null);
    const [lessons, setLessons] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isEnrolled, setIsEnrolled] = useState(false);

    const isInstructor = user?.role === 'Instructor' || user?.role === 2;
    const isAdmin = user?.role === 'Admin' || user?.role === 3;
    const isAuthenticated = !!user;

    useEffect(() => {
        fetchCourseDetail();
    }, [id]);

    const fetchCourseDetail = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/course/${id}`);
            setCourse(response.data.data);
            
            const lessonsResponse = await api.get(`/lesson/course/${id}`);
            setLessons(lessonsResponse.data.data || []);
            
            if (isAuthenticated) {
                try {
                    const enrollResponse = await api.get(`/enrollment/check/${id}`);
                    const isEnrolled = enrollResponse.data?.data?.isEnrolled || false;
                    setIsEnrolled(isEnrolled);
                } catch (enrollErr) {
                    console.error('❌ Kayıt kontrolü hatası:', enrollErr);
                    setIsEnrolled(false);
                }
            }
            
            setError('');
        } catch (err) {
            console.error('❌ Kurs detayı yüklenirken hata:', err);
            setError(err.response?.data?.message || 'Kurs detayı yüklenirken hata oluştu');
        } finally {
            setLoading(false);
        }
    };

    const handleEnroll = async () => {
        if (!isAuthenticated) {
            Swal.fire({
                icon: 'warning',
                title: 'Giriş Yapın',
                text: 'Bu kursa kaydolmak için lütfen giriş yapın.',
                confirmButtonColor: '#667eea'
            });
            navigate('/login');
            return;
        }

        try {
            await api.post('/enrollment', { courseId: parseInt(id) });
            setIsEnrolled(true);
            await fetchCourseDetail();
            Swal.fire({
                icon: 'success',
                title: 'Başarılı!',
                text: 'Kursa başarıyla kaydoldunuz.',
                timer: 2000,
                showConfirmButton: false
            });
        } catch (err) {
            Swal.fire({
                icon: 'error',
                title: 'Hata!',
                text: err.response?.data?.message || 'Kayıt olurken hata oluştu',
                confirmButtonColor: '#ef4444'
            });
        }
    };

    const handleDelete = async () => {
        const result = await Swal.fire({
            title: 'Emin misiniz?',
            text: `"${course?.title}" kursunu silmek istediğinize emin misiniz?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'Evet, sil!',
            cancelButtonText: 'İptal'
        });

        if (result.isConfirmed) {
            try {
                await api.delete(`/course/${id}`);
                Swal.fire({
                    icon: 'success',
                    title: 'Silindi!',
                    text: `"${course?.title}" kursu silindi.`,
                    timer: 2000,
                    showConfirmButton: false
                });
                if (isInstructor) {
                    navigate('/instructor/courses');
                } else {
                    navigate('/courses');
                }
            } catch (err) {
                Swal.fire({
                    icon: 'error',
                    title: 'Hata!',
                    text: err.response?.data?.message || 'Kurs silinirken hata oluştu!',
                    confirmButtonColor: '#ef4444'
                });
            }
        }
    };

    const handleDeleteLesson = async (lessonId, lessonTitle) => {
        const result = await Swal.fire({
            title: 'Emin misiniz?',
            text: `"${lessonTitle}" dersini silmek istediğinize emin misiniz?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'Evet, sil!',
            cancelButtonText: 'İptal'
        });

        if (result.isConfirmed) {
            try {
                await api.delete(`/lesson/${lessonId}`);
                const lessonsResponse = await api.get(`/lesson/course/${id}`);
                setLessons(lessonsResponse.data.data || []);
                
                Swal.fire({
                    icon: 'success',
                    title: 'Silindi!',
                    text: 'Ders başarıyla silindi.',
                    timer: 2000,
                    showConfirmButton: false
                });
            } catch (err) {
                Swal.fire({
                    icon: 'error',
                    title: 'Hata!',
                    text: err.response?.data?.message || 'Ders silinirken hata oluştu!',
                    confirmButtonColor: '#ef4444'
                });
            }
        }
    };

    const getBackPath = () => isInstructor ? '/instructor/courses' : '/courses';

    if (loading) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 16 }}>
                <FaSpinner style={{ animation: 'spin 1s linear infinite', color: '#667eea', fontSize: 48 }} />
                <p style={{ color: '#6b7280' }}>Kurs detayı yükleniyor...</p>
                <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    if (error) {
        return (
            <div style={{ textAlign: 'center', padding: 60, background: '#fee2e2', borderRadius: 12, maxWidth: 600, margin: '40px auto' }}>
                <p style={{ color: '#991b1b', fontSize: 16 }}>{error}</p>
                <button onClick={fetchCourseDetail} style={{ marginTop: 16, padding: '8px 24px', border: '1px solid #991b1b', borderRadius: 8, background: 'transparent', cursor: 'pointer' }}>Tekrar Dene</button>
            </div>
        );
    }

    if (!course) {
        return (
            <div style={{ textAlign: 'center', padding: 80 }}>
                <h3 style={{ fontSize: 24, color: '#0f0c29' }}>Kurs bulunamadı</h3>
                <Link to={getBackPath()} style={{ color: '#667eea', textDecoration: 'none', marginTop: 16, display: 'inline-block' }}>← Geri Dön</Link>
            </div>
        );
    }

    const totalLessons = lessons.length;
    const totalDuration = lessons.reduce((acc, l) => acc + (parseInt(l.videoDuration) || 0), 0);

    return (
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 20px' }}>
            {/* Back Button */}
            <Link to={getBackPath()} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: '#64748b', textDecoration: 'none', fontSize: 14, fontWeight: 500, padding: '8px 16px', borderRadius: 10, background: 'white', border: '1px solid #e2e8f0', marginBottom: 24, transition: 'all 0.2s' }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#667eea'; e.currentTarget.style.color = '#667eea'; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.color = '#64748b'; }}>
                <FaArrowLeft size={14} /> {isInstructor ? 'Kurslarıma Dön' : 'Kurslara Dön'}
            </Link>

            {/* ============ HERO ============ */}
            <div style={{ 
                display: 'grid', 
                gridTemplateColumns: '1fr 1.2fr', 
                gap: 0,
                background: 'white',
                borderRadius: 20,
                overflow: 'hidden',
                boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
                marginBottom: 32,
                border: '1px solid rgba(0,0,0,0.04)'
            }}>
                <div style={{ 
                    background: 'linear-gradient(135deg, #1e1b4b, #4f46e5)',
                    minHeight: 300,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                    padding: 40
                }}>
                    {course.coverImage ? (
                        <img src={course.coverImage} alt={course.title} style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', inset: 0 }} />
                    ) : (
                        <div style={{ fontSize: 80, opacity: 0.3 }}>🎓</div>
                    )}
                    <div style={{ position: 'absolute', top: 16, left: 16, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {course.isFree && <span style={{ padding: '4px 14px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: '#10b981', color: 'white', backdropFilter: 'blur(4px)' }}>Ücretsiz</span>}
                        <span style={{ padding: '4px 14px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: course.isPublished ? '#3b82f6' : '#f59e0b', color: 'white', backdropFilter: 'blur(4px)' }}>
                            {course.isPublished ? 'Yayında' : 'Taslak'}
                        </span>
                    </div>
                </div>

                <div style={{ padding: 32, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
                        <h1 style={{ fontSize: 26, fontWeight: 700, color: '#0f0c29', margin: 0, lineHeight: 1.2 }}>{course.title}</h1>
                        {(isInstructor || isAdmin) && (
                            <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                                <Link to={`/courses/edit/${course.id}`} style={{ padding: '6px 12px', background: '#f59e0b', color: 'white', borderRadius: 8, fontSize: 12, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
                                    <FaEdit size={12} /> Düzenle
                                </Link>
                                <button onClick={handleDelete} style={{ padding: '6px 12px', background: '#ef4444', color: 'white', border: 'none', borderRadius: 8, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                                    <FaTrash size={12} /> Sil
                                </button>
                            </div>
                        )}
                    </div>
                    <p style={{ color: '#64748b', fontSize: 14, lineHeight: 1.7, marginTop: 8 }}>{course.description}</p>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 12, padding: '10px 14px', background: '#f8fafc', borderRadius: 10 }}>
                        <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, #667eea, #764ba2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: 14 }}>
                            {course.instructorName?.charAt(0) || 'E'}
                        </div>
                        <div>
                            <div style={{ fontWeight: 600, fontSize: 14, color: '#0f0c29' }}>{course.instructorName || 'Bilinmeyen Eğitmen'}</div>
                            <div style={{ fontSize: 12, color: '#94a3b8' }}>Eğitmen</div>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 12 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, color: '#475569', background: '#f1f5f9', padding: '4px 12px', borderRadius: 16 }}>
                            <FaUsers size={12} style={{ color: '#667eea' }} /> {course.totalStudents || 0}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, color: '#475569', background: '#f1f5f9', padding: '4px 12px', borderRadius: 16 }}>
                            <FaVideo size={12} style={{ color: '#667eea' }} /> {totalLessons}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, color: '#475569', background: '#f1f5f9', padding: '4px 12px', borderRadius: 16 }}>
                            <FaClock size={12} style={{ color: '#667eea' }} /> {totalDuration} dk
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, color: '#475569', background: '#f1f5f9', padding: '4px 12px', borderRadius: 16 }}>
                            <FaStar size={12} style={{ color: '#f59e0b' }} /> {course.averageRating?.toFixed(1) || 0}
                        </div>
                    </div>

                    {/* Satın Al Butonu */}
                    <div style={{ marginTop: 14 }}>
                        {isEnrolled ? (
                            <button disabled style={{ 
                                width: '100%', 
                                padding: '10px', 
                                background: '#10b981', 
                                color: 'white', 
                                border: 'none', 
                                borderRadius: 10, 
                                fontWeight: 600, 
                                fontSize: 14, 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'center', 
                                gap: 8 
                            }}>
                                <FaCheckCircle /> Kayıtlısınız
                            </button>
                        ) : isAuthenticated ? (
                            <button 
                                onClick={() => navigate(`/checkout/${course.id}`)}
                                style={{ 
                                    width: '100%', 
                                    padding: '10px', 
                                    background: 'linear-gradient(135deg, #667eea, #764ba2)', 
                                    color: 'white', 
                                    border: 'none', 
                                    borderRadius: 10, 
                                    fontWeight: 600, 
                                    fontSize: 14, 
                                    cursor: 'pointer', 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    justifyContent: 'center', 
                                    gap: 8, 
                                    transition: 'all 0.3s', 
                                    boxShadow: '0 4px 14px rgba(102,126,234,0.3)' 
                                }}
                                onMouseEnter={(e) => { 
                                    if (!e.currentTarget.disabled) {
                                        e.currentTarget.style.transform = 'translateY(-2px)'; 
                                        e.currentTarget.style.boxShadow = '0 8px 24px rgba(102,126,234,0.4)'; 
                                    }
                                }}
                                onMouseLeave={(e) => { 
                                    e.currentTarget.style.transform = 'translateY(0)'; 
                                    e.currentTarget.style.boxShadow = '0 4px 14px rgba(102,126,234,0.3)'; 
                                }}
                            >
                                <FaPlayCircle /> 
                                {course.isFree 
                                    ? 'Ücretsiz Kaydol' 
                                    : `${course.formattedPrice} - Satın Al`
                                }
                            </button>
                        ) : (
                            <Link 
                                to="/login" 
                                style={{ 
                                    width: '100%', 
                                    padding: '10px', 
                                    background: 'linear-gradient(135deg, #667eea, #764ba2)', 
                                    color: 'white', 
                                    border: 'none', 
                                    borderRadius: 10, 
                                    fontWeight: 600, 
                                    fontSize: 14, 
                                    textDecoration: 'none', 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    justifyContent: 'center', 
                                    gap: 8, 
                                    transition: 'all 0.3s', 
                                    boxShadow: '0 4px 14px rgba(102,126,234,0.3)' 
                                }}
                                onMouseEnter={(e) => { 
                                    e.currentTarget.style.transform = 'translateY(-2px)'; 
                                    e.currentTarget.style.boxShadow = '0 8px 24px rgba(102,126,234,0.4)'; 
                                }}
                                onMouseLeave={(e) => { 
                                    e.currentTarget.style.transform = 'translateY(0)'; 
                                    e.currentTarget.style.boxShadow = '0 4px 14px rgba(102,126,234,0.3)'; 
                                }}
                            >
                                <FaPlayCircle /> Kaydolmak İçin Giriş Yap
                            </Link>
                        )}
                    </div>
                </div>
            </div>

            {/* ============ KURS BİLGİLERİ ============ */}
            <div style={{ background: 'white', borderRadius: 16, padding: 24, boxShadow: '0 2px 12px rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.04)', marginBottom: 24 }}>
                <h3 style={{ fontSize: 17, fontWeight: 600, color: '#0f0c29', margin: 0, display: 'flex', alignItems: 'center', gap: 10, paddingBottom: 12, borderBottom: '1px solid #f1f5f9' }}>
                    <FaListUl style={{ color: '#667eea', fontSize: 18 }} /> Kurs Bilgileri
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12, marginTop: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: '#475569', padding: '8px 12px', background: '#f8fafc', borderRadius: 8 }}>
                        <FaTag style={{ color: '#667eea', fontSize: 14 }} /> 
                        <span>{course.categoryName || 'Belirtilmemiş'}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: '#475569', padding: '8px 12px', background: '#f8fafc', borderRadius: 8 }}>
                        <FaLayerGroup style={{ color: '#667eea', fontSize: 14 }} /> 
                        <span>{course.level || 'Başlangıç'}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: '#475569', padding: '8px 12px', background: '#f8fafc', borderRadius: 8 }}>
                        <FaCalendarAlt style={{ color: '#667eea', fontSize: 14 }} /> 
                        <span>{new Date(course.createdDate).toLocaleDateString('tr-TR')}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: '#475569', padding: '8px 12px', background: '#f8fafc', borderRadius: 8 }}>
                        <FaEye style={{ color: '#667eea', fontSize: 14 }} /> 
                        <span>{course.isPublished ? 'Yayında' : 'Taslak'}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: '#475569', padding: '8px 12px', background: '#f8fafc', borderRadius: 8 }}>
                        <FaAward style={{ color: '#667eea', fontSize: 14 }} /> 
                        <span>{course.totalStudents || 0} Öğrenci</span>
                    </div>
                    {!course.isFree && (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 14, padding: '8px 12px', background: '#f8fafc', borderRadius: 8 }}>
                            <span style={{ color: '#475569' }}>Fiyat</span>
                            <span style={{ fontWeight: 700, color: '#0f0c29' }}>{course.formattedPrice}</span>
                        </div>
                    )}
                </div>
            </div>

            {/* ============ NE ÖĞRENECEKSİNİZ ============ */}
            {course.whatYouWillLearn && (
                <div style={{ background: 'white', borderRadius: 16, padding: 24, boxShadow: '0 2px 12px rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.04)', marginBottom: 24 }}>
                    <h3 style={{ fontSize: 17, fontWeight: 600, color: '#0f0c29', margin: 0, display: 'flex', alignItems: 'center', gap: 10, paddingBottom: 12, borderBottom: '1px solid #f1f5f9' }}>
                        <FaGraduationCap style={{ color: '#667eea', fontSize: 18 }} /> Ne Öğreneceksiniz?
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 12 }}>
                        {course.whatYouWillLearn.split('\n').filter(Boolean).map((item, index) => (
                            <div key={index} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '6px 12px', background: '#f8fafc', borderRadius: 8, fontSize: 14, color: '#475569' }}>
                                <span style={{ color: '#10b981', fontWeight: 600, fontSize: 16 }}>✓</span>
                                <span>{item}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ============ GEREKSİNİMLER ============ */}
            {course.requirements && (
                <div style={{ background: 'white', borderRadius: 16, padding: 24, boxShadow: '0 2px 12px rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.04)', marginBottom: 24 }}>
                    <h3 style={{ fontSize: 17, fontWeight: 600, color: '#0f0c29', margin: 0, display: 'flex', alignItems: 'center', gap: 10, paddingBottom: 12, borderBottom: '1px solid #f1f5f9' }}>
                        <FaInfoCircle style={{ color: '#667eea', fontSize: 18 }} /> Gereksinimler
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 12 }}>
                        {course.requirements.split('\n').filter(Boolean).map((item, index) => (
                            <div key={index} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '6px 12px', background: '#f8fafc', borderRadius: 8, fontSize: 14, color: '#475569' }}>
                                <span style={{ color: '#f59e0b', fontWeight: 600, fontSize: 16 }}>▸</span>
                                <span>{item}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ============ HEDEF KİTLE ============ */}
            {course.targetAudience && (
                <div style={{ background: 'white', borderRadius: 16, padding: 24, boxShadow: '0 2px 12px rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.04)', marginBottom: 24 }}>
                    <h3 style={{ fontSize: 17, fontWeight: 600, color: '#0f0c29', margin: 0, display: 'flex', alignItems: 'center', gap: 10, paddingBottom: 12, borderBottom: '1px solid #f1f5f9' }}>
                        <FaUsers style={{ color: '#667eea', fontSize: 18 }} /> Hedef Kitle
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 12 }}>
                        {course.targetAudience.split('\n').filter(Boolean).map((item, index) => (
                            <div key={index} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '6px 12px', background: '#f8fafc', borderRadius: 8, fontSize: 14, color: '#475569' }}>
                                <span style={{ color: '#3b82f6', fontWeight: 600, fontSize: 16 }}>•</span>
                                <span>{item}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ============ DERSLER ============ */}
            <div style={{ background: 'white', borderRadius: 16, padding: 24, boxShadow: '0 2px 12px rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.04)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 12, borderBottom: '1px solid #f1f5f9' }}>
                    <h3 style={{ fontSize: 17, fontWeight: 600, color: '#0f0c29', margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
                        <FaLayerGroup style={{ color: '#667eea', fontSize: 18 }} /> Dersler ({totalLessons})
                    </h3>
                    {(isInstructor || isAdmin) && (
                        <Link to={`/courses/${course.id}/lesson/create`} style={{ padding: '8px 18px', background: 'linear-gradient(135deg, #667eea, #764ba2)', color: 'white', borderRadius: 8, textDecoration: 'none', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4, transition: 'all 0.2s' }}
                        onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(102,126,234,0.3)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}>
                            <FaPlus size={12} /> Ders Ekle
                        </Link>
                    )}
                </div>

                {totalLessons === 0 ? (
                    <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>
                        <div style={{ fontSize: 40, marginBottom: 10 }}>📝</div>
                        <p style={{ fontSize: 14 }}>Henüz ders eklenmemiş.</p>
                    </div>
                ) : (
                    <div style={{ marginTop: 12 }}>
                        {lessons.map((lesson, i) => {
                            const isLocked = !isEnrolled && !isInstructor && !isAdmin && !lesson.isPreview && !isAuthenticated;
                            return (
                                <div 
                                    key={lesson.id}
                                    style={{ 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        gap: 12, 
                                        padding: '10px 16px', 
                                        borderRadius: 8, 
                                        transition: 'all 0.15s',
                                        background: isLocked ? '#f8fafc' : 'white',
                                        borderBottom: i < totalLessons - 1 ? '1px solid #f1f5f9' : 'none'
                                    }}
                                    onMouseEnter={(e) => { if (!isLocked) e.currentTarget.style.background = '#f8fafc'; }}
                                    onMouseLeave={(e) => { if (!isLocked) e.currentTarget.style.background = 'white'; }}
                                >
                                    <span style={{ 
                                        fontWeight: 600, 
                                        color: '#667eea', 
                                        fontSize: 13, 
                                        minWidth: 30,
                                        background: '#eef2ff',
                                        padding: '2px 8px',
                                        borderRadius: 6,
                                        textAlign: 'center'
                                    }}>
                                        {String(i + 1).padStart(2, '0')}
                                    </span>

                                    <Link 
                                        to={isLocked ? '#' : `/courses/${course.id}/lesson/${lesson.id}`}
                                        onClick={(e) => {
                                            if (isLocked) {
                                                e.preventDefault();
                                                Swal.fire({
                                                    icon: 'info',
                                                    title: 'Erişim Engellendi',
                                                    text: 'Bu dersi izlemek için kursa kaydolmalısınız.',
                                                    confirmButtonColor: '#667eea'
                                                });
                                            }
                                        }}
                                        style={{ 
                                            flex: 1, 
                                            textDecoration: 'none', 
                                            color: isLocked ? '#94a3b8' : '#0f0c29', 
                                            fontSize: 14,
                                            fontWeight: 500,
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 8,
                                            opacity: isLocked ? 0.6 : 1
                                        }}
                                    >
                                        {isLocked ? <FaLock size={12} style={{ color: '#94a3b8' }} /> : <FaPlay size={12} style={{ color: '#667eea' }} />}
                                        {lesson.title}
                                        {lesson.isPreview && (
                                            <span style={{ fontSize: 10, background: '#f59e0b', color: 'white', padding: '1px 10px', borderRadius: 12, fontWeight: 600 }}>
                                                <FaEye size={9} style={{ marginRight: 3 }} /> Önizleme
                                            </span>
                                        )}
                                    </Link>

                                    <span style={{ fontSize: 13, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 4 }}>
                                        <FaClock size={12} /> {lesson.videoDuration || '0:00'}
                                    </span>

                                    {lesson.resourceUrl && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                e.preventDefault();
                                                const fullUrl = `http://localhost:7230${lesson.resourceUrl}`;
                                                window.open(fullUrl, '_blank');
                                            }}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 4,
                                                padding: '4px 12px',
                                                background: '#667eea',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: 6,
                                                fontSize: 12,
                                                fontWeight: 500,
                                                cursor: 'pointer',
                                                transition: 'all 0.2s',
                                                flexShrink: 0
                                            }}
                                            onMouseEnter={(e) => { e.currentTarget.style.background = '#764ba2'; }}
                                            onMouseLeave={(e) => { e.currentTarget.style.background = '#667eea'; }}
                                            title={lesson.resourceFileName || 'Kaynak Dosyası'}
                                        >
                                            <FaDownload size={12} /> 
                                            <span>{lesson.resourceFileName || 'Dosya'}</span>
                                        </button>
                                    )}

                                    {(isInstructor || isAdmin) && (
                                        <div style={{ display: 'flex', gap: 4 }}>
                                            <Link to={`/courses/${course.id}/lesson/edit/${lesson.id}`} style={{ color: '#f59e0b', fontSize: 14, padding: '4px' }} onClick={(e) => e.stopPropagation()}>
                                                <FaEdit size={14} />
                                            </Link>
                                            <button onClick={(e) => { e.stopPropagation(); handleDeleteLesson(lesson.id, lesson.title); }} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: 14, padding: '4px', display: 'flex', alignItems: 'center' }} title="Dersi Sil">
                                                <FaTrash size={14} />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* ============  YORUM BÖLÜMÜ  ============ */}
            <div style={{ marginTop: 32 }}>
                <CourseReviews courseId={parseInt(id)} />
            </div>

        </div>
    );
};

export default CourseDetail;