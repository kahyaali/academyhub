
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaPlus, FaEye, FaSpinner } from 'react-icons/fa';
import Swal from 'sweetalert2';

import api from '../../api/api';

const StudentList = () => {
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStudents();
    }, []);

    const fetchStudents = async () => {
        try {
            const res = await api.get('/user/students');
            setStudents(res.data.data || []);
        } catch (err) {
            console.error('Öğrenciler yüklenirken hata:', err);
            Swal.fire({
                icon: 'error',
                title: 'Hata!',
                text: 'Öğrenciler yüklenemedi!',
                confirmButtonColor: '#ef4444'
            });
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
                <FaSpinner size={40} style={{ animation: 'spin 1s linear infinite', color: '#667eea' }} />
            </div>
        );
    }

    return (
        <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <div>
                    <h1 style={{ fontSize: 28, margin: 0, color: '#1a1a2e' }}>👨‍🎓 Öğrenciler</h1>
                    <p style={{ color: '#6c757d', margin: 4, fontSize: 14 }}>Sistemdeki öğrencileri görüntüleyin</p>
                </div>
                <Link to="/students/create" style={{
                    background: 'linear-gradient(135deg, #667eea, #764ba2)',
                    color: 'white',
                    border: 'none',
                    padding: '10px 20px',
                    borderRadius: 8,
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    fontWeight: 600,
                    boxShadow: '0 2px 8px rgba(102, 126, 234, 0.3)'
                }}>
                    <FaPlus /> Yeni Öğrenci
                </Link>
            </div>

            <div style={{ 
                background: 'white', 
                borderRadius: 16, 
                overflow: 'hidden', 
                boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                border: '1px solid #f0f0f0'
            }}>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead style={{ background: '#f8f9fa' }}>
                            <tr>
                                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 14, fontWeight: 600, color: '#4a4a6a' }}>#</th>
                                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 14, fontWeight: 600, color: '#4a4a6a' }}>Ad Soyad</th>
                                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 14, fontWeight: 600, color: '#4a4a6a' }}>E-posta</th>
                                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 14, fontWeight: 600, color: '#4a4a6a' }}>Telefon</th>
                                <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: 14, fontWeight: 600, color: '#4a4a6a' }}>Durum</th>
                                <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: 14, fontWeight: 600, color: '#4a4a6a' }}>İşlem</th>
                            </tr>
                        </thead>
                        <tbody>
                            {students.length === 0 ? (
                                <tr>
                                    <td colSpan="6" style={{ textAlign: 'center', padding: 40, color: '#6c757d' }}>
                                        Henüz öğrenci yok.
                                    </td>
                                </tr>
                            ) : (
                                students.map((student, index) => (
                                    <tr key={student.id} style={{ borderBottom: '1px solid #f0f0f0', transition: 'background 0.2s' }}
                                        onMouseEnter={(e) => e.currentTarget.style.background = '#f8f9fa'}
                                        onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
                                    >
                                        <td style={{ padding: '12px 16px', color: '#6c757d' }}>{index + 1}</td>
                                        <td style={{ padding: '12px 16px', fontWeight: 500, color: '#1a1a2e' }}>
                                            {student.firstName} {student.lastName}
                                        </td>
                                        <td style={{ padding: '12px 16px', color: '#4a4a6a' }}>{student.email}</td>
                                        <td style={{ padding: '12px 16px', color: '#4a4a6a' }}>{student.phoneNumber || '-'}</td>
                                        <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                                            <span style={{
                                                background: student.isActive ? '#d1fae5' : '#fee2e2',
                                                color: student.isActive ? '#065f46' : '#991b1b',
                                                padding: '4px 12px',
                                                borderRadius: 20,
                                                fontSize: 12,
                                                fontWeight: 600
                                            }}>
                                                {student.isActive ? 'Aktif' : 'Pasif'}
                                            </span>
                                        </td>
                                        <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                                            <Link to={`/students/${student.id}`} style={{
                                                color: '#667eea',
                                                padding: '6px 12px',
                                                borderRadius: 6,
                                                border: '1px solid #e0e7ff',
                                                background: '#eef2ff',
                                                transition: 'all 0.3s ease',
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: 6,
                                                fontSize: 14,
                                                textDecoration: 'none'
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.background = '#667eea';
                                                e.currentTarget.style.color = 'white';
                                                e.currentTarget.style.borderColor = '#667eea';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.background = '#eef2ff';
                                                e.currentTarget.style.color = '#667eea';
                                                e.currentTarget.style.borderColor = '#e0e7ff';
                                            }}
                                            >
                                                <FaEye /> Detay
                                            </Link>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
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

export default StudentList;