// pages/instructor/InstructorExamList.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaPlus, FaEdit, FaTrash, FaSpinner, FaToggleOn, FaToggleOff } from 'react-icons/fa';
import Swal from 'sweetalert2';
import api from '../../api/api';

const InstructorExamList = () => {
    const [exams, setExams] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchExams();
    }, []);

    const fetchExams = async () => {
        try {
            setLoading(true);
            const res = await api.get('/exam/instructor');
            setExams(res.data.data || []);
        } catch (err) {
            console.error('Sınavlar yüklenirken hata:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id, title) => {
        const result = await Swal.fire({
            title: 'Emin misiniz?',
            text: `"${title}" sınavını silmek istediğinize emin misiniz?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#6c757d',
            confirmButtonText: 'Evet, sil!',
            cancelButtonText: 'Vazgeç'
        });

        if (result.isConfirmed) {
            try {
                await api.delete(`/exam/${id}`);
                Swal.fire({
                    icon: 'success',
                    title: 'Silindi!',
                    timer: 1500,
                    showConfirmButton: false
                });
                fetchExams();
            } catch (err) {
                Swal.fire({
                    icon: 'error',
                    title: 'Hata!',
                    text: err.response?.data?.message || 'Sınav silinirken hata oluştu!',
                    confirmButtonColor: '#ef4444'
                });
            }
        }
    };

    const handleTogglePublish = async (id, isPublished) => {
        try {
            const endpoint = isPublished ? 'unpublish' : 'publish';
            await api.post(`/exam/${id}/${endpoint}`);
            Swal.fire({
                icon: 'success',
                title: isPublished ? 'Yayından Kaldırıldı' : 'Yayınlandı!',
                timer: 1500,
                showConfirmButton: false
            });
            fetchExams();
        } catch (err) {
            Swal.fire({
                icon: 'error',
                title: 'Hata!',
                text: err.response?.data?.message || 'İşlem başarısız!',
                confirmButtonColor: '#ef4444'
            });
        }
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
                <FaSpinner size={40} style={{ animation: 'spin 1s linear infinite' }} />
            </div>
        );
    }

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
                <div>
                    <h1 style={{ fontSize: 28, margin: 0 }}>📝 Sınavlarım</h1>
                    <p style={{ color: '#6c757d', margin: 4 }}>Kurslarınıza ait sınavları yönetin</p>
                </div>
                <Link to="/instructor/exams/create" style={{
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
                    fontSize: 14,
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
                    <FaPlus /> Yeni Sınav
                </Link>
            </div>

            <div style={{ background: 'white', borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead style={{ background: '#f8f9fa' }}>
                        <tr>
                            <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 13, fontWeight: 600, color: '#6b7280' }}>#</th>
                            <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 13, fontWeight: 600, color: '#6b7280' }}>Sınav Başlığı</th>
                            <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 13, fontWeight: 600, color: '#6b7280' }}>Kurs</th>
                            <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: 13, fontWeight: 600, color: '#6b7280' }}>Soru</th>
                            <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: 13, fontWeight: 600, color: '#6b7280' }}>Süre</th>
                            <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: 13, fontWeight: 600, color: '#6b7280' }}>Geçme</th>
                            <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: 13, fontWeight: 600, color: '#6b7280' }}>Durum</th>
                            <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: 13, fontWeight: 600, color: '#6b7280' }}>İşlem</th>
                        </tr>
                    </thead>
                    <tbody>
                        {exams.length === 0 ? (
                            <tr>
                                <td colSpan="8" style={{ textAlign: 'center', padding: 40, color: '#6c757d' }}>
                                    Henüz sınav oluşturmadınız.
                                </td>
                            </tr>
                        ) : (
                            exams.map((exam, index) => (
                                <tr key={exam.id} style={{ borderBottom: '1px solid #f3f4f6', transition: 'background 0.2s' }}
                                    onMouseEnter={(e) => e.currentTarget.style.background = '#f9fafb'}
                                    onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
                                >
                                    <td style={{ padding: '12px 16px', fontSize: 14, color: '#6b7280' }}>{index + 1}</td>
                                    <td style={{ padding: '12px 16px', fontWeight: 500, fontSize: 14, color: '#0f0c29' }}>{exam.title}</td>
                                    <td style={{ padding: '12px 16px', fontSize: 14, color: '#4b5563' }}>{exam.courseTitle}</td>
                                    <td style={{ padding: '12px 16px', textAlign: 'center', fontSize: 14, color: '#4b5563' }}>{exam.questionCount || 0}</td>
                                    <td style={{ padding: '12px 16px', textAlign: 'center', fontSize: 14, color: '#4b5563' }}>{exam.durationMinutes} dk</td>
                                    <td style={{ padding: '12px 16px', textAlign: 'center', fontSize: 14, color: '#4b5563' }}>{exam.passingScore}%</td>
                                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                                        <span style={{
                                            padding: '4px 14px',
                                            borderRadius: 20,
                                            fontSize: 12,
                                            fontWeight: 600,
                                            background: exam.isPublished ? '#d1fae5' : '#fef3c7',
                                            color: exam.isPublished ? '#10b981' : '#f59e0b'
                                        }}>
                                            {exam.isPublished ? '✅ Yayında' : '📝 Taslak'}
                                        </span>
                                    </td>
                                    <td style={{ padding: '8px 16px', textAlign: 'center' }}>
                                        <div style={{ 
                                            display: 'flex', 
                                            justifyContent: 'center', 
                                            alignItems: 'center', 
                                            gap: 6 
                                        }}>
                                            {/* Yayınla / Yayından Kaldır Butonu */}
                                            <button
                                                onClick={() => handleTogglePublish(exam.id, exam.isPublished)}
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    width: 32,
                                                    height: 32,
                                                    borderRadius: 8,
                                                    border: 'none',
                                                    background: exam.isPublished ? '#fef3c7' : '#d1fae5',
                                                    color: exam.isPublished ? '#f59e0b' : '#10b981',
                                                    cursor: 'pointer',
                                                    transition: 'all 0.2s ease'
                                                }}
                                                title={exam.isPublished ? 'Yayından Kaldır' : 'Yayınla'}
                                                onMouseEnter={(e) => {
                                                    e.currentTarget.style.transform = 'scale(1.1)';
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.currentTarget.style.transform = 'scale(1)';
                                                }}
                                            >
                                                {exam.isPublished ? <FaToggleOn size={18} /> : <FaToggleOff size={18} />}
                                            </button>

                                            {/* Düzenle Butonu */}
                                            <Link 
                                                to={`/instructor/exams/edit/${exam.id}`}
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    width: 32,
                                                    height: 32,
                                                    borderRadius: 8,
                                                    border: 'none',
                                                    background: '#eef2ff',
                                                    color: '#667eea',
                                                    textDecoration: 'none',
                                                    transition: 'all 0.2s ease'
                                                }}
                                                title="Düzenle"
                                                onMouseEnter={(e) => {
                                                    e.currentTarget.style.background = '#667eea';
                                                    e.currentTarget.style.color = 'white';
                                                    e.currentTarget.style.transform = 'scale(1.1)';
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.currentTarget.style.background = '#eef2ff';
                                                    e.currentTarget.style.color = '#667eea';
                                                    e.currentTarget.style.transform = 'scale(1)';
                                                }}
                                            >
                                                <FaEdit size={16} />
                                            </Link>

                                            {/* Sil Butonu */}
                                            <button 
                                                onClick={() => handleDelete(exam.id, exam.title)}
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    width: 32,
                                                    height: 32,
                                                    borderRadius: 8,
                                                    border: 'none',
                                                    background: '#fee2e2',
                                                    color: '#ef4444',
                                                    cursor: 'pointer',
                                                    transition: 'all 0.2s ease'
                                                }}
                                                title="Sil"
                                                onMouseEnter={(e) => {
                                                    e.currentTarget.style.background = '#ef4444';
                                                    e.currentTarget.style.color = 'white';
                                                    e.currentTarget.style.transform = 'scale(1.1)';
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.currentTarget.style.background = '#fee2e2';
                                                    e.currentTarget.style.color = '#ef4444';
                                                    e.currentTarget.style.transform = 'scale(1)';
                                                }}
                                            >
                                                <FaTrash size={15} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default InstructorExamList;