import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaSpinner, FaCertificate, FaDownload, FaCheckCircle, FaEye } from 'react-icons/fa';
import { certificateApi } from '../../api/api';

const CertificateList = () => {
    const [certificates, setCertificates] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchCertificates();
    }, []);

    const fetchCertificates = async () => {
        try {
            setLoading(true);
            const res = await certificateApi.getMyCertificates();
            console.log('📦 Tüm cevap:', res);
            console.log('📦 Cevap data:', res.data);
            console.log('📦 Sertifika listesi:', res.data.data);
            setCertificates(res.data.data || []);
        } catch (err) {
            console.error('Sertifikalar yüklenirken hata:', err);
        } finally {
            setLoading(false);
        }
    };

  
    const handleDownload = async (certificateId, certificateNumber) => {
        if (!certificateId) {
            alert('Sertifika bilgisi bulunamadı.');
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:7230/api/v1/certificate/${certificateId}/download`, {
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
            link.download = `Sertifika_${certificateNumber || 'sertifika'}.pdf`;
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
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '60vh',
                gap: 16
            }}>
                <FaSpinner style={{ animation: 'spin 1s linear infinite', color: '#667eea', fontSize: 48 }} />
                <p style={{ color: '#6b7280' }}>Sertifikalar yükleniyor...</p>
                <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    return (
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 20px' }}>
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
                    🎓 Sertifikalarım
                </h1>
                <p style={{ color: '#6b7280', marginTop: 4 }}>
                    {certificates.length > 0
                        ? `${certificates.length} sertifika kazandınız.`
                        : 'Henüz sertifikanız bulunmuyor.'
                    }
                </p>
            </div>

            {/* Sertifika Listesi */}
            {certificates.length === 0 ? (
                <div style={{
                    textAlign: 'center',
                    padding: '60px 20px',
                    background: 'white',
                    borderRadius: 16,
                    boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
                    border: '1px solid rgba(0,0,0,0.04)'
                }}>
                    <FaCertificate style={{ fontSize: 64, color: '#d1d5db', marginBottom: 16 }} />
                    <h3 style={{ fontSize: 20, color: '#0f0c29', marginBottom: 8 }}>Henüz sertifikanız yok</h3>
                    <p style={{ color: '#6b7280', marginBottom: 16 }}>
                        Kursları tamamlayarak sertifika kazanabilirsiniz.
                    </p>
                    <Link to="/courses" style={{
                        display: 'inline-block',
                        padding: '10px 32px',
                        background: 'linear-gradient(135deg, #667eea, #764ba2)',
                        color: 'white',
                        borderRadius: 10,
                        textDecoration: 'none',
                        fontWeight: 600,
                        transition: 'all 0.3s ease'
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 8px 24px rgba(102,126,234,0.3)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = 'none';
                    }}>
                        Kursları Keşfet
                    </Link>
                </div>
            ) : (
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
                    gap: 24
                }}>
                    {certificates.map((cert) => (
                        <div key={cert.id} style={{
                            background: 'white',
                            borderRadius: 16,
                            padding: '24px',
                            boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
                            border: '1px solid rgba(0,0,0,0.04)',
                            borderTop: `4px solid ${cert.isVerified ? '#10b981' : '#f59e0b'}`,
                            transition: 'all 0.3s ease',
                            display: 'flex',
                            flexDirection: 'column'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-4px)';
                            e.currentTarget.style.boxShadow = '0 12px 48px rgba(0,0,0,0.1)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.04)';
                        }}>
                            {/* Sertifika Başlığı */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                                <div style={{
                                    width: 48,
                                    height: 48,
                                    borderRadius: 12,
                                    background: 'linear-gradient(135deg, #667eea, #764ba2)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: 'white',
                                    fontSize: 24
                                }}>
                                    <FaCertificate />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <h3 style={{
                                        fontSize: 17,
                                        fontWeight: 600,
                                        color: '#0f0c29',
                                        margin: 0,
                                        lineHeight: 1.2
                                    }}>
                                        {cert.courseTitle || 'Kurs Sertifikası'}
                                    </h3>
                                    <span style={{
                                        fontSize: 12,
                                        fontWeight: 600,
                                        color: cert.isVerified ? '#10b981' : '#f59e0b',
                                        background: cert.isVerified ? '#d1fae5' : '#fef3c7',
                                        padding: '2px 12px',
                                        borderRadius: 12,
                                        display: 'inline-block',
                                        marginTop: 4
                                    }}>
                                        {cert.isVerified ? '✅ Doğrulandı' : '⏳ Beklemede'}
                                    </span>
                                </div>
                            </div>

                            {/* Sertifika Bilgileri */}
                            <div style={{
                                background: '#f8fafc',
                                borderRadius: 10,
                                padding: '12px 16px',
                                marginBottom: 16,
                                flex: 1
                            }}>
                                <p style={{
                                    fontSize: 13,
                                    color: '#6b7280',
                                    margin: '4px 0',
                                    display: 'flex',
                                    justifyContent: 'space-between'
                                }}>
                                    <span>Öğrenci:</span>
                                    <span style={{ fontWeight: 500, color: '#0f0c29' }}>{cert.studentName || 'Bilinmiyor'}</span>
                                </p>
                                <p style={{
                                    fontSize: 13,
                                    color: '#6b7280',
                                    margin: '4px 0',
                                    display: 'flex',
                                    justifyContent: 'space-between'
                                }}>
                                    <span>Sertifika No:</span>
                                    <span style={{ fontWeight: 500, color: '#0f0c29' }}>{cert.certificateNumber}</span>
                                </p>
                                <p style={{
                                    fontSize: 13,
                                    color: '#6b7280',
                                    margin: '4px 0',
                                    display: 'flex',
                                    justifyContent: 'space-between'
                                }}>
                                    <span>Veriliş Tarihi:</span>
                                    <span style={{ fontWeight: 500, color: '#0f0c29' }}>
                                        {cert.issueDate ? new Date(cert.issueDate).toLocaleDateString('tr-TR') : '-'}
                                    </span>
                                </p>
                            </div>

                            {/* Aksiyon Butonları */}
                            <div style={{
                                display: 'flex',
                                gap: 8,
                                marginTop: 'auto'
                            }}>
                                <button
                                    onClick={() => handleDownload(cert.id, cert.certificateNumber)}
                                    style={{
                                        flex: 1,
                                        padding: '8px 16px',
                                        border: 'none',
                                        borderRadius: 8,
                                        fontWeight: 600,
                                        fontSize: 13,
                                        cursor: 'pointer',
                                        background: 'linear-gradient(135deg, #667eea, #764ba2)',
                                        color: 'white',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: 6,
                                        transition: 'all 0.3s ease'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.transform = 'translateY(-2px)';
                                        e.currentTarget.style.boxShadow = '0 4px 16px rgba(102,126,234,0.3)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.transform = 'translateY(0)';
                                        e.currentTarget.style.boxShadow = 'none';
                                    }}
                                >
                                    <FaDownload size={14} /> PDF İndir
                                </button>
                                <Link
                                    to={`/certificates/${cert.id}`}
                                    style={{
                                        padding: '8px 16px',
                                        border: 'none',
                                        borderRadius: 8,
                                        fontWeight: 600,
                                        fontSize: 13,
                                        cursor: 'pointer',
                                        background: '#f1f5f9',
                                        color: '#1f2937',
                                        textDecoration: 'none',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: 6,
                                        transition: 'all 0.3s ease'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.background = '#e5e7eb';
                                        e.currentTarget.style.transform = 'translateY(-2px)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.background = '#f1f5f9';
                                        e.currentTarget.style.transform = 'translateY(0)';
                                    }}
                                >
                                    <FaEye size={14} /> Görüntüle
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default CertificateList;