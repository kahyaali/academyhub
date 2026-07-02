import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { FaSpinner, FaPlay, FaLock, FaCheckCircle, FaClock, FaExclamationTriangle, FaArrowLeft } from 'react-icons/fa';
import { examApi } from '../../api/api';
import Swal from 'sweetalert2';
import api from '../../api/api';

const ExamList = () => {
    const { courseId } = useParams();
    const navigate = useNavigate();
    const [exams, setExams] = useState([]);
    const [loading, setLoading] = useState(true);
    const [enrollmentId, setEnrollmentId] = useState(null);
    const [isCompleted, setIsCompleted] = useState(false);

    useEffect(() => {
        fetchExams();
        fetchEnrollment();
    }, [courseId]);

    const fetchExams = async () => {
        try {
            setLoading(true);
            const res = await examApi.getExamsByCourse(courseId);
            console.log('📦 Sınavlar:', res.data);
            setExams(res.data.data || []);
        } catch (err) {
            console.error('Sınavlar yüklenirken hata:', err);
        } finally {
            setLoading(false);
        }
    };

  const fetchEnrollment = async () => {
    try {
        console.log('📌 CourseId:', courseId);
        const res = await api.get('/enrollment/student');
        console.log('📦 Tüm kayıtlar:', res.data.data);
        
        const enrollment = res.data.data.find(e => e.courseId === parseInt(courseId));
        console.log('📌 Bulunan enrollment:', enrollment);
        
        if (enrollment) {
            setEnrollmentId(enrollment.id);
            
            // 🔥 PROGRESS'İ KONTROL ET - EĞER TANIMLI DEĞİLSE 0 OLARAK AL
            const progress = enrollment.progressPercentage || 0;
            console.log('📊 ProgressPercentage:', progress);
            console.log('📊 >= 100?', progress >= 100);
            
            // 🔥 EĞER STATUS COMPLETED İSE OTOMATİK TRUE YAP
            const isCompleted = progress >= 100 || enrollment.status === 'Completed';
            setIsCompleted(isCompleted);
            console.log('✅ isCompleted:', isCompleted);
        } else {
            console.log('❌ Enrollment BULUNAMADI!');
            setIsCompleted(false);
        }
    } catch (err) {
        console.error('Kayıt bilgisi alınamadı:', err);
        setIsCompleted(false);
    }
};

    const handleStartExam = async (examId) => {
        // Dersler tamamlanmamışsa uyarı ver
        if (!isCompleted) {
            Swal.fire({
                icon: 'warning',
                title: '⚠️ Dersleri Tamamlayın!',
                text: 'Sınava girebilmek için önce tüm dersleri tamamlamalısınız.',
                confirmButtonColor: '#667eea',
                confirmButtonText: 'Tamam'
            });
            return;
        }

        try {
            const res = await examApi.startExam(examId);
            const data = res.data.data;
            
            // Sınav sayfasına yönlendir
            navigate(`/exam/take/${data.examResultId}`, {
                state: {
                    examResultId: data.examResultId,
                    examId: data.examId,
                    examTitle: data.examTitle,
                    durationMinutes: data.durationMinutes,
                    startTime: data.startTime,
                    endTime: data.endTime,
                    questions: data.questions,
                    totalQuestions: data.totalQuestions,
                    totalPoints: data.totalPoints
                }
            });
        } catch (err) {
            Swal.fire({
                icon: 'error',
                title: 'Hata!',
                text: err.response?.data?.message || 'Sınav başlatılamadı',
                confirmButtonColor: '#ef4444'
            });
        }
    };

    if (loading) {
        return (
            <div style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                justifyContent: 'center', 
                minHeight: '60vh',
                gap: 16
            }}>
                <FaSpinner style={{ animation: 'spin 1s linear infinite', color: '#667eea', fontSize: 48 }} />
                <p style={{ color: '#6b7280' }}>Sınavlar yükleniyor...</p>
                <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    return (
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px 20px' }}>
            {/* Geri Butonu */}
            <Link 
                to={`/courses/${courseId}`}
                style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    color: '#6b7280',
                    textDecoration: 'none',
                    fontSize: 14,
                    fontWeight: 500,
                    marginBottom: 24,
                    padding: '8px 16px',
                    borderRadius: 10,
                    background: 'white',
                    border: '1px solid #e5e7eb',
                    transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#667eea';
                    e.currentTarget.style.color = '#667eea';
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#e5e7eb';
                    e.currentTarget.style.color = '#6b7280';
                }}
            >
                <FaArrowLeft size={14} /> Kursa Dön
            </Link>

            {/* Header */}
            <div style={{ marginBottom: 32 }}>
                <h1 style={{ 
                    fontSize: 28, 
                    fontWeight: 700, 
                    color: '#0f0c29',
                    margin: 0,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12
                }}>
                    📝 Sınavlar
                </h1>
                <p style={{ color: '#6b7280', marginTop: 4 }}>
                    {exams.length > 0 
                        ? `Bu kurs için ${exams.length} sınav bulunuyor.` 
                        : 'Bu kurs için henüz sınav oluşturulmamış.'
                    }
                </p>
            </div>

            {/* Ders Tamamlama Durumu */}
            <div style={{
                background: isCompleted ? '#d1fae5' : '#fef3c7',
                border: `1px solid ${isCompleted ? '#10b981' : '#f59e0b'}`,
                borderRadius: 12,
                padding: '14px 20px',
                marginBottom: 24,
                display: 'flex',
                alignItems: 'center',
                gap: 12
            }}>
                {isCompleted ? (
                    <>
                        <FaCheckCircle style={{ color: '#10b981', fontSize: 20 }} />
                        <span style={{ color: '#065f46', fontWeight: 600 }}>
                            ✅ Tüm dersleri tamamladın! Sınava girebilirsin.
                        </span>
                    </>
                ) : (
                    <>
                        <FaExclamationTriangle style={{ color: '#f59e0b', fontSize: 20 }} />
                        <span style={{ color: '#92400e', fontWeight: 600 }}>
                            ⚠️ Sınava girebilmek için önce tüm dersleri tamamlamalısın.
                        </span>
                    </>
                )}
            </div>

            {/* Sınav Listesi */}
            {exams.length === 0 ? (
                <div style={{
                    textAlign: 'center',
                    padding: '60px 20px',
                    background: 'white',
                    borderRadius: 16,
                    boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
                    border: '1px solid rgba(0,0,0,0.04)'
                }}>
                    <div style={{ fontSize: 64, marginBottom: 16 }}>📝</div>
                    <h3 style={{ fontSize: 20, color: '#0f0c29', marginBottom: 8 }}>Henüz sınav yok</h3>
                    <p style={{ color: '#6b7280', marginBottom: 16 }}>
                        Bu kurs için henüz sınav oluşturulmamış.
                    </p>
                    <Link 
                        to={`/courses/${courseId}`}
                        style={{
                            padding: '10px 28px',
                            background: 'linear-gradient(135deg, #667eea, #764ba2)',
                            color: 'white',
                            borderRadius: 10,
                            textDecoration: 'none',
                            fontWeight: 600,
                            display: 'inline-block'
                        }}
                    >
                        Kursa Dön
                    </Link>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16 }}>
                    {exams.map((exam, index) => (
                        <div 
                            key={exam.id} 
                            style={{
                                background: 'white',
                                borderRadius: 16,
                                padding: '20px 24px',
                                boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
                                border: '1px solid rgba(0,0,0,0.04)',
                                transition: 'all 0.3s ease',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                flexWrap: 'wrap',
                                gap: 12
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateY(-2px)';
                                e.currentTarget.style.boxShadow = '0 8px 30px rgba(0,0,0,0.08)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.04)';
                            }}
                        >
                            <div style={{ flex: 1, minWidth: 200 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                                    <h3 style={{ fontSize: 17, fontWeight: 600, color: '#0f0c29', margin: 0 }}>
                                        {exam.title}
                                    </h3>
                                    <span style={{
                                        padding: '2px 12px',
                                        borderRadius: 12,
                                        fontSize: 11,
                                        fontWeight: 600,
                                        background: exam.isPublished ? '#d1fae5' : '#fef3c7',
                                        color: exam.isPublished ? '#10b981' : '#f59e0b'
                                    }}>
                                        {exam.isPublished ? '✅ Yayında' : '📝 Taslak'}
                                    </span>
                                </div>
                                {exam.description && (
                                    <p style={{ fontSize: 14, color: '#6b7280', margin: '4px 0 0 0' }}>
                                        {exam.description}
                                    </p>
                                )}
                                <div style={{ display: 'flex', gap: 16, marginTop: 8, flexWrap: 'wrap' }}>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, color: '#6b7280' }}>
                                        <FaClock size={14} /> {exam.durationMinutes} dk
                                    </span>
                                    <span style={{ fontSize: 13, color: '#6b7280' }}>
                                        📊 {exam.passingScore} puan
                                    </span>
                                    <span style={{ fontSize: 13, color: '#6b7280' }}>
                                        📝 {exam.questionCount || 0} soru
                                    </span>
                                </div>
                            </div>

                            <button
                                onClick={() => handleStartExam(exam.id)}
                                disabled={!exam.isPublished || !isCompleted}
                                style={{
                                    padding: '10px 24px',
                                    border: 'none',
                                    borderRadius: 10,
                                    fontWeight: 600,
                                    fontSize: 14,
                                    cursor: exam.isPublished && isCompleted ? 'pointer' : 'not-allowed',
                                    transition: 'all 0.3s ease',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 8,
                                    background: exam.isPublished && isCompleted 
                                        ? 'linear-gradient(135deg, #667eea, #764ba2)' 
                                        : '#e5e7eb',
                                    color: exam.isPublished && isCompleted ? 'white' : '#9ca3af',
                                    boxShadow: exam.isPublished && isCompleted 
                                        ? '0 4px 14px rgba(102,126,234,0.3)' 
                                        : 'none'
                                }}
                                onMouseEnter={(e) => {
                                    if (exam.isPublished && isCompleted) {
                                        e.currentTarget.style.transform = 'translateY(-2px)';
                                        e.currentTarget.style.boxShadow = '0 8px 24px rgba(102,126,234,0.4)';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (exam.isPublished && isCompleted) {
                                        e.currentTarget.style.transform = 'translateY(0)';
                                        e.currentTarget.style.boxShadow = '0 4px 14px rgba(102,126,234,0.3)';
                                    }
                                }}
                            >
                                {!exam.isPublished ? (
                                    <>
                                        <FaLock /> Yayınlanmamış
                                    </>
                                ) : !isCompleted ? (
                                    <>
                                        <FaLock /> Dersleri Bitir
                                    </>
                                ) : (
                                    <>
                                        <FaPlay /> Sınava Başla
                                    </>
                                )}
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ExamList;