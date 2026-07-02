import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaSpinner, FaPlayCircle, FaUserGraduate } from 'react-icons/fa';
import api from '../../api/api';
import './MyCourses.css';

const MyCourses = () => {
    const [enrollments, setEnrollments] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchMyCourses();
    }, []);

    const fetchMyCourses = async () => {
        try {
            setLoading(true);
            const res = await api.get('/enrollment/student');
            console.log('📚 API Cevabı:', res.data);
            console.log('📦 Enrollments:', res.data.data);
            
            if (res.data.data && res.data.data.length > 0) {
                console.log('🔍 İlk enrollment:', res.data.data[0]);
                console.log('🔍 Eğitmen adı:', res.data.data[0].instructorName);
                console.log('🔍 Eğitmen resmi:', res.data.data[0].instructorImage);
            }
            
            setEnrollments(res.data.data || []);
        } catch (err) {
            console.error('Kurslarım yüklenirken hata:', err);
        } finally {
            setLoading(false);
        }
    };

    //  Resim URL'sini düzelt
    const getImageUrl = (imagePath) => {
        if (!imagePath) return null;
        if (imagePath.startsWith('http')) return imagePath;
        if (imagePath.startsWith('/')) return `http://localhost:7230${imagePath}`;
        return `http://localhost:7230/${imagePath}`;
    };

    //  Eğitmen baş harfleri (resim yoksa gösterilecek)
    const getInitials = (name) => {
        if (!name) return 'E';
        const parts = name.split(' ');
        if (parts.length >= 2) {
            return parts[0][0] + parts[1][0];
        }
        return name[0] || 'E';
    };

    if (loading) {
        return (
            <div className="my-courses-loading" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 16 }}>
                <FaSpinner className="spin" style={{ animation: 'spin 1s linear infinite', color: '#667eea', fontSize: 48 }} />
                <p style={{ color: '#6b7280' }}>Kurslarım yükleniyor...</p>
                <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    return (
        <div className="my-courses-page" style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 20px' }}>
            <div className="my-courses-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <div>
                    <h1 style={{ fontSize: 28, fontWeight: 700, color: '#0f0c29', margin: 0 }}>📖 Kurslarım</h1>
                    <p style={{ color: '#6b7280', margin: '4px 0 0 0', fontSize: 15 }}>
                        {enrollments.length} kursa kayıtlısınız
                    </p>
                </div>
            </div>

            {enrollments.length === 0 ? (
                <div className="my-courses-empty" style={{ textAlign: 'center', padding: 80, background: 'white', borderRadius: 16, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
                    <div className="empty-icon" style={{ fontSize: 64, marginBottom: 16 }}>📚</div>
                    <h3 style={{ fontSize: 24, color: '#0f0c29', marginBottom: 8 }}>Henüz kurs satın almadınız</h3>
                    <p style={{ color: '#6b7280', marginBottom: 24 }}>Kariyerine yön verecek kursları keşfetmek için</p>
                    <Link to="/courses" className="btn-browse" style={{ padding: '12px 32px', background: 'linear-gradient(135deg, #667eea, #764ba2)', color: 'white', borderRadius: 10, textDecoration: 'none', fontWeight: 600, display: 'inline-block' }}>
                        Kursları Keşfet
                    </Link>
                </div>
            ) : (
                <div className="my-courses-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 24 }}>
                    {enrollments.map((enrollment) => (
                        <div key={enrollment.id} className="my-course-card" style={{
                            background: 'white',
                            borderRadius: 16,
                            overflow: 'hidden',
                            boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
                            transition: 'all 0.3s ease',
                            border: '1px solid rgba(0,0,0,0.04)'
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-6px)'; e.currentTarget.style.boxShadow = '0 16px 48px rgba(0,0,0,0.12)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.06)'; }}>
                            <Link to={`/courses/${enrollment.courseId}`} className="my-course-link" style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
                                {/* Image */}
                                <div className="my-course-image" style={{ position: 'relative', height: 160, overflow: 'hidden', background: 'linear-gradient(135deg, #1e1b4b, #4f46e5)' }}>
                                    {enrollment.courseImage ? (
                                        <img src={enrollment.courseImage} alt={enrollment.courseTitle} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    ) : (
                                        <div className="my-course-placeholder" style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 48, color: 'rgba(255,255,255,0.6)' }}>🎓</div>
                                    )}
                                    {/* Progress Bar */}
                                    <div className="my-course-progress" style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 4, background: 'rgba(0,0,0,0.3)' }}>
                                        <div 
                                            className="my-course-progress-bar" 
                                            style={{ width: `${enrollment.progressPercentage || 0}%`, height: '100%', background: 'linear-gradient(90deg, #667eea, #764ba2)', transition: 'width 0.5s' }}
                                        ></div>
                                    </div>
                                    {/* Status Badge */}
                                    <span style={{ position: 'absolute', top: 12, left: 12, background: enrollment.progressPercentage >= 100 ? '#10b981' : '#3b82f6', color: 'white', padding: '3px 14px', borderRadius: 16, fontSize: 12, fontWeight: 600 }}>
                                        {enrollment.progressPercentage >= 100 ? '✅ Tamamlandı' : '📖 Devam Ediyor'}
                                    </span>
                                    {/* Progress Text */}
                                    <span style={{ position: 'absolute', bottom: 12, right: 12, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', color: 'white', padding: '3px 12px', borderRadius: 12, fontSize: 12, fontWeight: 600 }}>
                                        {enrollment.progressPercentage || 0}%
                                    </span>
                                </div>

                                {/* Body */}
                                <div className="my-course-body" style={{ padding: '16px 20px 20px' }}>
                                    {/* Kurs Başlığı */}
                                    <h3 className="my-course-title" style={{
                                        fontSize: 17,
                                        fontWeight: 600,
                                        color: '#0f0c29',
                                        margin: '0 0 10px 0',
                                        display: '-webkit-box',
                                        WebkitLineClamp: 1,
                                        WebkitBoxOrient: 'vertical',
                                        overflow: 'hidden',
                                        lineHeight: 1.3
                                    }}>{enrollment.courseTitle}</h3>

                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 10,
                                        padding: '6px 0',
                                        marginBottom: 10
                                    }}>
                                        {/* Eğitmen Resmi */}
                                        {enrollment.instructorImage ? (
                                            <img 
                                                src={getImageUrl(enrollment.instructorImage)} 
                                                alt={enrollment.instructorName || 'Eğitmen'}
                                                style={{
                                                    width: 36,
                                                    height: 36,
                                                    borderRadius: '50%',
                                                    objectFit: 'cover',
                                                    border: '2px solid #e2e8f0'
                                                }}
                                                onError={(e) => {
                                                    e.target.style.display = 'none';
                                                    e.target.parentElement.querySelector('.avatar-placeholder').style.display = 'flex';
                                                }}
                                            />
                                        ) : null}
                                        {/* Avatar Placeholder (resim yoksa) */}
                                        <div className="avatar-placeholder" style={{
                                            display: enrollment.instructorImage ? 'none' : 'flex',
                                            width: 36,
                                            height: 36,
                                            borderRadius: '50%',
                                            background: 'linear-gradient(135deg, #667eea, #764ba2)',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: 'white',
                                            fontSize: 14,
                                            fontWeight: 700,
                                            flexShrink: 0
                                        }}>
                                            {getInitials(enrollment.instructorName || enrollment.instructor)}
                                        </div>
                                        
                                        {/* Eğitmen Adı */}
                                        <div style={{ flex: 1 }}>
                                            <div style={{
                                                fontSize: 14,
                                                fontWeight: 600,
                                                color: '#0f0c29'
                                            }}>
                                                {enrollment.instructorName || enrollment.instructor || 'Eğitmen'}
                                            </div>
                                            <div style={{
                                                fontSize: 11,
                                                color: '#94a3b8',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 4
                                            }}>
                                                <FaUserGraduate size={10} /> Eğitmen
                                            </div>
                                        </div>
                                    </div>

                                    {/* Bottom */}
                                    <div className="my-course-bottom" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12, borderTop: '1px solid #f3f4f6' }}>
                                        <span className="my-course-progress-text" style={{ fontSize: 13, color: '#6b7280' }}>
                                            📊 {enrollment.progressPercentage || 0}% tamamlandı
                                        </span>
                                        <span className="my-course-play" style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#667eea', fontWeight: 600, fontSize: 13 }}>
                                            <FaPlayCircle /> Devam Et
                                        </span>
                                    </div>
                                </div>
                            </Link>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default MyCourses;