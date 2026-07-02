// pages/instructor/InstructorCertificateList.jsx
import React, { useState, useEffect } from 'react';
import { FaSpinner, FaCertificate, FaCheckCircle, FaDownload, FaEye } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import Swal from 'sweetalert2';
import api from '../../api/api';

const InstructorCertificateList = () => {
    const [certificates, setCertificates] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchCertificates();
    }, []);

    const fetchCertificates = async () => {
        try {
            setLoading(true);
            const res = await api.get('/certificate/instructor');
            console.log('📚 Sertifikalar:', res.data.data);
            setCertificates(res.data.data || []);
        } catch (err) {
            console.error('Sertifikalar yüklenirken hata:', err);
        } finally {
            setLoading(false);
        }
    };


    const handleDownload = async (certificateId, certificateNumber) => {
        if (!certificateId) {
            Swal.fire({
                icon: 'warning',
                title: 'Uyarı',
                text: 'Sertifika bilgisi bulunamadı.'
            });
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
            link.download = `Sertifika_${certificateNumber || certificateId}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
            
            console.log('✅ PDF başarıyla indirildi!');
        } catch (error) {
            console.error('PDF indirme hatası:', error);
            Swal.fire({
                icon: 'error',
                title: 'Hata!',
                text: error.message || 'PDF indirilirken bir hata oluştu.',
                confirmButtonColor: '#ef4444'
            });
        }
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
                <FaSpinner size={40} style={{ animation: 'spin 1s linear infinite' }} />
                <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <div>
                    <h1 style={{ fontSize: 28, margin: 0 }}>🎓 Sertifikalar</h1>
                    <p style={{ color: '#6c757d', margin: 4 }}>Öğrencilerinizin kazandığı sertifikalar</p>
                </div>
            </div>

            {certificates.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 60, background: 'white', borderRadius: 12 }}>
                    <FaCertificate size={48} style={{ color: '#d1d5db', marginBottom: 16 }} />
                    <p style={{ color: '#6c757d' }}>Henüz sertifika kazanan öğrenci yok.</p>
                </div>
            ) : (
                <div style={{ background: 'white', borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead style={{ background: '#f8f9fa' }}>
                            <tr>
                                <th style={{ padding: 12, textAlign: 'left' }}>#</th>
                                <th style={{ padding: 12, textAlign: 'left' }}>Sertifika No</th>
                                <th style={{ padding: 12, textAlign: 'left' }}>Öğrenci</th>
                                <th style={{ padding: 12, textAlign: 'left' }}>Kurs</th>
                                <th style={{ padding: 12, textAlign: 'left' }}>Veriliş Tarihi</th>
                                <th style={{ padding: 12, textAlign: 'center' }}>Durum</th>
                                <th style={{ padding: 12, textAlign: 'center' }}>İşlem</th>
                            </tr>
                        </thead>
                        <tbody>
                            {certificates.map((cert, index) => (
                                <tr key={cert.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                                    <td style={{ padding: 12 }}>{index + 1}</td>
                                    <td style={{ padding: 12, fontWeight: 500 }}>{cert.certificateNumber}</td>
                                    <td style={{ padding: 12 }}>{cert.studentName}</td>
                                    <td style={{ padding: 12 }}>{cert.courseTitle}</td>
                                    <td style={{ padding: 12 }}>
                                        {cert.issueDate ? new Date(cert.issueDate).toLocaleDateString('tr-TR') : '-'}
                                    </td>
                                    <td style={{ padding: 12, textAlign: 'center' }}>
                                        <span style={{
                                            padding: '4px 12px',
                                            borderRadius: 20,
                                            fontSize: 12,
                                            fontWeight: 600,
                                            background: cert.isVerified ? '#d1fae5' : '#fef3c7',
                                            color: cert.isVerified ? '#10b981' : '#f59e0b'
                                        }}>
                                            {cert.isVerified ? '✅ Doğrulandı' : '⏳ Beklemede'}
                                        </span>
                                    </td>
                                    <td style={{ padding: 12, textAlign: 'center' }}>
                                        <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                                            {/*  Detay Butonu */}
                                            <Link 
                                                to={`/certificates/${cert.id}`} 
                                                style={{ 
                                                    color: '#667eea',
                                                    padding: '6px 10px',
                                                    borderRadius: 6,
                                                    background: '#eef2ff',
                                                    transition: 'all 0.2s'
                                                }}
                                                title="Detay"
                                                onMouseEnter={(e) => {
                                                    e.currentTarget.style.background = '#667eea';
                                                    e.currentTarget.style.color = 'white';
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.currentTarget.style.background = '#eef2ff';
                                                    e.currentTarget.style.color = '#667eea';
                                                }}
                                            >
                                                <FaEye />
                                            </Link>
                                            
                                       
                                            <button
                                                onClick={() => handleDownload(cert.id, cert.certificateNumber)}
                                                style={{
                                                    color: '#10b981',
                                                    padding: '6px 10px',
                                                    borderRadius: 6,
                                                    background: '#d1fae5',
                                                    border: 'none',
                                                    cursor: 'pointer',
                                                    transition: 'all 0.2s'
                                                }}
                                                title="PDF İndir"
                                                onMouseEnter={(e) => {
                                                    e.currentTarget.style.background = '#10b981';
                                                    e.currentTarget.style.color = 'white';
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.currentTarget.style.background = '#d1fae5';
                                                    e.currentTarget.style.color = '#10b981';
                                                }}
                                            >
                                                <FaDownload />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default InstructorCertificateList;