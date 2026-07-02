import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaSave, FaSpinner, FaKey } from 'react-icons/fa';
import Swal from 'sweetalert2';
import api from '../../api/api';
import { useAuth } from '../../contexts/AuthContext';

const StudentProfile = () => {
    const { user } = useAuth();
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
        profileImage: ''
    });

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            setLoading(true);
            const res = await api.get('/student/profile');
            console.log('📸 Profil verisi:', res.data);
            
            const data = res.data.data;
            setForm({
                firstName: data.firstName || '',
                lastName: data.lastName || '',
                email: data.email || '',
                phoneNumber: data.phoneNumber || '',
                address: data.address || '',
                birthDate: data.birthDate ? data.birthDate.split('T')[0] : '',
                profileImage: data.profileImage || ''
            });
        } catch (err) {
            console.error('Profil yüklenirken hata:', err);
            Swal.fire({
                icon: 'error',
                title: 'Hata!',
                text: err.response?.data?.message || 'Profil bilgileri yüklenemedi!',
                confirmButtonColor: '#ef4444'
            });
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm({ ...form, [name]: value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            await api.put('/student/profile', {
                firstName: form.firstName,
                lastName: form.lastName,
                phoneNumber: form.phoneNumber,
                address: form.address,
                birthDate: form.birthDate
            });
            
            Swal.fire({
                icon: 'success',
                title: 'Başarılı!',
                text: 'Profil bilgileriniz güncellendi.',
                timer: 2000,
                showConfirmButton: false
            });
            
            await fetchProfile();
        } catch (err) {
            console.error('Güncelleme hatası:', err);
            Swal.fire({
                icon: 'error',
                title: 'Hata!',
                text: err.response?.data?.message || 'Güncelleme başarısız!',
                confirmButtonColor: '#ef4444'
            });
        } finally {
            setSaving(false);
        }
    };

   
    const handleChangePassword = async () => {
        const { value: formValues } = await Swal.fire({
            title: '🔑 Şifre Değiştir',
            html: `
                <div style="text-align: left; padding: 0 10px;">
                    <div style="margin-bottom: 16px;">
                        <label style="display: block; font-weight: 600; margin-bottom: 6px; color: #374151; font-size: 14px;">
                            Mevcut Şifre
                        </label>
                        <div style="display: flex; align-items: center; background: #f3f4f6; border-radius: 10px; border: 2px solid #e5e7eb; transition: border-color 0.3s;">
                            <input 
                                id="currentPassword" 
                                class="swal2-input" 
                                type="password" 
                                placeholder="Mevcut şifrenizi girin" 
                                style="border: none !important; background: transparent !important; flex: 1; padding: 12px 16px; font-size: 15px; outline: none; box-shadow: none !important;"
                            />
                            <button 
                                id="toggleCurrentPassword" 
                                type="button"
                                style="background: transparent; border: none; padding: 0 16px; cursor: pointer; font-size: 18px; color: #6b7280;"
                            >
                                👁️
                            </button>
                        </div>
                    </div>
                    
                    <div style="margin-bottom: 16px;">
                        <label style="display: block; font-weight: 600; margin-bottom: 6px; color: #374151; font-size: 14px;">
                            Yeni Şifre
                        </label>
                        <div style="display: flex; align-items: center; background: #f3f4f6; border-radius: 10px; border: 2px solid #e5e7eb; transition: border-color 0.3s;">
                            <input 
                                id="newPassword" 
                                class="swal2-input" 
                                type="password" 
                                placeholder="En az 8 karakter" 
                                style="border: none !important; background: transparent !important; flex: 1; padding: 12px 16px; font-size: 15px; outline: none; box-shadow: none !important;"
                            />
                            <button 
                                id="toggleNewPassword" 
                                type="button"
                                style="background: transparent; border: none; padding: 0 16px; cursor: pointer; font-size: 18px; color: #6b7280;"
                            >
                                👁️
                            </button>
                        </div>
                        <div style="font-size: 12px; color: #6b7280; margin-top: 4px;">
                            🔒 En az 8 karakter olmalıdır
                        </div>
                    </div>
                    
                    <div style="margin-bottom: 8px;">
                        <label style="display: block; font-weight: 600; margin-bottom: 6px; color: #374151; font-size: 14px;">
                            Yeni Şifre Tekrar
                        </label>
                        <div style="display: flex; align-items: center; background: #f3f4f6; border-radius: 10px; border: 2px solid #e5e7eb; transition: border-color 0.3s;">
                            <input 
                                id="confirmPassword" 
                                class="swal2-input" 
                                type="password" 
                                placeholder="Yeni şifreyi tekrar girin" 
                                style="border: none !important; background: transparent !important; flex: 1; padding: 12px 16px; font-size: 15px; outline: none; box-shadow: none !important;"
                            />
                            <button 
                                id="toggleConfirmPassword" 
                                type="button"
                                style="background: transparent; border: none; padding: 0 16px; cursor: pointer; font-size: 18px; color: #6b7280;"
                            >
                                👁️
                            </button>
                        </div>
                    </div>
                </div>
            `,
            confirmButtonText: '✅ Şifreyi Güncelle',
            cancelButtonText: '❌ İptal',
            showCancelButton: true,
            confirmButtonColor: '#667eea',
            cancelButtonColor: '#6b7280',
            width: 500,
            padding: '20px',
            backdrop: 'rgba(0,0,0,0.5)',
            didOpen: () => {
                //  Şifre göster/gizle özelliği
                const togglePassword = (inputId, buttonId) => {
                    const input = document.getElementById(inputId);
                    const button = document.getElementById(buttonId);
                    if (input && button) {
                        button.addEventListener('click', () => {
                            const type = input.getAttribute('type') === 'password' ? 'text' : 'password';
                            input.setAttribute('type', type);
                            button.textContent = type === 'password' ? '👁️' : '🙈';
                        });
                    }
                };
                
                togglePassword('currentPassword', 'toggleCurrentPassword');
                togglePassword('newPassword', 'toggleNewPassword');
                togglePassword('confirmPassword', 'toggleConfirmPassword');
                
          
                document.querySelectorAll('.swal2-input').forEach(input => {
                    input.addEventListener('focus', () => {
                        input.closest('div[style*="display: flex"]').style.borderColor = '#667eea';
                    });
                    input.addEventListener('blur', () => {
                        input.closest('div[style*="display: flex"]').style.borderColor = '#e5e7eb';
                    });
                });
            },
            preConfirm: () => {
                const currentPassword = document.getElementById('currentPassword').value;
                const newPassword = document.getElementById('newPassword').value;
                const confirmPassword = document.getElementById('confirmPassword').value;
                
                if (!currentPassword || !newPassword || !confirmPassword) {
                    Swal.showValidationMessage('⚠️ Tüm alanları doldurun!');
                    return false;
                }
                if (newPassword !== confirmPassword) {
                    Swal.showValidationMessage('⚠️ Şifreler eşleşmiyor!');
                    return false;
                }
                if (newPassword.length < 8) {
                    Swal.showValidationMessage('⚠️ Şifre en az 8 karakter olmalıdır!');
                    return false;
                }
                return { currentPassword, newPassword };
            }
        });

        if (formValues) {
            try {
                console.log('📤 Gönderilen veri:', {
                    currentPassword: formValues.currentPassword,
                    newPassword: formValues.newPassword
                });

                const response = await api.post('/auth/change-password', {
                    currentPassword: formValues.currentPassword,
                    newPassword: formValues.newPassword
                });
                
                console.log('📥 Gelen cevap:', response.data);

                Swal.fire({
                    icon: 'success',
                    title: '🎉 Başarılı!',
                    text: 'Şifreniz başarıyla değiştirildi.',
                    timer: 2500,
                    showConfirmButton: false,
                    background: '#f0fdf4',
                    iconColor: '#10b981'
                });
            } catch (err) {
                console.error('❌ Şifre değiştirme hatası:', err);
                console.error('❌ Hata detayı:', err.response?.data);
                console.error('❌ Hata status:', err.response?.status);
                
                let errorMessage = 'Şifre değiştirilemedi!';
                
                if (err.response?.data?.errors) {
                    if (typeof err.response.data.errors === 'object') {
                        const errorValues = Object.values(err.response.data.errors);
                        if (errorValues.length > 0) {
                            errorMessage = errorValues.flat().join(', ');
                        }
                    } else if (Array.isArray(err.response.data.errors)) {
                        errorMessage = err.response.data.errors.join(', ');
                    } else {
                        errorMessage = String(err.response.data.errors);
                    }
                } else if (err.response?.data?.message) {
                    errorMessage = err.response.data.message;
                }
                
                Swal.fire({
                    icon: 'error',
                    title: '❌ Hata!',
                    text: errorMessage,
                    confirmButtonColor: '#ef4444',
                    confirmButtonText: 'Tamam'
                });
            }
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
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px 20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <div>
                    <h1 style={{ fontSize: 28, margin: 0 }}>👤 Profil</h1>
                    <p style={{ color: '#6c757d', margin: 4 }}>Kişisel bilgilerinizi yönetin</p>
                </div>
                <button
                    onClick={handleChangePassword}
                    style={{
                        background: '#667eea',
                        color: 'white',
                        border: 'none',
                        padding: '10px 20px',
                        borderRadius: 8,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        fontSize: 14,
                        fontWeight: 600
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = '#764ba2'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = '#667eea'; }}
                >
                    <FaKey /> Şifre Değiştir
                </button>
            </div>

            <form onSubmit={handleSubmit} style={{ background: 'white', padding: 24, borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <div>
                        <label style={{ display: 'block', fontWeight: 600, marginBottom: 4 }}>Ad</label>
                        <input
                            type="text"
                            name="firstName"
                            value={form.firstName}
                            onChange={handleChange}
                            style={{ width: '100%', padding: 10, border: '1px solid #d1d5db', borderRadius: 8 }}
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', fontWeight: 600, marginBottom: 4 }}>Soyad</label>
                        <input
                            type="text"
                            name="lastName"
                            value={form.lastName}
                            onChange={handleChange}
                            style={{ width: '100%', padding: 10, border: '1px solid #d1d5db', borderRadius: 8 }}
                        />
                    </div>
                </div>

                <div style={{ marginTop: 16 }}>
                    <label style={{ display: 'block', fontWeight: 600, marginBottom: 4 }}>E-posta</label>
                    <input
                        type="email"
                        value={form.email}
                        disabled
                        style={{ width: '100%', padding: 10, border: '1px solid #d1d5db', borderRadius: 8, background: '#f0f0f0' }}
                    />
                </div>

                <div style={{ marginTop: 16 }}>
                    <label style={{ display: 'block', fontWeight: 600, marginBottom: 4 }}>Telefon</label>
                    <input
                        type="text"
                        name="phoneNumber"
                        value={form.phoneNumber}
                        onChange={handleChange}
                        style={{ width: '100%', padding: 10, border: '1px solid #d1d5db', borderRadius: 8 }}
                    />
                </div>

                <div style={{ marginTop: 16 }}>
                    <label style={{ display: 'block', fontWeight: 600, marginBottom: 4 }}>Adres</label>
                    <textarea
                        name="address"
                        value={form.address}
                        onChange={handleChange}
                        rows={3}
                        style={{ width: '100%', padding: 10, border: '1px solid #d1d5db', borderRadius: 8 }}
                    />
                </div>

                <div style={{ marginTop: 16 }}>
                    <label style={{ display: 'block', fontWeight: 600, marginBottom: 4 }}>Doğum Tarihi</label>
                    <input
                        type="date"
                        name="birthDate"
                        value={form.birthDate}
                        onChange={handleChange}
                        style={{ width: '100%', padding: 10, border: '1px solid #d1d5db', borderRadius: 8 }}
                    />
                </div>

                <div style={{ marginTop: 24, display: 'flex', gap: 12 }}>
                    <button
                        type="submit"
                        disabled={saving}
                        style={{
                            background: 'linear-gradient(135deg, #667eea, #764ba2)',
                            color: 'white',
                            border: 'none',
                            padding: '10px 32px',
                            borderRadius: 8,
                            cursor: saving ? 'not-allowed' : 'pointer',
                            opacity: saving ? 0.7 : 1,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8
                        }}
                    >
                        {saving ? <FaSpinner style={{ animation: 'spin 1s linear infinite' }} /> : <FaSave />}
                        {saving ? 'Kaydediliyor...' : 'Güncelle'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default StudentProfile;