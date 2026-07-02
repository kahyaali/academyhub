import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaSave, FaSpinner } from 'react-icons/fa';
import Swal from 'sweetalert2';
import api from '../../api/api';

const StudentCreate = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        confirmPassword: '',
        phoneNumber: '',
        address: '',
        birthDate: '',
        profileImage: ''
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm({ ...form, [name]: value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (form.password !== form.confirmPassword) {
            Swal.fire({
                icon: 'warning',
                title: 'Uyarı',
                text: 'Şifreler eşleşmiyor!',
                confirmButtonColor: '#667eea'
            });
            return;
        }

        setLoading(true);
        try {
            const payload = {
                ...form,
                role: 1  
            };

            await api.post('/auth/register', payload);

            Swal.fire({
                icon: 'success',
                title: 'Başarılı!',
                text: 'Öğrenci başarıyla oluşturuldu.',
                timer: 2000,
                showConfirmButton: false
            });

            navigate('/students');
        } catch (err) {
            const errorMessage = err.response?.data?.message || 'Öğrenci oluşturulurken hata oluştu!';
            Swal.fire({
                icon: 'error',
                title: 'Hata!',
                text: errorMessage,
                confirmButtonColor: '#ef4444'
            });
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
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
                <button onClick={() => navigate('/students')} style={{
                    background: 'none', 
                    border: 'none', 
                    fontSize: 20, 
                    cursor: 'pointer',
                    width: 44,
                    height: 44,
                    borderRadius: '50%',
                    background: '#f8f9fa',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#6c757d',
                    fontSize: 18,
                    transition: 'all 0.3s ease'
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
                </button>
                <div>
                    <h1 style={{ fontSize: 28, margin: 0, color: '#1a1a2e' }}>➕ Yeni Öğrenci</h1>
                    <p style={{ color: '#6c757d', margin: 4, fontSize: 14 }}>Sisteme yeni öğrenci ekleyin</p>
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
                        E-posta *
                    </label>
                    <input
                        type="email"
                        name="email"
                        value={form.email}
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

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginTop: 20 }}>
                    <div>
                        <label style={{ display: 'block', fontWeight: 600, marginBottom: 6, fontSize: 14, color: '#4a4a6a' }}>
                            Şifre *
                        </label>
                        <input
                            type="password"
                            name="password"
                            value={form.password}
                            onChange={handleChange}
                            required
                            minLength={8}
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
                            Şifre Tekrar *
                        </label>
                        <input
                            type="password"
                            name="confirmPassword"
                            value={form.confirmPassword}
                            onChange={handleChange}
                            required
                            minLength={8}
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

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginTop: 20 }}>
                    <div>
                        <label style={{ display: 'block', fontWeight: 600, marginBottom: 6, fontSize: 14, color: '#4a4a6a' }}>
                            Telefon
                        </label>
                        <input
                            type="text"
                            name="phoneNumber"
                            value={form.phoneNumber}
                            onChange={handleChange}
                            placeholder="05xx xxx xx xx"
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
                </div>

                <div style={{ marginTop: 20 }}>
                    <label style={{ display: 'block', fontWeight: 600, marginBottom: 6, fontSize: 14, color: '#4a4a6a' }}>
                        Adres
                    </label>
                    <textarea
                        name="address"
                        value={form.address}
                        onChange={handleChange}
                        rows={2}
                        placeholder="Adres bilgisi..."
                        style={{ 
                            width: '100%', 
                            padding: '10px 14px', 
                            border: '1px solid #e0e0e0', 
                            borderRadius: 8,
                            fontSize: 14,
                            fontFamily: 'inherit',
                            boxSizing: 'border-box',
                            outline: 'none',
                            transition: 'all 0.3s ease',
                            resize: 'vertical'
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

                <div style={{ marginTop: 28, display: 'flex', gap: 12, borderTop: '1px solid #f0f0f0', paddingTop: 24 }}>
                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            background: 'linear-gradient(135deg, #667eea, #764ba2)',
                            color: 'white',
                            border: 'none',
                            padding: '12px 32px',
                            borderRadius: 10,
                            cursor: loading ? 'not-allowed' : 'pointer',
                            opacity: loading ? 0.7 : 1,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            fontSize: 15,
                            fontWeight: 600,
                            transition: 'all 0.3s ease',
                            boxShadow: '0 2px 8px rgba(102, 126, 234, 0.3)'
                        }}
                        onMouseEnter={(e) => {
                            if (!loading) {
                                e.currentTarget.style.transform = 'translateY(-2px)';
                                e.currentTarget.style.boxShadow = '0 4px 16px rgba(102, 126, 234, 0.4)';
                            }
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = '0 2px 8px rgba(102, 126, 234, 0.3)';
                        }}
                    >
                        {loading ? <FaSpinner style={{ animation: 'spin 1s linear infinite' }} /> : <FaSave />}
                        {loading ? 'Kaydediliyor...' : 'Ekle'}
                    </button>
                    <button
                        type="button"
                        onClick={() => navigate('/students')}
                        style={{
                            background: 'none',
                            border: '1px solid #e0e0e0',
                            padding: '12px 24px',
                            borderRadius: 10,
                            cursor: 'pointer',
                            color: '#4a4a6a',
                            fontSize: 14,
                            fontWeight: 500,
                            transition: 'all 0.3s ease'
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
                    </button>
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

export default StudentCreate;