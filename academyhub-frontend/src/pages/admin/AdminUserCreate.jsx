import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaUserPlus, FaSpinner, FaUser, FaEnvelope, FaPhone, FaMapMarkerAlt, FaLock } from 'react-icons/fa';
import Swal from 'sweetalert2';
import api from '../../api/api';

const AdminUserCreate = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        confirmPassword: '', 
        role: 'Admin',
        phoneNumber: '',
        address: '',
        bio: '',
        expertise: ''
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        //  Şifre kontrolü
        if (formData.password !== formData.confirmPassword) {
            Swal.fire({
                icon: 'error',
                title: 'Hata!',
                text: 'Şifreler eşleşmiyor!',
                confirmButtonColor: '#ef4444'
            });
            return;
        }

        if (formData.password.length < 8) {
            Swal.fire({
                icon: 'error',
                title: 'Hata!',
                text: 'Şifre en az 8 karakter olmalıdır!',
                confirmButtonColor: '#ef4444'
            });
            return;
        }

        setLoading(true);
        try {
         
            const payload = {
                firstName: formData.firstName,
                lastName: formData.lastName,
                email: formData.email,
                password: formData.password,
                confirmPassword: formData.confirmPassword,  
                role: formData.role,
                phoneNumber: formData.phoneNumber || null,
                address: formData.address || null,
                bio: formData.bio || null,
                expertise: formData.expertise || null
            };

            console.log('📤 Gönderilen veri:', payload);

            const response = await api.post('/auth/register', payload);
            console.log('📥 Gelen cevap:', response.data);
            
            Swal.fire({
                icon: 'success',
                title: '🎉 Başarılı!',
                text: `${formData.role} kullanıcı başarıyla oluşturuldu.`,
                timer: 2500,
                showConfirmButton: false,
                background: '#f0fdf4',
                iconColor: '#10b981'
            });
            
            //  Formu temizle
            setFormData({
                firstName: '',
                lastName: '',
                email: '',
                password: '',
                confirmPassword: '',
                role: 'Admin',
                phoneNumber: '',
                address: '',
                bio: '',
                expertise: ''
            });
            
            navigate('/dashboard');
            
        } catch (err) {
            console.error('❌ Kullanıcı oluşturma hatası:', err);
            console.error('❌ Hata detayı:', err.response?.data);
            
            let errorMessage = 'Kullanıcı oluşturulamadı!';
            
            if (err.response?.data?.message) {
                errorMessage = err.response.data.message;
            } else if (err.response?.data?.errors) {
                const errors = Object.values(err.response.data.errors).flat();
                errorMessage = errors.join(', ');
            }
            
            Swal.fire({
                icon: 'error',
                title: 'Hata!',
                text: errorMessage,
                confirmButtonColor: '#ef4444',
                confirmButtonText: 'Tamam'
            });
        } finally {
            setLoading(false);
        }
    };

    const roleOptions = [
        { value: 'Admin', label: '🛡️ Admin' },
        { value: 'Instructor', label: '👨‍🏫 Eğitmen' },
        { value: 'Student', label: '🎓 Öğrenci' }
    ];

    return (
        <div style={{ maxWidth: 700, margin: '0 auto', padding: '24px 20px' }}>
            <div style={{ marginBottom: 24 }}>
                <h1 style={{ fontSize: 28, fontWeight: 700, color: '#0f0c29', margin: 0, display: 'flex', alignItems: 'center', gap: 12 }}>
                    <FaUserPlus style={{ color: '#667eea' }} /> Yeni Kullanıcı Oluştur
                </h1>
                <p style={{ color: '#6b7280', margin: '4px 0 0 0', fontSize: 15 }}>
                    Admin, Eğitmen veya Öğrenci hesabı oluşturun
                </p>
            </div>

            <form onSubmit={handleSubmit} style={{
                background: 'white',
                padding: '32px',
                borderRadius: 16,
                boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
                border: '1px solid rgba(0,0,0,0.04)'
            }}>
                {/* Ad - Soyad */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                    <div>
                        <label style={{ display: 'block', fontWeight: 600, marginBottom: 6, fontSize: 14, color: '#374151' }}>
                            <FaUser style={{ fontSize: 12, marginRight: 4 }} /> Ad <span style={{ color: '#ef4444' }}>*</span>
                        </label>
                        <input
                            type="text"
                            name="firstName"
                            value={formData.firstName}
                            onChange={handleChange}
                            placeholder="Ad"
                            required
                            style={{
                                width: '100%',
                                padding: '10px 14px',
                                border: '2px solid #e5e7eb',
                                borderRadius: 10,
                                fontSize: 14,
                                outline: 'none',
                                transition: 'border-color 0.3s'
                            }}
                            onFocus={(e) => e.target.style.borderColor = '#667eea'}
                            onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', fontWeight: 600, marginBottom: 6, fontSize: 14, color: '#374151' }}>
                            <FaUser style={{ fontSize: 12, marginRight: 4 }} /> Soyad <span style={{ color: '#ef4444' }}>*</span>
                        </label>
                        <input
                            type="text"
                            name="lastName"
                            value={formData.lastName}
                            onChange={handleChange}
                            placeholder="Soyad"
                            required
                            style={{
                                width: '100%',
                                padding: '10px 14px',
                                border: '2px solid #e5e7eb',
                                borderRadius: 10,
                                fontSize: 14,
                                outline: 'none',
                                transition: 'border-color 0.3s'
                            }}
                            onFocus={(e) => e.target.style.borderColor = '#667eea'}
                            onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                        />
                    </div>
                </div>

                {/* Email */}
                <div style={{ marginBottom: 16 }}>
                    <label style={{ display: 'block', fontWeight: 600, marginBottom: 6, fontSize: 14, color: '#374151' }}>
                        <FaEnvelope style={{ fontSize: 12, marginRight: 4 }} /> E-posta <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="ornek@email.com"
                        required
                        style={{
                            width: '100%',
                            padding: '10px 14px',
                            border: '2px solid #e5e7eb',
                            borderRadius: 10,
                            fontSize: 14,
                            outline: 'none',
                            transition: 'border-color 0.3s'
                        }}
                        onFocus={(e) => e.target.style.borderColor = '#667eea'}
                        onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                    />
                </div>

                {/* Şifre */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                    <div>
                        <label style={{ display: 'block', fontWeight: 600, marginBottom: 6, fontSize: 14, color: '#374151' }}>
                            <FaLock style={{ fontSize: 12, marginRight: 4 }} /> Şifre <span style={{ color: '#ef4444' }}>*</span>
                        </label>
                        <input
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            placeholder="En az 8 karakter"
                            required
                            minLength={8}
                            style={{
                                width: '100%',
                                padding: '10px 14px',
                                border: '2px solid #e5e7eb',
                                borderRadius: 10,
                                fontSize: 14,
                                outline: 'none',
                                transition: 'border-color 0.3s'
                            }}
                            onFocus={(e) => e.target.style.borderColor = '#667eea'}
                            onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', fontWeight: 600, marginBottom: 6, fontSize: 14, color: '#374151' }}>
                            <FaLock style={{ fontSize: 12, marginRight: 4 }} /> Şifre Tekrar <span style={{ color: '#ef4444' }}>*</span>
                        </label>
                        <input
                            type="password"
                            name="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            placeholder="Şifreyi tekrar girin"
                            required
                            style={{
                                width: '100%',
                                padding: '10px 14px',
                                border: '2px solid #e5e7eb',
                                borderRadius: 10,
                                fontSize: 14,
                                outline: 'none',
                                transition: 'border-color 0.3s'
                            }}
                            onFocus={(e) => e.target.style.borderColor = '#667eea'}
                            onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                        />
                    </div>
                </div>

                {/* Rol Seçimi */}
                <div style={{ marginBottom: 16 }}>
                    <label style={{ display: 'block', fontWeight: 600, marginBottom: 6, fontSize: 14, color: '#374151' }}>
                        Rol <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <select
                        name="role"
                        value={formData.role}
                        onChange={handleChange}
                        required
                        style={{
                            width: '100%',
                            padding: '10px 14px',
                            border: '2px solid #e5e7eb',
                            borderRadius: 10,
                            fontSize: 14,
                            outline: 'none',
                            transition: 'border-color 0.3s',
                            background: 'white',
                            cursor: 'pointer'
                        }}
                        onFocus={(e) => e.target.style.borderColor = '#667eea'}
                        onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                    >
                        {roleOptions.map(option => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Telefon */}
                <div style={{ marginBottom: 16 }}>
                    <label style={{ display: 'block', fontWeight: 600, marginBottom: 6, fontSize: 14, color: '#374151' }}>
                        <FaPhone style={{ fontSize: 12, marginRight: 4 }} /> Telefon (Opsiyonel)
                    </label>
                    <input
                        type="tel"
                        name="phoneNumber"
                        value={formData.phoneNumber}
                        onChange={handleChange}
                        placeholder="05XX XXX XX XX"
                        style={{
                            width: '100%',
                            padding: '10px 14px',
                            border: '2px solid #e5e7eb',
                            borderRadius: 10,
                            fontSize: 14,
                            outline: 'none',
                            transition: 'border-color 0.3s'
                        }}
                        onFocus={(e) => e.target.style.borderColor = '#667eea'}
                        onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                    />
                </div>

                {/* Adres */}
                <div style={{ marginBottom: 16 }}>
                    <label style={{ display: 'block', fontWeight: 600, marginBottom: 6, fontSize: 14, color: '#374151' }}>
                        <FaMapMarkerAlt style={{ fontSize: 12, marginRight: 4 }} /> Adres (Opsiyonel)
                    </label>
                    <textarea
                        name="address"
                        value={formData.address}
                        onChange={handleChange}
                        placeholder="Adres bilgisi"
                        rows={2}
                        style={{
                            width: '100%',
                            padding: '10px 14px',
                            border: '2px solid #e5e7eb',
                            borderRadius: 10,
                            fontSize: 14,
                            outline: 'none',
                            transition: 'border-color 0.3s',
                            resize: 'vertical',
                            fontFamily: 'inherit'
                        }}
                        onFocus={(e) => e.target.style.borderColor = '#667eea'}
                        onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                    />
                </div>

                {/* Submit */}
                <button
                    type="submit"
                    disabled={loading}
                    style={{
                        width: '100%',
                        padding: '12px',
                        background: 'linear-gradient(135deg, #667eea, #764ba2)',
                        color: 'white',
                        border: 'none',
                        borderRadius: 10,
                        fontSize: 16,
                        fontWeight: 600,
                        cursor: loading ? 'not-allowed' : 'pointer',
                        opacity: loading ? 0.7 : 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 10,
                        transition: 'all 0.3s ease'
                    }}
                    onMouseEnter={(e) => {
                        if (!loading) {
                            e.currentTarget.style.transform = 'translateY(-2px)';
                            e.currentTarget.style.boxShadow = '0 8px 24px rgba(102,126,234,0.3)';
                        }
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = 'none';
                    }}
                >
                    {loading ? <FaSpinner style={{ animation: 'spin 1s linear infinite' }} /> : <FaUserPlus />}
                    {loading ? 'Oluşturuluyor...' : 'Kullanıcı Oluştur'}
                </button>
            </form>
        </div>
    );
};

export default AdminUserCreate;