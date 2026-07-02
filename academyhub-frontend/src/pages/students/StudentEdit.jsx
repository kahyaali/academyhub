import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { FaArrowLeft, FaSave, FaSpinner } from 'react-icons/fa';
import Swal from 'sweetalert2';
import api from '../../api/api';

const StudentEdit = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phoneNumber: '',
        address: '',
        birthDate: '',
        isActive: true,
        userId: null
    });

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
            
            console.log('Bulunan öğrenci:', studentData);
            
            // 2. User bilgilerini getir
            const userId = studentData.userId || studentData.id;
            const userRes = await api.get(`/user/${userId}`);
            const userData = userRes.data.data;
            
            setForm({
                firstName: studentData.firstName || '',
                lastName: studentData.lastName || '',
                email: userData.email || studentData.email || '',
                phoneNumber: userData.phoneNumber || studentData.phoneNumber || '',
                address: userData.address || studentData.address || '',
                birthDate: studentData.birthDate ? new Date(studentData.birthDate).toISOString().split('T')[0] : '',
                isActive: userData.isActive !== undefined ? userData.isActive : true,
                userId: userId
            });
        } catch (err) {
            console.error('Öğrenci bilgileri yüklenirken hata:', err);
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

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setForm({
            ...form,
            [name]: type === 'checkbox' ? checked : value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            //  1. ADIM: User tablosunu güncelle
            await api.put(`/user/${form.userId}`, {
                firstName: form.firstName,
                lastName: form.lastName,
                phoneNumber: form.phoneNumber,
                address: form.address,
                isActive: form.isActive
            });

            //  2. ADIM: Student tablosunu güncelle
            await api.put(`/user/student/${id}`, {
                firstName: form.firstName,
                lastName: form.lastName,
                phoneNumber: form.phoneNumber,
                address: form.address,
                birthDate: form.birthDate || null,
                isActive: form.isActive
            });
            
            Swal.fire({
                icon: 'success',
                title: 'Başarılı!',
                text: 'Öğrenci bilgileri güncellendi.',
                timer: 2000,
                showConfirmButton: false
            });
            navigate(`/students/${id}`);
        } catch (err) {
            console.error('Güncelleme hatası:', err);
            
            let errorMessage = 'Güncelleme başarısız!';
            if (err.response?.data?.message) {
                errorMessage = err.response.data.message;
            }
            
            Swal.fire({
                icon: 'error',
                title: 'Hata!',
                text: errorMessage,
                confirmButtonColor: '#ef4444'
            });
            setSaving(false);
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
                <FaSpinner size={40} style={{ 
                    animation: 'spin 1s linear infinite',
                    color: '#667eea'
                }} />
                <p style={{ color: '#6c757d' }}>Öğrenci bilgileri yükleniyor...</p>
            </div>
        );
    }

    return (
        <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
                <Link to={`/students/${id}`} style={{
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
                    <h1 style={{ fontSize: 28, margin: 0, color: '#1a1a2e' }}>✏️ Öğrenci Düzenle</h1>
                    <p style={{ color: '#6c757d', margin: 4, fontSize: 14 }}>Öğrenci bilgilerini güncelleyin</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} style={{ 
                background: 'white', 
                padding: 32, 
                borderRadius: 16, 
                boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                border: '1px solid #f0f0f0'
            }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                    <div>
                        <label style={{ display: 'block', fontWeight: 600, marginBottom: 6, fontSize: 14, color: '#4a4a6a' }}>
                            Ad *
                        </label>
                        <input
                            type="text"
                            name="firstName"
                            value={form.firstName}
                            onChange={handleChange}
                            required
                            style={{ 
                                width: '100%', 
                                padding: '10px 14px', 
                                border: '1px solid #e0e0e0', 
                                borderRadius: 8,
                                fontSize: 14,
                                boxSizing: 'border-box',
                                outline: 'none',
                                transition: 'all 0.3s ease'
                            }}
                            onFocus={(e) => {
                                e.currentTarget.style.borderColor = '#667eea';
                                e.currentTarget.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
                            }}
                            onBlur={(e) => {
                                e.currentTarget.style.borderColor = '#e0e0e0';
                                e.currentTarget.style.boxShadow = 'none';
                            }}
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', fontWeight: 600, marginBottom: 6, fontSize: 14, color: '#4a4a6a' }}>
                            Soyad *
                        </label>
                        <input
                            type="text"
                            name="lastName"
                            value={form.lastName}
                            onChange={handleChange}
                            required
                            style={{ 
                                width: '100%', 
                                padding: '10px 14px', 
                                border: '1px solid #e0e0e0', 
                                borderRadius: 8,
                                fontSize: 14,
                                boxSizing: 'border-box',
                                outline: 'none',
                                transition: 'all 0.3s ease'
                            }}
                            onFocus={(e) => {
                                e.currentTarget.style.borderColor = '#667eea';
                                e.currentTarget.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
                            }}
                            onBlur={(e) => {
                                e.currentTarget.style.borderColor = '#e0e0e0';
                                e.currentTarget.style.boxShadow = 'none';
                            }}
                        />
                    </div>
                </div>

                <div style={{ marginTop: 20 }}>
                    <label style={{ display: 'block', fontWeight: 600, marginBottom: 6, fontSize: 14, color: '#4a4a6a' }}>
                        E-posta
                    </label>
                    <input
                        type="email"
                        value={form.email}
                        disabled
                        style={{ 
                            width: '100%', 
                            padding: '10px 14px', 
                            border: '1px solid #e0e0e0', 
                            borderRadius: 8,
                            fontSize: 14,
                            background: '#f8f9fa',
                            color: '#6c757d',
                            boxSizing: 'border-box',
                            cursor: 'not-allowed'
                        }}
                    />
                    <small style={{ color: '#6c757d', fontSize: 12 }}>E-posta adresi değiştirilemez.</small>
                </div>

                <div style={{ marginTop: 20 }}>
                    <label style={{ display: 'block', fontWeight: 600, marginBottom: 6, fontSize: 14, color: '#4a4a6a' }}>
                        Telefon
                    </label>
                    <input
                        type="text"
                        name="phoneNumber"
                        value={form.phoneNumber}
                        onChange={handleChange}
                        style={{ 
                            width: '100%', 
                            padding: '10px 14px', 
                            border: '1px solid #e0e0e0', 
                            borderRadius: 8,
                            fontSize: 14,
                            boxSizing: 'border-box',
                            outline: 'none',
                            transition: 'all 0.3s ease'
                        }}
                        onFocus={(e) => {
                            e.currentTarget.style.borderColor = '#667eea';
                            e.currentTarget.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
                        }}
                        onBlur={(e) => {
                            e.currentTarget.style.borderColor = '#e0e0e0';
                            e.currentTarget.style.boxShadow = 'none';
                        }}
                    />
                </div>

                <div style={{ marginTop: 20 }}>
                    <label style={{ display: 'block', fontWeight: 600, marginBottom: 6, fontSize: 14, color: '#4a4a6a' }}>
                        Adres
                    </label>
                    <input
                        type="text"
                        name="address"
                        value={form.address}
                        onChange={handleChange}
                        style={{ 
                            width: '100%', 
                            padding: '10px 14px', 
                            border: '1px solid #e0e0e0', 
                            borderRadius: 8,
                            fontSize: 14,
                            boxSizing: 'border-box',
                            outline: 'none',
                            transition: 'all 0.3s ease'
                        }}
                        onFocus={(e) => {
                            e.currentTarget.style.borderColor = '#667eea';
                            e.currentTarget.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
                        }}
                        onBlur={(e) => {
                            e.currentTarget.style.borderColor = '#e0e0e0';
                            e.currentTarget.style.boxShadow = 'none';
                        }}
                    />
                </div>

                <div style={{ marginTop: 20 }}>
                    <label style={{ display: 'block', fontWeight: 600, marginBottom: 6, fontSize: 14, color: '#4a4a6a' }}>
                        Doğum Tarihi
                    </label>
                    <input
                        type="date"
                        name="birthDate"
                        value={form.birthDate}
                        onChange={handleChange}
                        style={{ 
                            width: '100%', 
                            padding: '10px 14px', 
                            border: '1px solid #e0e0e0', 
                            borderRadius: 8,
                            fontSize: 14,
                            boxSizing: 'border-box',
                            outline: 'none',
                            transition: 'all 0.3s ease'
                        }}
                        onFocus={(e) => {
                            e.currentTarget.style.borderColor = '#667eea';
                            e.currentTarget.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
                        }}
                        onBlur={(e) => {
                            e.currentTarget.style.borderColor = '#e0e0e0';
                            e.currentTarget.style.boxShadow = 'none';
                        }}
                    />
                </div>

                <div style={{ marginTop: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
                    <input
                        type="checkbox"
                        name="isActive"
                        checked={form.isActive}
                        onChange={handleChange}
                        style={{ width: 18, height: 18, cursor: 'pointer' }}
                    />
                    <label style={{ fontSize: 14, color: '#4a4a6a', cursor: 'pointer' }}>
                        Aktif
                    </label>
                </div>

                <div style={{ marginTop: 28, display: 'flex', gap: 12, borderTop: '1px solid #f0f0f0', paddingTop: 24 }}>
                    <button
                        type="submit"
                        disabled={saving}
                        style={{
                            background: 'linear-gradient(135deg, #667eea, #764ba2)',
                            color: 'white',
                            border: 'none',
                            padding: '12px 32px',
                            borderRadius: 10,
                            cursor: saving ? 'not-allowed' : 'pointer',
                            opacity: saving ? 0.7 : 1,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            fontSize: 15,
                            fontWeight: 600,
                            transition: 'all 0.3s ease',
                            boxShadow: '0 2px 8px rgba(102, 126, 234, 0.3)'
                        }}
                        onMouseEnter={(e) => {
                            if (!saving) {
                                e.currentTarget.style.transform = 'translateY(-2px)';
                                e.currentTarget.style.boxShadow = '0 4px 16px rgba(102, 126, 234, 0.4)';
                            }
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = '0 2px 8px rgba(102, 126, 234, 0.3)';
                        }}
                    >
                        {saving ? <FaSpinner style={{ animation: 'spin 1s linear infinite' }} /> : <FaSave />}
                        {saving ? 'Kaydediliyor...' : 'Güncelle'}
                    </button>
                    <Link
                        to={`/students/${id}`}
                        style={{
                            background: 'none',
                            border: '1px solid #e0e0e0',
                            padding: '12px 24px',
                            borderRadius: 10,
                            textDecoration: 'none',
                            color: '#4a4a6a',
                            fontSize: 14,
                            fontWeight: 500,
                            transition: 'all 0.3s ease',
                            display: 'flex',
                            alignItems: 'center'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = '#f8f9fa';
                            e.currentTarget.style.borderColor = '#d0d0d0';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'none';
                            e.currentTarget.style.borderColor = '#e0e0e0';
                        }}
                    >
                        İptal
                    </Link>
                </div>
            </form>

            <style>{`
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </>
    );
};

export default StudentEdit;