import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaPlus, FaEdit, FaTrash, FaEye, FaSpinner } from 'react-icons/fa';
import Swal from 'sweetalert2';
import api from '../../api/api';

const InstructorCourseList = () => {
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    //  Para birimi sembolü
   const getCurrencySymbol = (currency) => {
    //  Eğer sayı geldiyse string'e çevir
    let currencyStr = currency;
    if (typeof currency === 'number') {
        const currencyMap = {
            1: 'TL',
            2: 'USD',
            3: 'EUR',
            4: 'GBP'
        };
        currencyStr = currencyMap[currency] || 'TL';
    }
    
    if (!currencyStr) return '₺';
    const symbols = {
        'TL': '₺',
        'USD': '$',
        'EUR': '€',
        'GBP': '£'
    };
    return symbols[currencyStr] || '₺';
};

    //  Fiyat formatı
   const formatPrice = (price, currency) => {
    //  Eğer sayı geldiyse string'e çevir
    let currencyStr = currency;
    if (typeof currency === 'number') {
        const currencyMap = {
            1: 'TL',
            2: 'USD',
            3: 'EUR',
            4: 'GBP'
        };
        currencyStr = currencyMap[currency] || 'TL';
    }
    
    if (!currencyStr) return `${price} ₺`;
    const symbol = getCurrencySymbol(currencyStr);
    return `${price} ${symbol}`;
};

    useEffect(() => {
        fetchCourses();
    }, []);

    const fetchCourses = async () => {
        try {
            setLoading(true);
            const res = await api.get('/course/instructor/me');
            const data = res.data.data || [];
            console.log('📦 Kurs verisi:', data);
            console.log('📦 İlk kurs currency:', data[0]?.currency);
            console.log('📦 İlk kurs fiyat:', data[0]?.price);
            setCourses(data);
            setError('');
        } catch (err) {
            console.error('Kurslar yüklenirken hata:', err);
            setError('Kurslar yüklenirken bir hata oluştu');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        const result = await Swal.fire({
            icon: 'warning',
            title: 'Emin misiniz?',
            text: 'Bu kursu silmek istediğinize emin misiniz?',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'Evet, sil',
            cancelButtonText: 'İptal'
        });

        if (result.isConfirmed) {
            try {
                await api.delete(`/course/${id}`);
                setCourses(courses.filter(c => c.id !== id));
                Swal.fire({ icon: 'success', title: 'Başarılı', text: 'Kurs silindi!' });
            } catch (err) {
                Swal.fire({ icon: 'error', title: 'Hata', text: 'Kurs silinirken hata oluştu!' });
            }
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
        <div className="instructor-courses-page">
            {/* HEADER */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <div>
                    <h1 style={{ fontSize: 28, margin: 0 }}>📚 Kurslarım</h1>
                    <p style={{ color: '#6c757d', margin: 4 }}>Kendi kurslarınızı yönetin</p>
                </div>
                <Link to="/courses/create" style={{ 
                    background: 'linear-gradient(135deg, #667eea, #764ba2)',
                    color: 'white',
                    border: 'none',
                    padding: '10px 20px',
                    borderRadius: '8px',
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8
                }}>
                    <FaPlus /> Yeni Kurs
                </Link>
            </div>

            {error && (
                <div style={{ background: '#fee2e2', color: '#dc2626', padding: 12, borderRadius: 8, marginBottom: 16 }}>
                    {error}
                    <button onClick={fetchCourses} style={{ marginLeft: 12, background: 'none', border: '1px solid #dc2626', padding: '4px 12px', borderRadius: 4, cursor: 'pointer' }}>Tekrar Dene</button>
                </div>
            )}

            {/* TABLE */}
            <div style={{ background: 'white', borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead style={{ background: '#f8f9fa' }}>
                        <tr>
                            <th style={{ padding: 12, textAlign: 'left', borderBottom: '1px solid #e8eaed' }}>Başlık</th>
                            <th style={{ padding: 12, textAlign: 'left', borderBottom: '1px solid #e8eaed' }}>Seviye</th>
                            <th style={{ padding: 12, textAlign: 'left', borderBottom: '1px solid #e8eaed' }}>Fiyat</th>
                            <th style={{ padding: 12, textAlign: 'left', borderBottom: '1px solid #e8eaed' }}>Durum</th>
                            <th style={{ padding: 12, textAlign: 'center', borderBottom: '1px solid #e8eaed' }}>İşlem</th>
                        </tr>
                    </thead>
                    <tbody>
                        {courses.length === 0 ? (
                            <tr>
                                <td colSpan="5" style={{ textAlign: 'center', padding: 40, color: '#6c757d' }}>
                                    Henüz kurs eklememişsiniz. 
                                    <Link to="/courses/create" style={{ color: '#667eea', marginLeft: 4 }}>İlk kursu ekleyin</Link>
                                </td>
                            </tr>
                        ) : (
                            courses.map((course) => (
                                <tr key={course.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                                    <td style={{ padding: 12 }}>{course.title}</td>
                                    <td style={{ padding: 12 }}>
                                        <span style={{ 
                                            background: '#e8e6ff', 
                                            color: '#667eea', 
                                            padding: '2px 12px', 
                                            borderRadius: 12,
                                            fontSize: 12,
                                            fontWeight: 600
                                        }}>
                                            {course.level || 'Başlangıç'}
                                        </span>
                                    </td>
                                    <td style={{ padding: 12, fontWeight: 600 }}>
                                        {course.isFree ? 'Ücretsiz' : formatPrice(course.price, course.currency)}
                                    </td>
                                    <td style={{ padding: 12 }}>
                                        <span style={{
                                            background: course.isPublished ? '#d1fae5' : '#fef3c7',
                                            color: course.isPublished ? '#065f46' : '#92400e',
                                            padding: '2px 12px',
                                            borderRadius: 12,
                                            fontSize: 12,
                                            fontWeight: 600
                                        }}>
                                            {course.isPublished ? 'Yayında' : 'Taslak'}
                                        </span>
                                    </td>
                                    <td style={{ padding: 12, textAlign: 'center' }}>
                                        <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                                            <Link to={`/courses/${course.id}`} style={{ color: '#667eea' }} title="Detay">
                                                <FaEye />
                                            </Link>
                                            <Link to={`/courses/edit/${course.id}`} style={{ color: '#f59e0b' }} title="Düzenle">
                                                <FaEdit />
                                            </Link>
                                            <button onClick={() => handleDelete(course.id)} style={{ 
                                                background: 'none', 
                                                border: 'none', 
                                                color: '#ef4444', 
                                                cursor: 'pointer' 
                                            }} title="Sil">
                                                <FaTrash />
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

export default InstructorCourseList;