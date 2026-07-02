import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaSpinner, FaSearch, FaUser, FaStar, FaBookOpen, FaUsers } from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../api/api';

const CourseList = () => {
    const { user } = useAuth();
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const isAuthenticated = !!user;
    const isInstructor = user?.role === 'Instructor' || user?.role === 2;
    const isAdmin = user?.role === 'Admin' || user?.role === 3;

    useEffect(() => {
        fetchCourses();
    }, []);

    const fetchCourses = async () => {
        try {
            setLoading(true);
            const res = await api.get('/course');
            
            const data = res.data.data || [];
            
            if (!isAuthenticated) {
                setCourses(data.filter(c => c.isPublished === true));
            } else {
                setCourses(data);
            }
        } catch (err) {
            console.error('Kurslar yüklenirken hata:', err);
        } finally {
            setLoading(false);
        }
    };

    const filteredCourses = courses.filter(course =>
        course.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.instructorName?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 16 }}>
                <FaSpinner style={{ animation: 'spin 1s linear infinite', color: '#667eea', fontSize: 48 }} />
                <p style={{ color: '#6b7280', fontSize: 16 }}>Kurslar yükleniyor...</p>
                <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    return (
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 20px' }}>
            {/* HEADER */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
                <div>
                    <h1 style={{ fontSize: 28, fontWeight: 700, color: '#0f0c29', margin: 0 }}>📚 Tüm Kurslar</h1>
                    <p style={{ color: '#6b7280', margin: '4px 0 0 0', fontSize: 15 }}>Kariyerine yön verecek kursları keşfet</p>
                </div>
                {(isInstructor || isAdmin) && (
                    <Link to="/courses/create" style={{
                        padding: '10px 24px',
                        background: 'linear-gradient(135deg, #667eea, #764ba2)',
                        color: 'white',
                        border: 'none',
                        borderRadius: 10,
                        fontWeight: 600,
                        fontSize: 14,
                        textDecoration: 'none',
                        transition: 'all 0.3s ease',
                        whiteSpace: 'nowrap'
                    }}
                    onMouseEnter={(e) => { e.target.style.transform = 'translateY(-2px)'; e.target.style.boxShadow = '0 8px 24px rgba(102,126,234,0.3)'; }}
                    onMouseLeave={(e) => { e.target.style.transform = 'translateY(0)'; e.target.style.boxShadow = 'none'; }}>
                        + Yeni Kurs
                    </Link>
                )}
            </div>

            {/* SEARCH */}
            <div style={{ marginBottom: 28 }}>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    background: 'white',
                    border: '2px solid #e5e7eb',
                    borderRadius: 12,
                    padding: '0 16px',
                    maxWidth: 450,
                    transition: 'border-color 0.3s ease'
                }}>
                    <FaSearch style={{ color: '#9ca3af', fontSize: 18, marginRight: 12 }} />
                    <input
                        type="text"
                        placeholder="Kurs ara..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{ flex: 1, border: 'none', outline: 'none', padding: '12px 0', fontSize: 15, background: 'transparent', color: '#1f1f3a' }}
                    />
                </div>
            </div>

            {/* COURSE GRID */}
            {filteredCourses.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '80px 20px', color: '#6b7280' }}>
                    <p style={{ fontSize: 16, marginBottom: 16 }}>Henüz kurs bulunmuyor.</p>
                    {(isInstructor || isAdmin) && (
                        <Link to="/courses/create" style={{
                            display: 'inline-block',
                            padding: '10px 28px',
                            background: 'linear-gradient(135deg, #667eea, #764ba2)',
                            color: 'white',
                            borderRadius: 10,
                            textDecoration: 'none',
                            fontWeight: 600
                        }}>
                            İlk kursu ekleyin
                        </Link>
                    )}
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 24 }}>
                    {filteredCourses.map(course => (
                        <div key={course.id} style={{
                            background: 'white',
                            borderRadius: 16,
                            overflow: 'hidden',
                            boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
                            transition: 'all 0.3s ease',
                            border: '1px solid rgba(0,0,0,0.04)'
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-6px)'; e.currentTarget.style.boxShadow = '0 16px 48px rgba(0,0,0,0.12)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.06)'; }}>
                            <Link to={`/courses/${course.id}`} style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
                                {/* Image */}
                                <div style={{
                                    position: 'relative',
                                    height: 160,
                                    overflow: 'hidden',
                                    background: 'linear-gradient(135deg, #1e1b4b, #4f46e5)'
                                }}>
                                    {course.coverImage ? (
                                        <img src={course.coverImage} alt={course.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    ) : (
                                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 48, color: 'rgba(255,255,255,0.6)' }}>🎓</div>
                                    )}
                                    {course.isFree && <span style={{ position: 'absolute', top: 12, left: 12, background: '#10b981', color: 'white', padding: '3px 14px', borderRadius: 16, fontSize: 12, fontWeight: 600 }}>Ücretsiz</span>}
                                    {course.isPublished ? (
                                        <span style={{ position: 'absolute', top: 12, right: 12, background: '#3b82f6', color: 'white', padding: '3px 14px', borderRadius: 16, fontSize: 12, fontWeight: 600 }}>Yayında</span>
                                    ) : (
                                        <span style={{ position: 'absolute', top: 12, right: 12, background: '#f59e0b', color: 'white', padding: '3px 14px', borderRadius: 16, fontSize: 12, fontWeight: 600 }}>Taslak</span>
                                    )}
                                </div>

                                {/* Body */}
                                <div style={{ padding: '18px 20px 20px' }}>
                                    <h3 style={{
                                        fontSize: 17,
                                        fontWeight: 600,
                                        color: '#0f0c29',
                                        margin: '0 0 8px 0',
                                        display: '-webkit-box',
                                        WebkitLineClamp: 2,
                                        WebkitBoxOrient: 'vertical',
                                        overflow: 'hidden',
                                        lineHeight: 1.3
                                    }}>{course.title}</h3>
                                    <p style={{
                                        color: '#6b7280',
                                        fontSize: 14,
                                        lineHeight: 1.6,
                                        margin: '0 0 12px 0',
                                        display: '-webkit-box',
                                        WebkitLineClamp: 2,
                                        WebkitBoxOrient: 'vertical',
                                        overflow: 'hidden'
                                    }}>{course.shortDescription || course.description?.substring(0, 80) || '...'}</p>

                                    {/* Instructor */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#6b7280', marginBottom: 12 }}>
                                        <FaUser style={{ color: '#667eea', fontSize: 14 }} />
                                        <span style={{ fontWeight: 500, color: '#4b5563' }}>{course.instructorName || 'Bilinmeyen Eğitmen'}</span>
                                        <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4 }}>
                                            <FaUsers style={{ fontSize: 12, color: '#9ca3af' }} />
                                            <span>{course.totalStudents || 0}</span>
                                        </span>
                                    </div>

                               
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12, borderTop: '1px solid #f3f4f6' }}>
                                        <span style={{ fontWeight: 700, fontSize: 18, color: '#0f0c29' }}>
                                            {course.isFree ? 'Ücretsiz' : course.formattedPrice}
                                        </span>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 14, color: '#6b7280' }}>
                                            <FaStar style={{ color: '#f59e0b', fontSize: 14 }} />
                                            <span>{course.averageRating?.toFixed(1) || 'Yeni'}</span>
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

export default CourseList;