// pages/instructor/InstructorStudents.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaSpinner, FaUser, FaEnvelope, FaBookOpen, FaCheckCircle, FaClock, FaSearch } from 'react-icons/fa';
import api from '../../api/api';

const InstructorStudents = () => {
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchStudents();
    }, []);

    const fetchStudents = async () => {
        try {
            setLoading(true);
            console.log('📤 Öğrenci listesi isteği gönderiliyor...');
            const res = await api.get('/instructor/students');
            console.log('📦 Öğrenci listesi cevabı:', res.data);
            
            const studentsData = res.data.data || [];
            setStudents(studentsData);
        } catch (err) {
            console.error('Öğrenciler yüklenirken hata:', err);
            console.error('❌ Hata detayı:', err.response?.data);
        } finally {
            setLoading(false);
        }
    };

    //  Arama filtresi
    const filteredStudents = students.filter(student =>
        student.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.courseTitle?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '50vh', gap: 16 }}>
                <FaSpinner size={40} style={{ animation: 'spin 1s linear infinite', color: '#667eea' }} />
                <p style={{ color: '#6b7280' }}>Öğrenciler yükleniyor...</p>
                <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    return (
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 20px' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
                <div>
                    <h1 style={{ fontSize: 28, fontWeight: 700, color: '#0f0c29', margin: 0 }}>👨‍🎓 Öğrencilerim</h1>
                    <p style={{ color: '#6b7280', margin: '4px 0 0 0', fontSize: 15 }}>
                        {students.length} kayıt - {new Set(students.map(s => s.id)).size} benzersiz öğrenci
                    </p>
                </div>
            </div>

            {/* Search */}
            <div style={{ marginBottom: 24 }}>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    background: 'white',
                    border: '2px solid #e5e7eb',
                    borderRadius: 10,
                    padding: '0 16px',
                    maxWidth: 400,
                    transition: 'border-color 0.3s'
                }}>
                    <FaSearch style={{ color: '#9ca3af', fontSize: 16 }} />
                    <input
                        type="text"
                        placeholder="Öğrenci ara (isim, email, kurs)..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{
                            flex: 1,
                            border: 'none',
                            outline: 'none',
                            padding: '10px 12px',
                            fontSize: 14,
                            background: 'transparent',
                            color: '#1f1f3a'
                        }}
                    />
                </div>
            </div>

            {filteredStudents.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 80, background: 'white', borderRadius: 16, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
                    <div style={{ fontSize: 64, marginBottom: 16 }}>📚</div>
                    <h3 style={{ fontSize: 20, color: '#0f0c29', marginBottom: 8 }}>
                        {searchTerm ? 'Aramanıza uygun öğrenci bulunamadı' : 'Henüz öğrenciniz yok'}
                    </h3>
                    <p style={{ color: '#6b7280' }}>
                        {searchTerm ? 'Farklı bir arama yapmayı deneyin' : 'Kurslarınıza kaydolan öğrenciler burada görünecek.'}
                    </p>
                </div>
            ) : (
                <div style={{ background: 'white', borderRadius: 16, overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid rgba(0,0,0,0.04)' }}>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 600 }}>
                            <thead>
                                <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e5e7eb' }}>
                                    <th style={{ padding: '14px 20px', textAlign: 'left', fontSize: 13, fontWeight: 600, color: '#475569' }}>#</th>
                                    <th style={{ padding: '14px 20px', textAlign: 'left', fontSize: 13, fontWeight: 600, color: '#475569' }}>Öğrenci</th>
                                    <th style={{ padding: '14px 20px', textAlign: 'left', fontSize: 13, fontWeight: 600, color: '#475569' }}>E-posta</th>
                                    <th style={{ padding: '14px 20px', textAlign: 'left', fontSize: 13, fontWeight: 600, color: '#475569' }}>Kurs</th>
                                    <th style={{ padding: '14px 20px', textAlign: 'center', fontSize: 13, fontWeight: 600, color: '#475569' }}>İlerleme</th>
                                    <th style={{ padding: '14px 20px', textAlign: 'center', fontSize: 13, fontWeight: 600, color: '#475569' }}>Durum</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredStudents.map((student, index) => {
                              
                                    // Aynı öğrenci farklı kurslara kaydolduğu için courseTitle ile birleştir
                                    const uniqueKey = `${index}-${student.email || student.firstName}-${student.courseTitle || 'kurs'}`;
                                    
                                    return (
                                        <tr 
                                            key={uniqueKey}  
                                            style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.15s' }}
                                            onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                                            onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
                                        >
                                            <td style={{ padding: '14px 20px', color: '#94a3b8', fontSize: 13, fontWeight: 500 }}>{index + 1}</td>
                                            <td style={{ padding: '14px 20px', fontWeight: 500 }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                    <div style={{
                                                        width: 34,
                                                        height: 34,
                                                        borderRadius: '50%',
                                                        background: 'linear-gradient(135deg, #667eea, #764ba2)',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        color: 'white',
                                                        fontWeight: 600,
                                                        fontSize: 14,
                                                        flexShrink: 0
                                                    }}>
                                                        {student.firstName?.charAt(0) || 'Ö'}
                                                    </div>
                                                    <span style={{ color: '#0f0c29' }}>
                                                        {student.firstName} {student.lastName}
                                                    </span>
                                                </div>
                                            </td>
                                            <td style={{ padding: '14px 20px', color: '#475569', fontSize: 13 }}>
                                                {student.email}
                                            </td>
                                            <td style={{ padding: '14px 20px' }}>
                                                <span style={{
                                                    display: 'inline-block',
                                                    padding: '3px 12px',
                                                    background: '#eef2ff',
                                                    color: '#667eea',
                                                    borderRadius: 12,
                                                    fontSize: 12,
                                                    fontWeight: 500
                                                }}>
                                                    {student.courseTitle || 'Kurs Yok'}
                                                </span>
                                            </td>
                                            <td style={{ padding: '14px 20px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'center' }}>
                                                    <div style={{
                                                        flex: 1,
                                                        height: 6,
                                                        background: '#e5e7eb',
                                                        borderRadius: 3,
                                                        overflow: 'hidden',
                                                        maxWidth: 80
                                                    }}>
                                                        <div style={{
                                                            width: `${student.progressPercentage || 0}%`,
                                                            height: '100%',
                                                            background: 'linear-gradient(90deg, #667eea, #764ba2)',
                                                            borderRadius: 3,
                                                            transition: 'width 0.5s'
                                                        }} />
                                                    </div>
                                                    <span style={{ fontSize: 12, color: '#6b7280', fontWeight: 600, minWidth: 36 }}>
                                                        {student.progressPercentage || 0}%
                                                    </span>
                                                </div>
                                            </td>
                                            <td style={{ padding: '14px 20px', textAlign: 'center' }}>
                                                {student.isCompleted ? (
                                                    <span style={{ 
                                                        color: '#10b981', 
                                                        display: 'inline-flex', 
                                                        alignItems: 'center', 
                                                        gap: 4,
                                                        background: '#d1fae5',
                                                        padding: '3px 12px',
                                                        borderRadius: 12,
                                                        fontSize: 12,
                                                        fontWeight: 600
                                                    }}>
                                                        <FaCheckCircle size={12} /> Tamamladı
                                                    </span>
                                                ) : (
                                                    <span style={{ 
                                                        color: '#f59e0b', 
                                                        display: 'inline-flex', 
                                                        alignItems: 'center', 
                                                        gap: 4,
                                                        background: '#fef3c7',
                                                        padding: '3px 12px',
                                                        borderRadius: 12,
                                                        fontSize: 12,
                                                        fontWeight: 600
                                                    }}>
                                                        <FaClock size={12} /> Devam Ediyor
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                    {/* Toplam öğrenci sayısı */}
                    <div style={{ 
                        padding: '12px 20px', 
                        borderTop: '1px solid #f1f5f9', 
                        background: '#fafbfc',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        fontSize: 13,
                        color: '#6b7280'
                    }}>
                        <span>Toplam kayıt: {filteredStudents.length}</span>
                        <span>
                            Benzersiz öğrenci: {new Set(filteredStudents.map(s => s.id)).size}
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default InstructorStudents;