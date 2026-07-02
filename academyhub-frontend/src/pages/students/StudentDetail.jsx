import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaSpinner, FaEnvelope, FaPhone, FaMapMarker, FaCalendar, FaBook, FaGraduationCap } from 'react-icons/fa';
import Swal from 'sweetalert2';
import api from '../../api/api';

const StudentDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [student, setStudent] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStudent();
    }, [id]);

    const fetchStudent = async () => {
        try {
            // 1. Tüm öğrencileri getir
            const res = await api.get('/user/students');
            const students = res.data.data || [];
            const studentData = students.find(s => s.id === parseInt(id));
            
            if (!studentData) {
                throw new Error('Öğrenci bulunamadı');
            }
            
            // 2. User bilgilerini getir
            const userId = studentData.userId || studentData.id;
            const userRes = await api.get(`/user/${userId}`);
            const userData = userRes.data.data;
            
            // 3. Öğrencinin kayıtlarını getir
            let totalEnrollments = 0;
            let completedCourses = 0;
            let averageProgress = 0;
            
            try {
                const enrollRes = await api.get(`/enrollment/student/${studentData.id}`);
                const enrollments = enrollRes.data.data || [];
                console.log('Öğrencinin kayıtları:', enrollments);
                
                totalEnrollments = enrollments.length;
                
                const completed = enrollments.filter(e => e.status === 3 || e.status === 'Completed');
                completedCourses = completed.length;
                
                if (totalEnrollments > 0) {
                    const totalProgress = enrollments.reduce((sum, e) => sum + (e.progressPercentage || 0), 0);
                    averageProgress = Math.round(totalProgress / totalEnrollments);
                }
                
                console.log('Toplam Kayıt:', totalEnrollments);
                console.log('Tamamlanan Kurs:', completedCourses);
                console.log('Ortalama İlerleme:', averageProgress);
                
            } catch (err) {
                console.warn('Kayıtlar alınamadı:', err);
                totalEnrollments = studentData.totalEnrollments || 0;
                completedCourses = studentData.completedCourses || 0;
                averageProgress = studentData.averageProgress || 0;
            }
            
            // 4. Verileri birleştir
            setStudent({
                id: studentData.id,
                userId: studentData.userId,
                firstName: studentData.firstName || '',
                lastName: studentData.lastName || '',
                email: userData.email || studentData.email || '',
                phoneNumber: userData.phoneNumber || studentData.phoneNumber || '',
                address: userData.address || studentData.address || '',
                isActive: userData.isActive !== undefined ? userData.isActive : true,
                totalEnrollments: totalEnrollments,
                completedCourses: completedCourses,
                averageProgress: averageProgress,
                createdDate: userData.createdDate || studentData.createdDate || new Date().toISOString()
            });
            
        } catch (err) {
            console.error('Öğrenci detayı yüklenirken hata:', err);
            Swal.fire({
                icon: 'error',
                title: 'Hata!',
                text: 'Öğrenci bilgileri yüklenemedi!',
                confirmButtonColor: '#ef4444'
            });
            navigate('/students');
        } finally {
            setLoading(false);
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
                <p style={{ color: '#6c757d', fontSize: 16 }}>Öğrenci bilgileri yükleniyor...</p>
            </div>
        );
    }

    if (!student) return null;

    return (
        <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <Link to="/students" style={{
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
                        <h1 style={{ fontSize: 28, margin: 0, color: '#1a1a2e' }}>👨‍🎓 Öğrenci Detayı</h1>
                        <p style={{ color: '#6c757d', margin: 4, fontSize: 14 }}>Öğrenci bilgilerini görüntüleyin</p>
                    </div>
                </div>
            </div>

            <div style={{
                background: 'white',
                borderRadius: 16,
                padding: 32,
                boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                border: '1px solid #f0f0f0'
            }}>
                <div style={{ display: 'flex', gap: 32, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                    <div style={{
                        width: 120,
                        height: 120,
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #667eea, #764ba2)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 48,
                        color: 'white',
                        flexShrink: 0,
                        boxShadow: '0 4px 20px rgba(102, 126, 234, 0.3)'
                    }}>
                        {student.firstName?.charAt(0)}{student.lastName?.charAt(0)}
                    </div>

                    <div style={{ flex: 1, minWidth: 250 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 4 }}>
                            <h2 style={{ margin: 0, fontSize: 24, color: '#1a1a2e' }}>{student.firstName} {student.lastName}</h2>
                            <span style={{
                                background: student.isActive ? '#d1fae5' : '#fee2e2',
                                color: student.isActive ? '#065f46' : '#991b1b',
                                padding: '4px 14px',
                                borderRadius: 20,
                                fontSize: 13,
                                fontWeight: 600
                            }}>
                                {student.isActive ? '✅ Aktif' : '❌ Pasif'}
                            </span>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12, marginTop: 16 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#4a4a6a' }}>
                                <FaEnvelope style={{ color: '#667eea', fontSize: 16 }} />
                                <span style={{ fontSize: 14 }}>{student.email}</span>
                            </div>
                            {student.phoneNumber && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#4a4a6a' }}>
                                    <FaPhone style={{ color: '#667eea', fontSize: 16 }} />
                                    <span style={{ fontSize: 14 }}>{student.phoneNumber}</span>
                                </div>
                            )}
                            {student.address && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#4a4a6a' }}>
                                    <FaMapMarker style={{ color: '#667eea', fontSize: 16 }} />
                                    <span style={{ fontSize: 14 }}>{student.address}</span>
                                </div>
                            )}
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#4a4a6a' }}>
                                <FaCalendar style={{ color: '#667eea', fontSize: 16 }} />
                                <span style={{ fontSize: 14 }}>
                                    Kayıt: {new Date(student.createdDate).toLocaleDateString('tr-TR')}
                                </span>
                            </div>
                        </div>
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
                    <div style={{
                        background: 'white',
                        borderRadius: 12,
                        padding: '20px 24px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                        border: '1px solid #f0f0f0',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 16
                    }}>
                        <div style={{
                            width: 50,
                            height: 50,
                            borderRadius: 12,
                            background: 'linear-gradient(135deg, #667eea, #764ba2)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            fontSize: 20
                        }}>
                            <FaBook />
                        </div>
                        <div>
                            <div style={{ fontSize: 24, fontWeight: 700, color: '#1a1a2e' }}>
                                {student.totalEnrollments || 0}
                            </div>
                            <div style={{ fontSize: 14, color: '#6c757d' }}>Toplam Kayıt</div>
                        </div>
                    </div>

                    <div style={{
                        background: 'white',
                        borderRadius: 12,
                        padding: '20px 24px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                        border: '1px solid #f0f0f0',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 16
                    }}>
                        <div style={{
                            width: 50,
                            height: 50,
                            borderRadius: 12,
                            background: 'linear-gradient(135deg, #10b981, #059669)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            fontSize: 20
                        }}>
                            <FaGraduationCap />
                        </div>
                        <div>
                            <div style={{ fontSize: 24, fontWeight: 700, color: '#1a1a2e' }}>
                                {student.completedCourses || 0}
                            </div>
                            <div style={{ fontSize: 14, color: '#6c757d' }}>Tamamlanan Kurs</div>
                        </div>
                    </div>

                    <div style={{
                        background: 'white',
                        borderRadius: 12,
                        padding: '20px 24px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                        border: '1px solid #f0f0f0',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 16
                    }}>
                        <div style={{
                            width: 50,
                            height: 50,
                            borderRadius: 12,
                            background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            fontSize: 20
                        }}>
                            📊
                        </div>
                        <div>
                            <div style={{ fontSize: 24, fontWeight: 700, color: '#1a1a2e' }}>
                                {student.averageProgress || 0}%
                            </div>
                            <div style={{ fontSize: 14, color: '#6c757d' }}>Ortalama İlerleme</div>
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </>
    );
};

export default StudentDetail;