import React, { useState, useEffect } from 'react';
import { FaUser, FaEnvelope, FaPhone, FaMapMarker, FaCog, FaSpinner, FaKey, FaSave, FaEye, FaEyeSlash } from 'react-icons/fa';
import Swal from 'sweetalert2';
import api from '../../api/api';
import { useAuth } from '../../contexts/AuthContext';

const AdminProfile = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [profile, setProfile] = useState(null);
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        phoneNumber: '',
        address: ''
    });

    // 🔥🔥🔥 ARTIK ISSYSTEMADMIN İLE KONTROL ET (Backend'den gelen) 🔥🔥🔥
    const isSystemAdmin = user?.isSystemAdmin === true;

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            setLoading(true);
            const res = await api.get('/auth/me');
            console.log('📸 Admin profil verisi:', res.data);
            
            const data = res.data.data;
            setProfile(data);
            setFormData({
                firstName: data.firstName || '',
                lastName: data.lastName || '',
                phoneNumber: data.phoneNumber || '',
                address: data.address || ''
            });
        } catch (err) {
            console.error('Profil yüklenirken hata:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (isSystemAdmin) {
            Swal.fire({
                icon: 'warning',
                title: 'Yetkisiz İşlem!',
                text: 'Sistem admini bilgileri güncellenemez.',
                confirmButtonColor: '#f59e0b'
            });
            return;
        }

        setUpdating(true);
        try {
            await api.put(`/user/${user.id}`, {
                firstName: formData.firstName,
                lastName: formData.lastName,
                phoneNumber: formData.phoneNumber,
                address: formData.address
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
                text: err.response?.data?.message || 'Profil güncellenemedi!',
                confirmButtonColor: '#ef4444'
            });
        } finally {
            setUpdating(false);
        }
    };

    // 🔥🔥🔥 ŞİFRE DEĞİŞTİRME - ŞIK VE MODERN 🔥🔥🔥
    const handleChangePassword = async () => {
        if (isSystemAdmin) {
            Swal.fire({
                icon: 'warning',
                title: 'Yetkisiz İşlem!',
                text: 'Sistem admini şifresi değiştirilemez.',
                confirmButtonColor: '#f59e0b'
            });
            return;
        }

        const { value: formValues } = await Swal.fire({
            title: '🔑 Şifre Değiştir',
            html: `
                <div style="text-align: left; padding: 0 10px;">
                    <div style="margin-bottom: 18px;">
                        <label style="display: block; font-weight: 600; margin-bottom: 6px; font-size: 14px; color: #374151;">
                            Mevcut Şifre
                        </label>
                        <div style="display: flex; align-items: center; background: #f3f4f6; border: 2px solid #e5e7eb; border-radius: 10px; transition: border-color 0.3s;">
                            <input 
                                id="currentPassword" 
                                type="password" 
                                placeholder="Mevcut şifrenizi girin" 
                                style="flex: 1; border: none; background: transparent; padding: 12px 16px; font-size: 15px; outline: none;"
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
                    
                    <div style="margin-bottom: 18px;">
                        <label style="display: block; font-weight: 600; margin-bottom: 6px; font-size: 14px; color: #374151;">
                            Yeni Şifre
                        </label>
                        <div style="display: flex; align-items: center; background: #f3f4f6; border: 2px solid #e5e7eb; border-radius: 10px; transition: border-color 0.3s;">
                            <input 
                                id="newPassword" 
                                type="password" 
                                placeholder="En az 8 karakter" 
                                style="flex: 1; border: none; background: transparent; padding: 12px 16px; font-size: 15px; outline: none;"
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
                        <label style="display: block; font-weight: 600; margin-bottom: 6px; font-size: 14px; color: #374151;">
                            Yeni Şifre Tekrar
                        </label>
                        <div style="display: flex; align-items: center; background: #f3f4f6; border: 2px solid #e5e7eb; border-radius: 10px; transition: border-color 0.3s;">
                            <input 
                                id="confirmPassword" 
                                type="password" 
                                placeholder="Yeni şifreyi tekrar girin" 
                                style="flex: 1; border: none; background: transparent; padding: 12px 16px; font-size: 15px; outline: none;"
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
                // 🔥 Şifre göster/gizle özelliği
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
                
                // 🔥 Input focus için border efekti
                document.querySelectorAll('.swal2-input, input[id$="Password"]').forEach(input => {
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
                await api.post('/auth/change-password', {
                    currentPassword: formValues.currentPassword,
                    newPassword: formValues.newPassword
                });
                
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
                console.error('Şifre değiştirme hatası:', err);
                
                let errorMessage = 'Şifre değiştirilemedi!';
                if (err.response?.data?.message) {
                    errorMessage = err.response.data.message;
                } else if (err.response?.data?.errors) {
                    const errors = Object.values(err.response.data.errors).flat();
                    errorMessage = errors.join(', ');
                }
                
                Swal.fire({
                    icon: 'error',
                    title: '❌ Hata!',
                    text: errorMessage,
                    confirmButtonColor: '#ef4444'
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
        <div style={{ maxWidth: 800, margin: '0 auto', padding: '24px 20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <div>
                    <h1 style={{ fontSize: 28, fontWeight: 700, color: '#0f0c29', margin: 0, display: 'flex', alignItems: 'center', gap: 12 }}>
                        <FaCog style={{ color: '#667eea' }} /> Admin Profili
                    </h1>
                    <p style={{ color: '#6b7280', margin: '4px 0 0 0', fontSize: 15 }}>
                        🛡️ {isSystemAdmin ? '⭐ Sistem Admini - Sadece Görüntüleme' : 'Admin bilgilerinizi yönetin'}
                    </p>
                </div>
                {!isSystemAdmin && (
                    <button
                        onClick={handleChangePassword}
                        style={{
                            padding: '10px 24px',
                            background: 'linear-gradient(135deg, #667eea, #764ba2)',
                            color: 'white',
                            border: 'none',
                            borderRadius: 10,
                            fontSize: 14,
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            transition: 'all 0.3s ease',
                            boxShadow: '0 4px 14px rgba(102,126,234,0.3)'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-2px)';
                            e.currentTarget.style.boxShadow = '0 8px 24px rgba(102,126,234,0.4)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = '0 4px 14px rgba(102,126,234,0.3)';
                        }}
                    >
                        <FaKey /> Şifre Değiştir
                    </button>
                )}
            </div>

            {isSystemAdmin && (
                <div style={{
                    padding: '12px 16px',
                    background: '#fef3c7',
                    borderRadius: 10,
                    border: '1px solid #f59e0b',
                    color: '#92400e',
                    fontSize: 14,
                    marginBottom: 20,
                    textAlign: 'center'
                }}>
                    ⚠️ Bu bir sistem adminidir. Bilgiler ve şifre değiştirilemez.
                </div>
            )}

            <form onSubmit={handleSubmit} style={{
                background: 'white',
                padding: '32px',
                borderRadius: 16,
                boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
                border: '1px solid rgba(0,0,0,0.04)'
            }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                    <div>
                        <label style={{ display: 'block', fontWeight: 600, marginBottom: 6, fontSize: 14, color: '#374151' }}>
                            <FaUser style={{ fontSize: 12, marginRight: 4 }} /> Ad
                        </label>
                        <input
                            type="text"
                            name="firstName"
                            value={formData.firstName}
                            onChange={handleChange}
                            disabled={isSystemAdmin}
                            style={{
                                width: '100%',
                                padding: '10px 14px',
                                border: '2px solid #e5e7eb',
                                borderRadius: 10,
                                fontSize: 14,
                                outline: 'none',
                                background: isSystemAdmin ? '#f3f4f6' : 'white'
                            }}
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', fontWeight: 600, marginBottom: 6, fontSize: 14, color: '#374151' }}>
                            <FaUser style={{ fontSize: 12, marginRight: 4 }} /> Soyad
                        </label>
                        <input
                            type="text"
                            name="lastName"
                            value={formData.lastName}
                            onChange={handleChange}
                            disabled={isSystemAdmin}
                            style={{
                                width: '100%',
                                padding: '10px 14px',
                                border: '2px solid #e5e7eb',
                                borderRadius: 10,
                                fontSize: 14,
                                outline: 'none',
                                background: isSystemAdmin ? '#f3f4f6' : 'white'
                            }}
                        />
                    </div>
                </div>

                <div style={{ marginBottom: 16 }}>
                    <label style={{ display: 'block', fontWeight: 600, marginBottom: 6, fontSize: 14, color: '#374151' }}>
                        <FaEnvelope style={{ fontSize: 12, marginRight: 4 }} /> E-posta
                    </label>
                    <input
                        type="email"
                        value={profile?.email || ''}
                        disabled
                        style={{
                            width: '100%',
                            padding: '10px 14px',
                            border: '2px solid #e5e7eb',
                            borderRadius: 10,
                            fontSize: 14,
                            outline: 'none',
                            background: '#f3f4f6'
                        }}
                    />
                </div>

                <div style={{ marginBottom: 16 }}>
                    <label style={{ display: 'block', fontWeight: 600, marginBottom: 6, fontSize: 14, color: '#374151' }}>
                        <FaPhone style={{ fontSize: 12, marginRight: 4 }} /> Telefon
                    </label>
                    <input
                        type="tel"
                        name="phoneNumber"
                        value={formData.phoneNumber}
                        onChange={handleChange}
                        disabled={isSystemAdmin}
                        style={{
                            width: '100%',
                            padding: '10px 14px',
                            border: '2px solid #e5e7eb',
                            borderRadius: 10,
                            fontSize: 14,
                            outline: 'none',
                            background: isSystemAdmin ? '#f3f4f6' : 'white'
                        }}
                    />
                </div>

                <div style={{ marginBottom: 24 }}>
                    <label style={{ display: 'block', fontWeight: 600, marginBottom: 6, fontSize: 14, color: '#374151' }}>
                        <FaMapMarker style={{ fontSize: 12, marginRight: 4 }} /> Adres
                    </label>
                    <textarea
                        name="address"
                        value={formData.address}
                        onChange={handleChange}
                        disabled={isSystemAdmin}
                        rows={3}
                        style={{
                            width: '100%',
                            padding: '10px 14px',
                            border: '2px solid #e5e7eb',
                            borderRadius: 10,
                            fontSize: 14,
                            outline: 'none',
                            resize: 'vertical',
                            background: isSystemAdmin ? '#f3f4f6' : 'white'
                        }}
                    />
                </div>

                {!isSystemAdmin && (
                    <button
                        type="submit"
                        disabled={updating}
                        style={{
                            width: '100%',
                            padding: '12px',
                            background: 'linear-gradient(135deg, #667eea, #764ba2)',
                            color: 'white',
                            border: 'none',
                            borderRadius: 10,
                            fontSize: 16,
                            fontWeight: 600,
                            cursor: updating ? 'not-allowed' : 'pointer',
                            opacity: updating ? 0.7 : 1,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 10,
                            transition: 'all 0.3s ease'
                        }}
                    >
                        {updating ? <FaSpinner style={{ animation: 'spin 1s linear infinite' }} /> : <FaSave />}
                        {updating ? 'Güncelleniyor...' : 'Profili Güncelle'}
                    </button>
                )}
            </form>
        </div>
    );
};

export default AdminProfile;