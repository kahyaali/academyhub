// pages/certificates/CertificateDetail.jsx
import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { FaSpinner, FaCertificate, FaDownload, FaCheckCircle, FaArrowLeft } from 'react-icons/fa';
import { certificateApi } from '../../api/api';
import { useAuth } from '../../contexts/AuthContext';

const CertificateDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [certificate, setCertificate] = useState(null);
    const [loading, setLoading] = useState(true);

    //  Kullanıcı rolünü kontrol et
    const isInstructor = user?.role === 'Instructor' || user?.role === 2;
    const isStudent = user?.role === 'Student' || user?.role === 1;
    const isAdmin = user?.role === 'Admin' || user?.role === 3;

    useEffect(() => {
        fetchCertificate();
    }, [id]);

    const fetchCertificate = async () => {
        try {
            setLoading(true);
            const res = await certificateApi.getCertificate(id);
            setCertificate(res.data.data);
        } catch (err) {
            console.error('Sertifika yüklenirken hata:', err);
        } finally {
            setLoading(false);
        }
    };

    //  Rol bazında geri dönüş path'i
    const getBackPath = () => {
        if (isInstructor) {
            return '/instructor/certificates';  // Eğitmen sertifika listesi
        } else if (isStudent) {
            return '/certificates';              // Öğrenci sertifikalarım
        } else if (isAdmin) {
            return '/dashboard';                 // Admin dashboard
        }
        return '/';  
    };

   
    const getBackText = () => {
        if (isInstructor) {
            return 'Sertifikalarıma Dön';
        } else if (isStudent) {
            return 'Sertifikalarıma Dön';
        } else if (isAdmin) {
            return 'Panele Dön';
        }
        return 'Geri Dön';
    };


    const handleDownload = async () => {
        if (!certificate?.id) {
            alert('Sertifika bilgisi bulunamadı.');
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:7230/api/v1/certificate/${certificate.id}/download`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'PDF indirilemedi');
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `Sertifika_${certificate.certificateNumber}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
            
            console.log('✅ PDF başarıyla indirildi!');
        } catch (error) {
            console.error('PDF indirme hatası:', error);
            alert(error.message || 'PDF indirilirken bir hata oluştu.');
        }
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
                <FaSpinner style={{ animation: 'spin 1s linear infinite', color: '#667eea', fontSize: 48 }} />
                <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    if (!certificate) {
        return (
            <div style={{ textAlign: 'center', padding: 60 }}>
                <h2>Sertifika bulunamadı</h2>
                <Link to={getBackPath()}>← {getBackText()}</Link>
            </div>
        );
    }

    return (
        <div style={{ maxWidth: 800, margin: '0 auto', padding: '24px 20px' }}>
          
            <Link 
                to={getBackPath()}
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
                <FaArrowLeft size={14} /> {getBackText()}
            </Link>

            {/* Sertifika Detayı */}
            <div style={{
                background: 'white',
                borderRadius: 20,
                padding: '40px',
                boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
                border: '1px solid rgba(0,0,0,0.04)',
                textAlign: 'center'
            }}>
                <div style={{
                    width: 80,
                    height: 80,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #667eea, #764ba2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 24px',
                    fontSize: 36,
                    color: 'white'
                }}>
                    <FaCertificate />
                </div>

                <h1 style={{ fontSize: 28, fontWeight: 700, color: '#0f0c29', marginBottom: 8 }}>
                    {certificate.courseTitle}
                </h1>

                <p style={{ fontSize: 16, color: '#6b7280', marginBottom: 4 }}>
                    {certificate.studentName}
                </p>

                <div style={{
                    display: 'inline-block',
                    padding: '4px 16px',
                    borderRadius: 20,
                    fontSize: 14,
                    fontWeight: 600,
                    background: certificate.isVerified ? '#d1fae5' : '#fef3c7',
                    color: certificate.isVerified ? '#10b981' : '#f59e0b',
                    marginBottom: 24
                }}>
                    {certificate.isVerified ? '✅ Doğrulandı' : '⏳ Beklemede'}
                </div>

                <div style={{
                    background: '#f8fafc',
                    borderRadius: 12,
                    padding: '20px 24px',
                    marginBottom: 24,
                    textAlign: 'left'
                }}>
                    <p style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #e5e7eb' }}>
                        <span style={{ color: '#6b7280' }}>Sertifika No</span>
                        <span style={{ fontWeight: 600, color: '#0f0c29' }}>{certificate.certificateNumber}</span>
                    </p>
                    <p style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #e5e7eb' }}>
                        <span style={{ color: '#6b7280' }}>Kurs</span>
                        <span style={{ fontWeight: 600, color: '#0f0c29' }}>{certificate.courseTitle}</span>
                    </p>
                    <p style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #e5e7eb' }}>
                        <span style={{ color: '#6b7280' }}>Öğrenci</span>
                        <span style={{ fontWeight: 600, color: '#0f0c29' }}>{certificate.studentName}</span>
                    </p>
                    <p style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0' }}>
                        <span style={{ color: '#6b7280' }}>Veriliş Tarihi</span>
                        <span style={{ fontWeight: 600, color: '#0f0c29' }}>
                            {certificate.issueDate ? new Date(certificate.issueDate).toLocaleDateString('tr-TR') : '-'}
                        </span>
                    </p>
                </div>

                <button
                    onClick={handleDownload}
                    style={{
                        padding: '12px 40px',
                        background: 'linear-gradient(135deg, #667eea, #764ba2)',
                        color: 'white',
                        border: 'none',
                        borderRadius: 10,
                        fontWeight: 700,
                        fontSize: 16,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 10,
                        transition: 'all 0.3s ease',
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
                    <FaDownload /> PDF Olarak İndir
                </button>
            </div>
        </div>
    );
};

export default CertificateDetail;