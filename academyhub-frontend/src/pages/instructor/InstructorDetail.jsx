import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
    FaArrowLeft, FaEdit, FaTrash, FaSpinner, 
    FaEnvelope, FaUser, FaBook, FaStar, FaPhone,
    FaGraduationCap, FaAward, FaCalendarAlt, FaCheckCircle,
    FaTimesCircle, FaExternalLinkAlt, FaUserGraduate
} from 'react-icons/fa';
import Swal from 'sweetalert2';
import api from '../../api/api';

const InstructorDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [instructor, setInstructor] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchInstructor();
    }, [id]);

const fetchInstructor = async () => {
    try {

        const res = await api.get('/user/instructors');
        const instructors = res.data.data || [];
        const instructorData = instructors.find(inst => inst.id === parseInt(id));
        
        if (!instructorData) {
            throw new Error('Eğitmen bulunamadı');
        }
        
        console.log('📊 Gelen eğitmen verisi:', instructorData);
        console.log('✅ TotalReviews:', instructorData.totalReviews);
        console.log('✅ AverageRating:', instructorData.averageRating);
        
  
        const userId = instructorData.userId;
        const userRes = await api.get(`/user/${userId}`);
        const userData = userRes.data.data;
        
    
        setInstructor({
            id: instructorData.id,
            userId: instructorData.userId,
            firstName: instructorData.firstName,
            lastName: instructorData.lastName,
            email: instructorData.email,
            phoneNumber: userData.phoneNumber || instructorData.phoneNumber || '',
            expertise: instructorData.expertise || '',
            bio: instructorData.bio || '',
            profileImage: instructorData.profileImage || '',
            isActive: userData.isActive !== undefined ? userData.isActive : true,
            totalCourses: instructorData.totalCourses || 0,
            totalStudents: instructorData.totalStudents || 0,
            totalReviews: instructorData.totalReviews || 0,    
            averageRating: instructorData.averageRating || 0,   
            createdDate: userData.createdDate || new Date().toISOString()
        });
        
    } catch (err) {
        console.error('Eğitmen detayı yüklenirken hata:', err);
        Swal.fire({
            icon: 'error',
            title: 'Hata!',
            text: 'Eğitmen bilgileri yüklenemedi!',
            confirmButtonColor: '#ef4444'
        });
        navigate('/instructors');
    } finally {
        setLoading(false);
    }
};

    const handleDelete = async () => {
        const result = await Swal.fire({
            title: 'Emin misiniz?',
            text: `${instructor?.firstName} ${instructor?.lastName} adlı eğitmeni silmek istediğinize emin misiniz?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#6c757d',
            confirmButtonText: 'Evet, sil!',
            cancelButtonText: 'Vazgeç'
        });

        if (result.isConfirmed) {
            try {
               
                await api.delete(`/user/${instructor.userId}`);
                Swal.fire({
                    icon: 'success',
                    title: 'Silindi!',
                    text: 'Eğitmen başarıyla silindi.',
                    timer: 2000,
                    showConfirmButton: false
                });
                navigate('/instructors');
            } catch (err) {
                Swal.fire({
                    icon: 'error',
                    title: 'Hata!',
                    text: err.response?.data?.message || 'Eğitmen silinirken hata oluştu!',
                    confirmButtonColor: '#ef4444'
                });
            }
        }
    };

    if (loading) {
        return (
            <div style={{ 
                display: 'flex', 
                flexDirection: 'column',
                justifyContent: 'center', 
                alignItems: 'center', 
                height: '50vh',
                gap: 20
            }}>
                <FaSpinner size={50} style={{ 
                    animation: 'spin 1s linear infinite',
                    color: '#667eea'
                }} />
                <p style={{ color: '#6c757d', fontSize: 16 }}>Eğitmen bilgileri yükleniyor...</p>
            </div>
        );
    }

    if (!instructor) return null;

    // Stat card component
    const StatCard = ({ icon, label, value, color }) => (
        <div style={{
            background: 'white',
            borderRadius: 12,
            padding: '20px 24px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
            border: '1px solid #f0f0f0',
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            transition: 'all 0.3s ease',
            cursor: 'default'
        }}
        onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)';
            e.currentTarget.style.transform = 'translateY(-2px)';
        }}
        onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)';
            e.currentTarget.style.transform = 'translateY(0)';
        }}
        >
            <div style={{
                width: 50,
                height: 50,
                borderRadius: 12,
                background: color,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: 20,
                flexShrink: 0
            }}>
                {icon}
            </div>
            <div>
                <div style={{ fontSize: 24, fontWeight: 700, color: '#1a1a2e' }}>
                    {value}
                </div>
                <div style={{ fontSize: 14, color: '#6c757d' }}>
                    {label}
                </div>
            </div>
        </div>
    );

    return (
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
            {/* Header */}
            <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                marginBottom: 28,
                flexWrap: 'wrap',
                gap: 16
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <Link to="/instructors" style={{
                        width: 44,
                        height: 44,
                        borderRadius: '50%',
                        background: '#f8f9fa',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#6c757d',
                        fontSize: 18,
                        transition: 'all 0.3s ease',
                        textDecoration: 'none'
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#667eea';
                        e.currentTarget.style.color = 'white';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.background = '#f8f9fa';
                        e.currentTarget.style.color = '#6c757d';
                    }}
                    >
                        <FaArrowLeft />
                    </Link>
                    <div>
                        <h1 style={{ fontSize: 28, margin: 0, color: '#1a1a2e' }}>
                            👨‍🏫 Eğitmen Detayı
                        </h1>
                        <p style={{ color: '#6c757d', margin: 4, fontSize: 14 }}>
                            Eğitmen bilgilerini görüntüleyin ve yönetin
                        </p>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                    <Link to={`/instructors/edit/${instructor.id}`} style={{
                        background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                        color: 'white',
                        border: 'none',
                        padding: '10px 20px',
                        borderRadius: 10,
                        textDecoration: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        fontSize: 14,
                        fontWeight: 600,
                        transition: 'all 0.3s ease',
                        boxShadow: '0 2px 8px rgba(245, 158, 11, 0.3)'
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 4px 16px rgba(245, 158, 11, 0.4)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 2px 8px rgba(245, 158, 11, 0.3)';
                    }}
                    >
                        <FaEdit /> Düzenle
                    </Link>
                    <button onClick={handleDelete} style={{
                        background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                        color: 'white',
                        border: 'none',
                        padding: '10px 20px',
                        borderRadius: 10,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        fontSize: 14,
                        fontWeight: 600,
                        transition: 'all 0.3s ease',
                        boxShadow: '0 2px 8px rgba(239, 68, 68, 0.3)'
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 4px 16px rgba(239, 68, 68, 0.4)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 2px 8px rgba(239, 68, 68, 0.3)';
                    }}
                    >
                        <FaTrash /> Sil
                    </button>
                </div>
            </div>

            {/* Main Card */}
            <div style={{
                background: 'white',
                borderRadius: 16,
                padding: 32,
                boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                border: '1px solid #f0f0f0'
            }}>
                {/* Profile Section */}
                <div style={{ 
                    display: 'flex', 
                    gap: 32, 
                    alignItems: 'flex-start',
                    flexWrap: 'wrap'
                }}>
                    {/* Avatar */}
                    <div style={{
                        position: 'relative',
                        flexShrink: 0
                    }}>
                        <div style={{
                            width: 130,
                            height: 130,
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 52,
                            color: 'white',
                            fontWeight: 700,
                            boxShadow: '0 4px 20px rgba(102, 126, 234, 0.3)'
                        }}>
                            {instructor.firstName?.charAt(0)}{instructor.lastName?.charAt(0)}
                        </div>
                        <div style={{
                            position: 'absolute',
                            bottom: 4,
                            right: 4,
                            background: instructor.isActive ? '#10b981' : '#ef4444',
                            width: 20,
                            height: 20,
                            borderRadius: '50%',
                            border: '3px solid white',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                        }} />
                    </div>

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 250 }}>
                        <div style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: 12, 
                            flexWrap: 'wrap',
                            marginBottom: 4
                        }}>
                            <h2 style={{ margin: 0, fontSize: 28, color: '#1a1a2e' }}>
                                {instructor.firstName} {instructor.lastName}
                            </h2>
                            <span style={{
                                background: instructor.isActive ? '#d1fae5' : '#fee2e2',
                                color: instructor.isActive ? '#065f46' : '#991b1b',
                                padding: '4px 14px',
                                borderRadius: 20,
                                fontSize: 13,
                                fontWeight: 600,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 6
                            }}>
                                {instructor.isActive ? (
                                    <><FaCheckCircle size={12} /> Aktif</>
                                ) : (
                                    <><FaTimesCircle size={12} /> Pasif</>
                                )}
                            </span>
                        </div>

                        <div style={{ 
                            display: 'grid', 
                            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                            gap: 12,
                            marginTop: 16
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#4a4a6a' }}>
                                <FaEnvelope style={{ color: '#667eea', fontSize: 16 }} />
                                <span style={{ fontSize: 14 }}>{instructor.email}</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#4a4a6a' }}>
                                <FaPhone style={{ color: '#667eea', fontSize: 16 }} />
                                <span style={{ fontSize: 14 }}>{instructor.phoneNumber || 'Belirtilmemiş'}</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#4a4a6a' }}>
                                <FaUserGraduate style={{ color: '#667eea', fontSize: 16 }} />
                                <span style={{ fontSize: 14 }}>
                                    Uzmanlık: <strong>{instructor.expertise || 'Belirtilmemiş'}</strong>
                                </span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#4a4a6a' }}>
                                <FaCalendarAlt style={{ color: '#667eea', fontSize: 16 }} />
                                <span style={{ fontSize: 14 }}>
                                    Kayıt: {new Date(instructor.createdDate).toLocaleDateString('tr-TR')}
                                </span>
                            </div>
                        </div>

                        {instructor.bio && (
                            <div style={{ 
                                marginTop: 16, 
                                padding: 16,
                                background: '#f8f9fa',
                                borderRadius: 10,
                                border: '1px solid #e9ecef'
                            }}>
                                <h4 style={{ margin: 0, marginBottom: 6, fontSize: 14, color: '#4a4a6a' }}>
                                    📝 Biyografi
                                </h4>
                                <p style={{ color: '#6c757d', margin: 0, fontSize: 14, lineHeight: 1.6 }}>
                                    {instructor.bio}
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Stats Grid */}
                <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: 16,
                    marginTop: 32,
                    paddingTop: 32,
                    borderTop: '1px solid #f0f0f0'
                }}>
                    <StatCard 
                        icon={<FaBook />}
                        label="Toplam Kurs"
                        value={instructor.totalCourses || 0}
                        color="linear-gradient(135deg, #667eea, #764ba2)"
                    />
                    <StatCard 
                        icon={<FaUserGraduate />}
                        label="Toplam Öğrenci"
                        value={instructor.totalStudents || 0}
                        color="linear-gradient(135deg, #10b981, #059669)"
                    />
                    <StatCard 
                        icon={<FaStar />}
                        label="Ortalama Puan"
                        value={instructor.averageRating ? instructor.averageRating.toFixed(1) : '0'}
                        color="linear-gradient(135deg, #f59e0b, #d97706)"
                    />
                    <StatCard 
                        icon={<FaAward />}
                        label="Toplam Yorum"
                        value={instructor.totalReviews || 0}
                        color="linear-gradient(135deg, #8b5cf6, #7c3aed)"
                    />
                </div>

                {/* Quick Actions */}
                <div style={{
                    marginTop: 28,
                    paddingTop: 24,
                    borderTop: '1px solid #f0f0f0',
                    display: 'flex',
                    gap: 12,
                    flexWrap: 'wrap'
                }}>
                    <Link to={`/instructors/${instructor.id}/courses`} style={{
                        background: '#f8f9fa',
                        color: '#4a4a6a',
                        padding: '8px 16px',
                        borderRadius: 8,
                        textDecoration: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        fontSize: 14,
                        transition: 'all 0.3s ease',
                        border: '1px solid #e9ecef'
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#667eea';
                        e.currentTarget.style.color = 'white';
                        e.currentTarget.style.borderColor = '#667eea';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.background = '#f8f9fa';
                        e.currentTarget.style.color = '#4a4a6a';
                        e.currentTarget.style.borderColor = '#e9ecef';
                    }}
                    >
                        <FaExternalLinkAlt size={12} /> Kursları Görüntüle
                    </Link>
                    <Link to={`/instructors/${instructor.id}/students`} style={{
                        background: '#f8f9fa',
                        color: '#4a4a6a',
                        padding: '8px 16px',
                        borderRadius: 8,
                        textDecoration: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        fontSize: 14,
                        transition: 'all 0.3s ease',
                        border: '1px solid #e9ecef'
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#10b981';
                        e.currentTarget.style.color = 'white';
                        e.currentTarget.style.borderColor = '#10b981';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.background = '#f8f9fa';
                        e.currentTarget.style.color = '#4a4a6a';
                        e.currentTarget.style.borderColor = '#e9ecef';
                    }}
                    >
                        <FaUserGraduate size={12} /> Öğrencileri Görüntüle
                    </Link>
                </div>
            </div>

            {/* CSS for spin animation */}
            <style>{`
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
};

export default InstructorDetail;