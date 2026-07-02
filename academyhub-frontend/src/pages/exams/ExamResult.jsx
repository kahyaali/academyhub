import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { FaCheckCircle, FaTimesCircle, FaAward, FaArrowLeft, FaDownload } from 'react-icons/fa';

const ExamResult = () => {
    const location = useLocation();
    const result = location.state?.result;

    if (!result) {
        return (
            <div style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                justifyContent: 'center', 
                minHeight: '60vh',
                gap: 16
            }}>
                <p style={{ color: '#6b7280' }}>Sonuç bulunamadı</p>
                <Link to="/courses" style={{
                    padding: '10px 24px',
                    background: 'linear-gradient(135deg, #667eea, #764ba2)',
                    color: 'white',
                    borderRadius: 10,
                    textDecoration: 'none',
                    fontWeight: 600
                }}>
                    Kurslara Dön
                </Link>
            </div>
        );
    }

    const percentage = Math.round((result.score / result.totalPoints) * 100);
    const passed = result.isPassed;

    return (
        <div style={{ 
            maxWidth: 600, 
            margin: '0 auto', 
            padding: '24px 20px',
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#f8fafc'
        }}>
            <div style={{
                width: '100%',
                background: 'white',
                borderRadius: 20,
                padding: '40px 32px',
                boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
                border: '1px solid rgba(0,0,0,0.04)',
                textAlign: 'center'
            }}>
                {/* Icon */}
                <div style={{
                    width: 80,
                    height: 80,
                    borderRadius: '50%',
                    margin: '0 auto 20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 36,
                    background: passed ? '#d1fae5' : '#fee2e2',
                    color: passed ? '#10b981' : '#ef4444'
                }}>
                    {passed ? <FaCheckCircle /> : <FaTimesCircle />}
                </div>

                {/* Title */}
                <h1 style={{
                    fontSize: 24,
                    fontWeight: 700,
                    color: passed ? '#10b981' : '#ef4444',
                    margin: 0,
                    marginBottom: 4
                }}>
                    {passed ? '🎉 Sınavı Geçtiniz!' : '😞 Maalesef Geçemediniz'}
                </h1>
                <p style={{ color: '#6b7280', fontSize: 14, marginBottom: 24 }}>
                    {passed 
                        ? 'Tebrikler! Sınavı başarıyla tamamladınız.' 
                        : 'Bir sonraki denemede başarılı olacağınıza inanıyoruz.'
                    }
                </p>

                {/* Stats Grid */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: 12,
                    marginBottom: 24
                }}>
                    <div style={{
                        background: '#f8fafc',
                        padding: '12px 16px',
                        borderRadius: 10
                    }}>
                        <p style={{ fontSize: 11, color: '#6b7280', margin: 0 }}>Puan</p>
                        <p style={{ fontSize: 20, fontWeight: 700, color: '#0f0c29', margin: 0 }}>
                            {result.score} / {result.totalPoints}
                        </p>
                    </div>
                    <div style={{
                        background: '#f8fafc',
                        padding: '12px 16px',
                        borderRadius: 10
                    }}>
                        <p style={{ fontSize: 11, color: '#6b7280', margin: 0 }}>Başarı Yüzdesi</p>
                        <p style={{ fontSize: 20, fontWeight: 700, color: '#0f0c29', margin: 0 }}>
                            {percentage}%
                        </p>
                    </div>
                    <div style={{
                        background: '#f8fafc',
                        padding: '12px 16px',
                        borderRadius: 10
                    }}>
                        <p style={{ fontSize: 11, color: '#6b7280', margin: 0 }}>Doğru / Yanlış</p>
                        <p style={{ fontSize: 20, fontWeight: 700, color: '#0f0c29', margin: 0 }}>
                            {result.correctAnswers} / {result.wrongAnswers}
                        </p>
                    </div>
                    <div style={{
                        background: '#f8fafc',
                        padding: '12px 16px',
                        borderRadius: 10
                    }}>
                        <p style={{ fontSize: 11, color: '#6b7280', margin: 0 }}>Geçme Notu</p>
                        <p style={{ fontSize: 20, fontWeight: 700, color: '#0f0c29', margin: 0 }}>
                            {result.exam?.passingScore || 70}%
                        </p>
                    </div>
                </div>

                {/* Certificate Badge */}
                {passed && (
                    <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 8,
                        background: '#d1fae5',
                        color: '#10b981',
                        padding: '8px 20px',
                        borderRadius: 20,
                        fontSize: 14,
                        fontWeight: 600,
                        marginBottom: 24
                    }}>
                        <FaAward /> Sertifika Kazandınız! 🎓
                    </div>
                )}

                {/* Buttons */}
                <div style={{
                    display: 'flex',
                    gap: 12,
                    justifyContent: 'center',
                    flexWrap: 'wrap'
                }}>
                    <Link to="/courses" style={{
                        padding: '10px 24px',
                        background: '#f1f5f9',
                        color: '#1f2937',
                        borderRadius: 10,
                        textDecoration: 'none',
                        fontWeight: 600,
                        fontSize: 14,
                        transition: 'all 0.3s ease',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 8
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#e5e7eb';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.background = '#f1f5f9';
                    }}>
                        <FaArrowLeft size={14} /> Kurslara Dön
                    </Link>
                    
                    {passed && (
                        <Link to="/certificates" style={{
                            padding: '10px 24px',
                            background: 'linear-gradient(135deg, #667eea, #764ba2)',
                            color: 'white',
                            borderRadius: 10,
                            textDecoration: 'none',
                            fontWeight: 600,
                            fontSize: 14,
                            transition: 'all 0.3s ease',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 8,
                            boxShadow: '0 4px 14px rgba(102,126,234,0.3)'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-2px)';
                            e.currentTarget.style.boxShadow = '0 8px 24px rgba(102,126,234,0.4)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = '0 4px 14px rgba(102,126,234,0.3)';
                        }}>
                            <FaAward size={14} /> Sertifikalarım
                        </Link>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ExamResult;