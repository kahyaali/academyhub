import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { 
    FaUser, FaEnvelope, FaPhone, FaMapMarker, FaBook, 
    FaUsers, FaStar, FaMoneyBillWave, FaCamera, FaTrash, FaUserCircle,
    FaDollarSign, FaEuroSign, FaPoundSign, FaKey
} from 'react-icons/fa';
import Swal from 'sweetalert2';
import api from '../../api/api';
import './InstructorProfile.css';

const InstructorProfile = () => {
    const { user, setUser } = useAuth();  
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        bio: '',
        expertise: '',
        phoneNumber: '',
        address: ''
    });
    const [earningsByCurrency, setEarningsByCurrency] = useState([]);

    //  Para birimi sembolü
    const getCurrencySymbol = (currency) => {
        const symbols = {
            'TL': '₺',
            'USD': '$',
            'EUR': '€',
            'GBP': '£'
        };
        return symbols[currency] || '₺';
    };

    //  Para birimi formatı
    const formatPrice = (amount, currency) => {
        if (!amount && amount !== 0) return `0 ${getCurrencySymbol(currency || 'TL')}`;
        const symbol = getCurrencySymbol(currency || 'TL');
        return `${amount.toFixed(2)} ${symbol}`;
    };

    //  Para birimi ikonu
    const getCurrencyIcon = (currency) => {
        switch(currency) {
            case 'USD': return <FaDollarSign />;
            case 'EUR': return <FaEuroSign />;
            case 'GBP': return <FaPoundSign />;
            default: return <FaMoneyBillWave />;
        }
    };

    //  Para birimi rengi
    const getCurrencyColor = (currency) => {
        switch(currency) {
            case 'USD': return '#3b82f6';
            case 'EUR': return '#8b5cf6';
            case 'GBP': return '#f59e0b';
            default: return '#10b981';
        }
    };

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const res = await api.get('/instructor/profile');
            console.log('📸 Profil verisi:', res.data.data);
            setProfile(res.data.data);
            setFormData({
                firstName: res.data.data.firstName || '',
                lastName: res.data.data.lastName || '',
                bio: res.data.data.bio || '',
                expertise: res.data.data.expertise || '',
                phoneNumber: res.data.data.phoneNumber || '',
                address: res.data.data.address || ''
            });

            await fetchEarningsByCurrency();
        } catch (error) {
            console.error('Profil yüklenirken hata:', error);
            Swal.fire({ icon: 'error', title: 'Hata', text: 'Profil yüklenemedi!' });
        } finally {
            setLoading(false);
        }
    };

    const fetchEarningsByCurrency = async () => {
        try {
            const res = await api.get('/instructor/earnings/by-currency');
            console.log('💰 Para birimi bazında kazançlar:', res.data.data);
            setEarningsByCurrency(res.data.data || []);
        } catch (error) {
            console.error('Kazançlar yüklenirken hata:', error);
            setEarningsByCurrency([]);
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setUpdating(true);

        try {
            await api.put('/instructor/profile', formData);
            await fetchProfile();
            Swal.fire({ icon: 'success', title: 'Başarılı', text: 'Profil güncellendi!' });
        } catch (error) {
            console.error('Güncelleme hatası:', error);
            Swal.fire({ icon: 'error', title: 'Hata', text: 'Profil güncellenemedi!' });
        } finally {
            setUpdating(false);
        }
    };

    //  ŞİFRE DEĞİŞTİRME FONKSİYONU 
    const handleChangePassword = async () => {
        const { value: formValues } = await Swal.fire({
            title: '🔑 Şifre Değiştir',
            html: `
                <div style="text-align: left; padding: 0 10px;">
                    <div style="margin-bottom: 16px;">
                        <label style="display: block; font-weight: 600; margin-bottom: 6px; color: #374151; font-size: 14px;">Mevcut Şifre</label>
                        <div style="display: flex; align-items: center; background: #f3f4f6; border-radius: 10px; border: 2px solid #e5e7eb;">
                            <input id="currentPassword" class="swal2-input" type="password" placeholder="Mevcut şifrenizi girin" style="border: none !important; background: transparent !important; flex: 1; padding: 12px 16px; font-size: 15px; outline: none; box-shadow: none !important;" />
                            <button id="toggleCurrentPassword" type="button" style="background: transparent; border: none; padding: 0 16px; cursor: pointer; font-size: 18px; color: #6b7280;">👁️</button>
                        </div>
                    </div>
                    <div style="margin-bottom: 16px;">
                        <label style="display: block; font-weight: 600; margin-bottom: 6px; color: #374151; font-size: 14px;">Yeni Şifre</label>
                        <div style="display: flex; align-items: center; background: #f3f4f6; border-radius: 10px; border: 2px solid #e5e7eb;">
                            <input id="newPassword" class="swal2-input" type="password" placeholder="En az 8 karakter" style="border: none !important; background: transparent !important; flex: 1; padding: 12px 16px; font-size: 15px; outline: none; box-shadow: none !important;" />
                            <button id="toggleNewPassword" type="button" style="background: transparent; border: none; padding: 0 16px; cursor: pointer; font-size: 18px; color: #6b7280;">👁️</button>
                        </div>
                        <div style="font-size: 12px; color: #6b7280; margin-top: 4px;">🔒 En az 8 karakter olmalıdır</div>
                    </div>
                    <div style="margin-bottom: 8px;">
                        <label style="display: block; font-weight: 600; margin-bottom: 6px; color: #374151; font-size: 14px;">Yeni Şifre Tekrar</label>
                        <div style="display: flex; align-items: center; background: #f3f4f6; border-radius: 10px; border: 2px solid #e5e7eb;">
                            <input id="confirmPassword" class="swal2-input" type="password" placeholder="Yeni şifreyi tekrar girin" style="border: none !important; background: transparent !important; flex: 1; padding: 12px 16px; font-size: 15px; outline: none; box-shadow: none !important;" />
                            <button id="toggleConfirmPassword" type="button" style="background: transparent; border: none; padding: 0 16px; cursor: pointer; font-size: 18px; color: #6b7280;">👁️</button>
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
                const response = await api.post('/auth/change-password', {
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
                let errorMessage = 'Şifre değiştirilemedi!';
                if (err.response?.data?.message) {
                    errorMessage = err.response.data.message;
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

    const getImageUrl = (imagePath) => {
        if (!imagePath) return null;
        if (imagePath.startsWith('http')) return imagePath;
        if (imagePath.startsWith('/')) return `http://localhost:7230${imagePath}`;
        return `http://localhost:7230/${imagePath}`;
    };

  
    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            Swal.fire({ icon: 'warning', title: 'Uyarı', text: 'Dosya boyutu 5MB\'dan küçük olmalı!' });
            return;
        }

        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await api.post('/instructor/profile-image', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            
            const newImageUrl = res.data.data.imageUrl;
            console.log('📸 Yeni resim URL:', newImageUrl);
            
            //  Profil state'ini güncelle
            setProfile(prev => ({
                ...prev,
                profileImage: newImageUrl
            }));
            
          
            if (setUser && user) {
                const updatedUser = { ...user, profileImage: newImageUrl };
                setUser(updatedUser);
                localStorage.setItem('user', JSON.stringify(updatedUser));
                console.log('✅ AuthContext güncellendi');
            }
            
            Swal.fire({ icon: 'success', title: 'Başarılı', text: 'Profil resmi güncellendi!' });
        } catch (error) {
            console.error('Resim yükleme hatası:', error);
            Swal.fire({ icon: 'error', title: 'Hata', text: 'Resim yüklenemedi!' });
        }
    };

    const handleRemoveImage = async () => {
        const result = await Swal.fire({
            icon: 'warning',
            title: 'Emin misiniz?',
            text: 'Profil resminizi kaldırmak istediğinize emin misiniz?',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'Evet, kaldır',
            cancelButtonText: 'İptal'
        });

        if (result.isConfirmed) {
            try {
                await api.delete('/instructor/profile-image');
                
                
                setProfile(prev => ({
                    ...prev,
                    profileImage: null
                }));
                
            
                if (setUser && user) {
                    const updatedUser = { ...user, profileImage: null };
                    setUser(updatedUser);
                    localStorage.setItem('user', JSON.stringify(updatedUser));
                    console.log('✅ AuthContext güncellendi - resim kaldırıldı');
                }
                
                Swal.fire({
                    icon: 'success',
                    title: 'Başarılı!',
                    text: 'Profil resmi kaldırıldı.',
                    timer: 1500,
                    showConfirmButton: false
                });
                
            } catch (error) {
                console.error('Resim kaldırma hatası:', error);
                Swal.fire({
                    icon: 'error',
                    title: 'Hata!',
                    text: 'Resim kaldırılamadı!'
                });
            }
        }
    };

    if (loading) {
        return (
            <div className="profile-loading">
                <div className="spinner"></div>
                <p>Profil yükleniyor...</p>
            </div>
        );
    }

    return (
        <div className="instructor-profile-page">
            <div className="profile-container">
                {/* Header */}
                <div className="profile-header">
                    <div className="profile-avatar-section">
                        <div className="profile-image-wrapper">
                            {profile?.profileImage ? (
                                <img 
                                    src={getImageUrl(profile.profileImage)} 
                                    alt="Profil" 
                                    className="profile-image"
                                    onError={(e) => {
                                        e.target.onerror = null;
                                        e.target.style.display = 'none';
                                        e.target.parentElement.querySelector('.profile-placeholder').style.display = 'flex';
                                    }}
                                />
                            ) : null}
                            <div 
                                className="profile-placeholder" 
                                style={{
                                    display: profile?.profileImage ? 'none' : 'flex',
                                    width: '130px',
                                    height: '130px',
                                    borderRadius: '50%',
                                    background: 'linear-gradient(135deg, #e2e8f0, #cbd5e1)',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '64px',
                                    color: '#94a3b8',
                                    border: '4px solid rgba(255,255,255,0.9)',
                                    boxShadow: '0 12px 35px -8px rgba(0,0,0,0.4)',
                                }}
                            >
                                <FaUserCircle />
                            </div>
                            
                            <div className="profile-image-actions-bottom">
                                <label className="image-upload-btn-bottom" title="Resim Yükle">
                                    <FaCamera />
                                    <input 
                                        type="file" 
                                        accept="image/*" 
                                        onChange={handleImageUpload}
                                        style={{ display: 'none' }}
                                    />
                                    <span>Yükle</span>
                                </label>
                                {profile?.profileImage && (
                                    <button className="image-remove-btn-bottom" onClick={handleRemoveImage} title="Resmi Kaldır">
                                        <FaTrash />
                                        <span>Sil</span>
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="profile-info">
                        <h1>{profile?.firstName} {profile?.lastName}</h1>
                        <p className="profile-email"><FaEnvelope /> {profile?.email}</p>
                        <div className="profile-stats">
                            <div className="stat">
                                <FaBook />
                                <span>{profile?.totalCourses || 0} Kurs</span>
                            </div>
                            <div className="stat">
                                <FaUsers />
                                <span>{profile?.totalStudents || 0} Öğrenci</span>
                            </div>
                            <div className="stat">
                                <FaStar />
                                <span>{profile?.averageRating?.toFixed(1) || 0} Puan</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Para Birimi Bazında Kazançlar */}
                <div className="profile-earnings-section" style={{
                    background: 'white',
                    borderRadius: 16,
                    padding: '20px 24px',
                    marginBottom: 24,
                    boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
                    border: '1px solid rgba(0,0,0,0.04)'
                }}>
                    <h3 style={{
                        fontSize: 16,
                        fontWeight: 600,
                        color: '#0f0c29',
                        margin: '0 0 16px 0',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10
                    }}>
                        <FaMoneyBillWave style={{ color: '#667eea' }} />
                        Para Birimine Göre Kazançlar
                    </h3>
                    
                    {earningsByCurrency && earningsByCurrency.length > 0 ? (
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                            gap: 12
                        }}>
                            {earningsByCurrency.map((item, index) => {
                                const symbol = getCurrencySymbol(item.currency);
                                const color = getCurrencyColor(item.currency);
                                const icon = getCurrencyIcon(item.currency);
                                return (
                                    <div key={index} style={{
                                        background: '#f8fafc',
                                        borderRadius: 12,
                                        padding: '14px 18px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 12,
                                        border: `2px solid ${color}30`,
                                        transition: 'all 0.2s'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.transform = 'translateY(-2px)';
                                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.transform = 'translateY(0)';
                                        e.currentTarget.style.boxShadow = 'none';
                                    }}>
                                        <div style={{
                                            width: 40,
                                            height: 40,
                                            borderRadius: '50%',
                                            background: `${color}20`,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: color,
                                            fontSize: 20
                                        }}>
                                            {icon}
                                        </div>
                                        <div>
                                            <div style={{
                                                fontSize: 18,
                                                fontWeight: 700,
                                                color: '#0f0c29'
                                            }}>
                                                {formatPrice(item.total, item.currency)}
                                            </div>
                                            <div style={{
                                                fontSize: 12,
                                                color: '#94a3b8',
                                                fontWeight: 500
                                            }}>
                                                {item.currency || 'TL'}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div style={{
                            textAlign: 'center',
                            padding: '20px',
                            color: '#94a3b8',
                            fontSize: 14
                        }}>
                            <p>Henüz kazanç kaydınız bulunmuyor.</p>
                        </div>
                    )}
                </div>

                {/* Form */}
                <div className="profile-form-container">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                        <h2 style={{ margin: 0 }}>Profil Bilgileri</h2>
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
                    <form onSubmit={handleSubmit} className="profile-form">
                        <div className="form-row">
                            <div className="form-group">
                                <label><FaUser /> Ad</label>
                                <input
                                    type="text"
                                    name="firstName"
                                    value={formData.firstName}
                                    onChange={handleChange}
                                    placeholder="Adınız"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label><FaUser /> Soyad</label>
                                <input
                                    type="text"
                                    name="lastName"
                                    value={formData.lastName}
                                    onChange={handleChange}
                                    placeholder="Soyadınız"
                                    required
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Biyografi</label>
                            <textarea
                                name="bio"
                                value={formData.bio}
                                onChange={handleChange}
                                placeholder="Kendinizi tanıtın..."
                                rows={4}
                            />
                        </div>

                        <div className="form-group">
                            <label>Uzmanlık Alanları</label>
                            <input
                                type="text"
                                name="expertise"
                                value={formData.expertise}
                                onChange={handleChange}
                                placeholder="Örn: React, C#, Python"
                            />
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label><FaPhone /> Telefon</label>
                                <input
                                    type="tel"
                                    name="phoneNumber"
                                    value={formData.phoneNumber}
                                    onChange={handleChange}
                                    placeholder="Telefon numaranız"
                                />
                            </div>
                            <div className="form-group">
                                <label><FaMapMarker /> Adres</label>
                                <input
                                    type="text"
                                    name="address"
                                    value={formData.address}
                                    onChange={handleChange}
                                    placeholder="Adresiniz"
                                />
                            </div>
                        </div>

                        <button type="submit" className="update-btn" disabled={updating}>
                            {updating ? 'Güncelleniyor...' : 'Profili Güncelle'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default InstructorProfile;