import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import { 
    FaSave, FaPaperPlane, FaSync, FaEye, FaEyeSlash, 
    FaCheck, FaTimes, FaEnvelope, FaServer, FaUser, FaKey,
    FaCheckCircle, FaExclamationTriangle, FaClock,
    FaArrowRight, FaNetworkWired, FaShieldAlt
} from 'react-icons/fa';
import { mailConfigurationApi } from '../../api/api';
import '../../App.css';

const MailConfiguration = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [testing, setTesting] = useState(false);
    const [config, setConfig] = useState(null);
    const [testEmail, setTestEmail] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [testStatus, setTestStatus] = useState(null);

    const [formData, setFormData] = useState({
        smtpServer: '',
        smtpPort: 587,
        senderEmail: '',
        senderName: '',
        username: '',
        password: '',
        enableSsl: true,
        useDefaultCredentials: false,
        maxRetryCount: 3,
        timeout: 30000,
        isActive: true
    });

    useEffect(() => {
        loadConfiguration();
    }, []);

    const loadConfiguration = async () => {
        try {
            setLoading(true);
            const response = await mailConfigurationApi.getConfiguration();

            if (response.data.success && response.data.data) {
                setConfig(response.data.data);
                setFormData({
                    ...response.data.data,
                    password: '********'
                });
                setIsEditMode(true);
            } else {
                setIsEditMode(false);
            }
        } catch (error) {
            console.error('Konfigürasyon yüklenemedi:', error);
            setIsEditMode(false);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleNumberChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: parseInt(value) || 0
        }));
    };


const handleSave = async (e) => {
    e.preventDefault();

    console.log('🔄 Güncelleme tetiklendi!');
    console.log('config.id:', config?.id);
    console.log('📤 formData:', formData);

    // Validasyonlar
    if (!formData.smtpServer || !formData.senderEmail || !formData.senderName || !formData.username) {
        toast.error('Lütfen tüm zorunlu alanları doldurun!');
        return;
    }

    if (!formData.password || formData.password === '********') {
        toast.error('Lütfen geçerli bir şifre girin!');
        return;
    }

    try {
        setSaving(true);

        if (config && config.id) {
            console.log('📤 GÜNCELLEME yapılıyor - ID:', config.id);
            
            const updateData = {
                id: config.id,
                smtpServer: formData.smtpServer,
                smtpPort: parseInt(formData.smtpPort) || 587,
                senderEmail: formData.senderEmail,
                senderName: formData.senderName,
                username: formData.username,
                password: formData.password,
                enableSsl: formData.enableSsl,
                useDefaultCredentials: formData.useDefaultCredentials,
                maxRetryCount: parseInt(formData.maxRetryCount) || 3,
                timeout: parseInt(formData.timeout) || 30000,
                isActive: formData.isActive
            };

            console.log('📤 Gönderilen veri:', updateData);

          
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:7230/api/v1/mailconfiguration', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(updateData)
            });

            const result = await response.json();
            console.log('📥 API CEVABI:', result);

            if (result.success) {
                toast.success(result.message || 'Konfigürasyon başarıyla kaydedildi!');
                setConfig(result.data);
                setIsEditMode(true);
                setFormData(prev => ({ ...prev, password: '********' }));
                await loadConfiguration();
            } else {
                toast.error(result.message || 'Bir hata oluştu!');
            }
            
        } else {
            console.log('📤 YENİ KAYIT oluşturuluyor');
          
            const response = await mailConfigurationApi.createConfiguration({
                smtpServer: formData.smtpServer,
                smtpPort: parseInt(formData.smtpPort) || 587,
                senderEmail: formData.senderEmail,
                senderName: formData.senderName,
                username: formData.username,
                password: formData.password,
                enableSsl: formData.enableSsl,
                useDefaultCredentials: formData.useDefaultCredentials,
                maxRetryCount: parseInt(formData.maxRetryCount) || 3,
                timeout: parseInt(formData.timeout) || 30000,
                isActive: formData.isActive
            });
            
            console.log('📥 API Cevabı:', response);
            
            if (response?.data?.success) {
                toast.success(response.data.message || 'Konfigürasyon başarıyla kaydedildi!');
                setConfig(response.data.data);
                setIsEditMode(true);
                setFormData(prev => ({ ...prev, password: '********' }));
                await loadConfiguration();
            } else {
                toast.error(response?.data?.message || 'Bir hata oluştu!');
            }
        }

    } catch (error) {
        console.error('❌ HATA:', error);
        console.error('❌ Response:', error.response);
        console.error('❌ Data:', error.response?.data);
        
        let errorMessage = 'Bir hata oluştu!';
        if (error.response?.data?.message) {
            errorMessage = error.response.data.message;
        } else if (error.message) {
            errorMessage = error.message;
        }
        
        toast.error(errorMessage);
    } finally {
        setSaving(false);
    }
};

const handleTestEmail = async () => {
    if (!testEmail) {
        toast.error('Lütfen test e-posta adresini girin!');
        return;
    }

    if (!config) {
        toast.error('Önce bir konfigürasyon kaydedin!');
        return;
    }

    try {
        setTesting(true);
        setTestStatus(null);

        console.log('📤 Test maili gönderiliyor - Email:', testEmail);

  
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:7230/api/v1/mailconfiguration/test', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ TestEmail: testEmail })  
        });

        const result = await response.json();
        console.log('📥 Test maili cevabı:', result);

        if (result.success) {
            setTestStatus('success');
            toast.success(result.message || 'Test maili başarıyla gönderildi!');
            setTestEmail('');
            await loadConfiguration();
        } else {
            setTestStatus('error');
            toast.error(result.message || 'Test maili gönderilemedi!');
        }

    } catch (error) {
        console.error('❌ Test maili hatası:', error);
        setTestStatus('error');
        toast.error(error.response?.data?.message || 'Test maili gönderilemedi!');
    } finally {
        setTesting(false);
    }
};


    if (loading) {
        return (
            <div className="app-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ width: 48, height: 48, border: '4px solid #6C63FF', borderTop: '4px solid transparent', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto' }}></div>
                    <p style={{ marginTop: 16, color: '#6c757d', fontSize: 16 }}>Yükleniyor...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="app-container">
            <div className="main-content" style={{ maxWidth: 900, margin: '0 auto', padding: '0 20px' }}>
                {/* HEADER */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                        <div style={{ 
                            width: 54, 
                            height: 54, 
                            borderRadius: 14, 
                            background: 'linear-gradient(135deg, #6C63FF 0%, #3F3D9E 100%)', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            color: 'white',
                            fontSize: 26,
                            boxShadow: '0 8px 24px rgba(108, 99, 255, 0.3)'
                        }}>
                            <FaEnvelope />
                        </div>
                        <div>
                            <h1 style={{ fontSize: 26, fontWeight: 700, color: '#0f0c29', margin: 0 }}>Mail Ayarları</h1>
                            <p style={{ color: '#6c757d', margin: '2px 0 0 0', fontSize: 14 }}>SMTP sunucu bilgilerini yönetin</p>
                        </div>
                    </div>
                    {config && (
                        <span style={{
                            padding: '6px 14px',
                            borderRadius: 20,
                            fontSize: 13,
                            fontWeight: 600,
                            background: config.isActive ? '#d1fae5' : '#fee2e2',
                            color: config.isActive ? '#065f46' : '#991b1b'
                        }}>
                            {config.isActive ? '✅ Aktif' : '❌ Pasif'}
                        </span>
                    )}
                </div>

                {/* FORM KARTI */}
                <div style={{ 
                    background: 'white',
                    borderRadius: 16,
                    padding: '28px 32px',
                    marginBottom: 24,
                    boxShadow: '0 8px 30px rgba(0, 0, 0, 0.08)',
                    transition: 'all 0.3s ease'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid #f0f0f0' }}>
                        <FaNetworkWired style={{ color: '#6C63FF', fontSize: 18 }} />
                        <div>
                            <h3 style={{ fontSize: 16, fontWeight: 600, color: '#0f0c29', margin: 0 }}>SMTP Bağlantı Ayarları</h3>
                            <p style={{ fontSize: 13, color: '#6c757d', margin: 0 }}>E-posta gönderimi için gerekli sunucu bilgileri</p>
                        </div>
                    </div>

                    <form onSubmit={handleSave}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '18px' }}>
                            {/* SMTP Server */}
                            <div style={{ gridColumn: '1 / -1' }}>
                                <label style={{ display: 'block', fontWeight: 600, marginBottom: 6, fontSize: 14, color: '#0f0c29' }}>
                                    <FaServer style={{ marginRight: 6, color: '#6C63FF' }} />
                                    SMTP Sunucu <span style={{ color: '#ef4444' }}>*</span>
                                </label>
                                <input
                                    type="text"
                                    name="smtpServer"
                                    value={formData.smtpServer}
                                    onChange={handleInputChange}
                                    placeholder="smtp.gmail.com"
                                    style={{
                                        width: '100%',
                                        padding: '10px 14px',
                                        border: '2px solid #e5e7eb',
                                        borderRadius: 10,
                                        fontSize: 15,
                                        transition: 'border-color 0.3s',
                                        outline: 'none',
                                        fontFamily: 'inherit',
                                        backgroundColor: '#fafbfc'
                                    }}
                                    onFocus={(e) => { e.target.style.borderColor = '#6C63FF'; e.target.style.boxShadow = '0 0 0 4px rgba(108, 99, 255, 0.1)'; }}
                                    onBlur={(e) => { e.target.style.borderColor = '#e5e7eb'; e.target.style.boxShadow = 'none'; }}
                                    required
                                />
                            </div>

                            {/* SMTP Port */}
                            <div>
                                <label style={{ display: 'block', fontWeight: 600, marginBottom: 6, fontSize: 14, color: '#0f0c29' }}>
                                    Port <span style={{ color: '#ef4444' }}>*</span>
                                </label>
                                <input
                                    type="number"
                                    name="smtpPort"
                                    value={formData.smtpPort}
                                    onChange={handleNumberChange}
                                    style={{
                                        width: '100%',
                                        padding: '10px 14px',
                                        border: '2px solid #e5e7eb',
                                        borderRadius: 10,
                                        fontSize: 15,
                                        transition: 'border-color 0.3s',
                                        outline: 'none',
                                        fontFamily: 'inherit',
                                        backgroundColor: '#fafbfc'
                                    }}
                                    onFocus={(e) => { e.target.style.borderColor = '#6C63FF'; e.target.style.boxShadow = '0 0 0 4px rgba(108, 99, 255, 0.1)'; }}
                                    onBlur={(e) => { e.target.style.borderColor = '#e5e7eb'; e.target.style.boxShadow = 'none'; }}
                                    required
                                    min="1"
                                    max="65535"
                                />
                            </div>

                            {/* Checkboxes */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, cursor: 'pointer', color: '#0f0c29' }}>
                                    <input
                                        type="checkbox"
                                        name="enableSsl"
                                        checked={formData.enableSsl}
                                        onChange={handleInputChange}
                                        style={{ width: 18, height: 18, accentColor: '#6C63FF' }}
                                    />
                                    SSL Kullan
                                </label>
                                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, cursor: 'pointer', color: '#0f0c29' }}>
                                    <input
                                        type="checkbox"
                                        name="isActive"
                                        checked={formData.isActive}
                                        onChange={handleInputChange}
                                        style={{ width: 18, height: 18, accentColor: '#10b981' }}
                                    />
                                    Aktif
                                </label>
                            </div>

                            {/* Sender Email */}
                            <div>
                                <label style={{ display: 'block', fontWeight: 600, marginBottom: 6, fontSize: 14, color: '#0f0c29' }}>
                                    <FaEnvelope style={{ marginRight: 6, color: '#6C63FF' }} />
                                    Gönderen E-posta <span style={{ color: '#ef4444' }}>*</span>
                                </label>
                                <input
                                    type="email"
                                    name="senderEmail"
                                    value={formData.senderEmail}
                                    onChange={handleInputChange}
                                    placeholder="noreply@example.com"
                                    style={{
                                        width: '100%',
                                        padding: '10px 14px',
                                        border: '2px solid #e5e7eb',
                                        borderRadius: 10,
                                        fontSize: 15,
                                        transition: 'border-color 0.3s',
                                        outline: 'none',
                                        fontFamily: 'inherit',
                                        backgroundColor: '#fafbfc'
                                    }}
                                    onFocus={(e) => { e.target.style.borderColor = '#6C63FF'; e.target.style.boxShadow = '0 0 0 4px rgba(108, 99, 255, 0.1)'; }}
                                    onBlur={(e) => { e.target.style.borderColor = '#e5e7eb'; e.target.style.boxShadow = 'none'; }}
                                    required
                                />
                            </div>

                            {/* Sender Name */}
                            <div>
                                <label style={{ display: 'block', fontWeight: 600, marginBottom: 6, fontSize: 14, color: '#0f0c29' }}>
                                    Gönderen İsmi <span style={{ color: '#ef4444' }}>*</span>
                                </label>
                                <input
                                    type="text"
                                    name="senderName"
                                    value={formData.senderName}
                                    onChange={handleInputChange}
                                    placeholder="AcademyHub"
                                    style={{
                                        width: '100%',
                                        padding: '10px 14px',
                                        border: '2px solid #e5e7eb',
                                        borderRadius: 10,
                                        fontSize: 15,
                                        transition: 'border-color 0.3s',
                                        outline: 'none',
                                        fontFamily: 'inherit',
                                        backgroundColor: '#fafbfc'
                                    }}
                                    onFocus={(e) => { e.target.style.borderColor = '#6C63FF'; e.target.style.boxShadow = '0 0 0 4px rgba(108, 99, 255, 0.1)'; }}
                                    onBlur={(e) => { e.target.style.borderColor = '#e5e7eb'; e.target.style.boxShadow = 'none'; }}
                                    required
                                />
                            </div>

                            {/* Username */}
                            <div>
                                <label style={{ display: 'block', fontWeight: 600, marginBottom: 6, fontSize: 14, color: '#0f0c29' }}>
                                    <FaUser style={{ marginRight: 6, color: '#6C63FF' }} />
                                    Kullanıcı Adı <span style={{ color: '#ef4444' }}>*</span>
                                </label>
                                <input
                                    type="text"
                                    name="username"
                                    value={formData.username}
                                    onChange={handleInputChange}
                                    placeholder="SMTP kullanıcı adı"
                                    style={{
                                        width: '100%',
                                        padding: '10px 14px',
                                        border: '2px solid #e5e7eb',
                                        borderRadius: 10,
                                        fontSize: 15,
                                        transition: 'border-color 0.3s',
                                        outline: 'none',
                                        fontFamily: 'inherit',
                                        backgroundColor: '#fafbfc'
                                    }}
                                    onFocus={(e) => { e.target.style.borderColor = '#6C63FF'; e.target.style.boxShadow = '0 0 0 4px rgba(108, 99, 255, 0.1)'; }}
                                    onBlur={(e) => { e.target.style.borderColor = '#e5e7eb'; e.target.style.boxShadow = 'none'; }}
                                    required
                                />
                            </div>

                            {/* Password */}
                            <div>
                                <label style={{ display: 'block', fontWeight: 600, marginBottom: 6, fontSize: 14, color: '#0f0c29' }}>
                                    <FaKey style={{ marginRight: 6, color: '#6C63FF' }} />
                                    Şifre <span style={{ color: '#ef4444' }}>*</span>
                                </label>
                                <div style={{ position: 'relative' }}>
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        name="password"
                                        value={formData.password}
                                        onChange={handleInputChange}
                                        placeholder={isEditMode ? '••••••••' : 'Şifre'}
                                        style={{
                                            width: '100%',
                                            padding: '10px 14px',
                                            paddingRight: 44,
                                            border: '2px solid #e5e7eb',
                                            borderRadius: 10,
                                            fontSize: 15,
                                            transition: 'border-color 0.3s',
                                            outline: 'none',
                                            fontFamily: 'inherit',
                                            backgroundColor: '#fafbfc'
                                        }}
                                        onFocus={(e) => { e.target.style.borderColor = '#6C63FF'; e.target.style.boxShadow = '0 0 0 4px rgba(108, 99, 255, 0.1)'; }}
                                        onBlur={(e) => { e.target.style.borderColor = '#e5e7eb'; e.target.style.boxShadow = 'none'; }}
                                        required={!isEditMode}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        style={{
                                            position: 'absolute',
                                            right: 12,
                                            top: '50%',
                                            transform: 'translateY(-50%)',
                                            background: 'none',
                                            border: 'none',
                                            color: '#9ca3af',
                                            cursor: 'pointer',
                                            fontSize: 18
                                        }}
                                    >
                                        {showPassword ? <FaEyeSlash /> : <FaEye />}
                                    </button>
                                </div>
                                {isEditMode && (
                                    <p style={{ fontSize: 12, color: '#9ca3af', marginTop: 4 }}>* Değiştirmek için yeni şifre girin</p>
                                )}
                            </div>

                            {/* Max Retry */}
                            <div>
                                <label style={{ display: 'block', fontWeight: 600, marginBottom: 6, fontSize: 14, color: '#0f0c29' }}>
                                    Maks. Deneme
                                </label>
                                <input
                                    type="number"
                                    name="maxRetryCount"
                                    value={formData.maxRetryCount}
                                    onChange={handleNumberChange}
                                    style={{
                                        width: '100%',
                                        padding: '10px 14px',
                                        border: '2px solid #e5e7eb',
                                        borderRadius: 10,
                                        fontSize: 15,
                                        transition: 'border-color 0.3s',
                                        outline: 'none',
                                        fontFamily: 'inherit',
                                        backgroundColor: '#fafbfc'
                                    }}
                                    onFocus={(e) => { e.target.style.borderColor = '#6C63FF'; e.target.style.boxShadow = '0 0 0 4px rgba(108, 99, 255, 0.1)'; }}
                                    onBlur={(e) => { e.target.style.borderColor = '#e5e7eb'; e.target.style.boxShadow = 'none'; }}
                                    min="1"
                                    max="10"
                                />
                            </div>

                            {/* Timeout */}
                            <div>
                                <label style={{ display: 'block', fontWeight: 600, marginBottom: 6, fontSize: 14, color: '#0f0c29' }}>
                                    Zaman Aşımı (ms)
                                </label>
                                <input
                                    type="number"
                                    name="timeout"
                                    value={formData.timeout}
                                    onChange={handleNumberChange}
                                    style={{
                                        width: '100%',
                                        padding: '10px 14px',
                                        border: '2px solid #e5e7eb',
                                        borderRadius: 10,
                                        fontSize: 15,
                                        transition: 'border-color 0.3s',
                                        outline: 'none',
                                        fontFamily: 'inherit',
                                        backgroundColor: '#fafbfc'
                                    }}
                                    onFocus={(e) => { e.target.style.borderColor = '#6C63FF'; e.target.style.boxShadow = '0 0 0 4px rgba(108, 99, 255, 0.1)'; }}
                                    onBlur={(e) => { e.target.style.borderColor = '#e5e7eb'; e.target.style.boxShadow = 'none'; }}
                                    min="5000"
                                    step="5000"
                                />
                            </div>
                        </div>

                        {/* Buttons */}
                        <div style={{ display: 'flex', gap: 12, marginTop: 24, paddingTop: 20, borderTop: '1px solid #f0f0f0' }}>
                            <button
                                type="submit"
                                disabled={saving}
                                style={{
                                    padding: '12px 28px',
                                    background: 'linear-gradient(135deg, #6C63FF 0%, #3F3D9E 100%)',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: 10,
                                    fontWeight: 600,
                                    fontSize: 15,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 8,
                                    cursor: saving ? 'not-allowed' : 'pointer',
                                    opacity: saving ? 0.7 : 1,
                                    transition: 'all 0.3s'
                                }}
                                onMouseEnter={(e) => { if (!saving) { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(108, 99, 255, 0.3)'; } }}
                                onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
                            >
                                {saving ? (
                                    <>
                                        <FaSync style={{ animation: 'spin 1s linear infinite' }} />
                                        Kaydediliyor...
                                    </>
                                ) : (
                                    <>
                                        <FaSave />
                                        {isEditMode ? 'Güncelle' : 'Kaydet'}
                                    </>
                                )}
                            </button>
                            <button
                                type="button"
                                onClick={loadConfiguration}
                                style={{
                                    padding: '12px 24px',
                                    background: 'white',
                                    border: '2px solid #e5e7eb',
                                    borderRadius: 10,
                                    color: '#6c757d',
                                    fontWeight: 600,
                                    fontSize: 15,
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 8,
                                    transition: 'all 0.3s'
                                }}
                                onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#6C63FF'; e.currentTarget.style.color = '#6C63FF'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.color = '#6c757d'; }}
                            >
                                <FaSync /> Yenile
                            </button>
                        </div>
                    </form>
                </div>

                {/* TEST EMAIL */}
                <div style={{ 
                    background: 'white',
                    borderRadius: 16,
                    padding: '24px 32px',
                    marginBottom: 24,
                    boxShadow: '0 8px 30px rgba(0, 0, 0, 0.08)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid #f0f0f0' }}>
                        <FaPaperPlane style={{ color: '#10b981', fontSize: 18 }} />
                        <div>
                            <h3 style={{ fontSize: 16, fontWeight: 600, color: '#0f0c29', margin: 0 }}>Test Maili Gönder</h3>
                            <p style={{ fontSize: 13, color: '#6c757d', margin: 0 }}>Konfigürasyonu doğrulamak için test maili gönder</p>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: 12 }}>
                        <div style={{ flex: 1, position: 'relative' }}>
                            <FaEnvelope style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                            <input
                                type="email"
                                value={testEmail}
                                onChange={(e) => setTestEmail(e.target.value)}
                                placeholder="test@example.com"
                                style={{
                                    width: '100%',
                                    padding: '10px 14px',
                                    paddingLeft: 40,
                                    border: '2px solid #e5e7eb',
                                    borderRadius: 10,
                                    fontSize: 15,
                                    transition: 'border-color 0.3s',
                                    outline: 'none',
                                    fontFamily: 'inherit',
                                    backgroundColor: '#fafbfc'
                                }}
                                onFocus={(e) => { e.target.style.borderColor = '#10b981'; e.target.style.boxShadow = '0 0 0 4px rgba(16, 185, 129, 0.1)'; }}
                                onBlur={(e) => { e.target.style.borderColor = '#e5e7eb'; e.target.style.boxShadow = 'none'; }}
                            />
                        </div>
                        <button
                            onClick={handleTestEmail}
                            disabled={testing || !config}
                            style={{
                                padding: '12px 28px',
                                background: 'linear-gradient(135deg, #10b981, #059669)',
                                color: 'white',
                                border: 'none',
                                borderRadius: 10,
                                fontWeight: 600,
                                fontSize: 15,
                                cursor: testing || !config ? 'not-allowed' : 'pointer',
                                opacity: testing || !config ? 0.6 : 1,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 8,
                                transition: 'all 0.3s',
                                boxShadow: '0 4px 14px rgba(16, 185, 129, 0.3)'
                            }}
                            onMouseEnter={(e) => { if (!testing && config) { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(16, 185, 129, 0.4)'; } }}
                            onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(16, 185, 129, 0.3)'; }}
                        >
                            {testing ? (
                                <>
                                    <FaSync style={{ animation: 'spin 1s linear infinite' }} />
                                    Gönderiliyor...
                                </>
                            ) : (
                                <>
                                    <FaPaperPlane />
                                    Test Gönder
                                </>
                            )}
                        </button>
                    </div>

                    {!config && (
                        <p style={{ fontSize: 13, color: '#f59e0b', marginTop: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                            <FaExclamationTriangle /> Önce konfigürasyonu kaydedin
                        </p>
                    )}

                    {testStatus === 'success' && (
                        <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', background: '#d1fae5', borderRadius: 8, color: '#065f46', fontSize: 14 }}>
                            <FaCheckCircle /> Test başarılı! ✅
                        </div>
                    )}

                    {testStatus === 'error' && (
                        <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', background: '#fee2e2', borderRadius: 8, color: '#991b1b', fontSize: 14 }}>
                            <FaExclamationTriangle /> Test başarısız! ❌
                        </div>
                    )}
                </div>

                {/* INFO CARDS */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                    {config && (
                        <div style={{ 
                            background: 'white',
                            borderRadius: 16,
                            padding: '20px 24px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 16,
                            boxShadow: '0 8px 30px rgba(0, 0, 0, 0.08)'
                        }}>
                            <div style={{
                                width: 48,
                                height: 48,
                                borderRadius: 12,
                                background: config.isActive ? '#d1fae5' : '#f3f4f6',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: 22
                            }}>
                                {config.isActive ? <FaCheckCircle style={{ color: '#10b981' }} /> : <FaTimes style={{ color: '#9ca3af' }} />}
                            </div>
                            <div>
                                <p style={{ fontSize: 15, fontWeight: 600, color: '#0f0c29', margin: 0 }}>
                                    Durum: <span style={{ color: config.isActive ? '#10b981' : '#6c757d' }}>
                                        {config.isActive ? 'Aktif' : 'Pasif'}
                                    </span>
                                </p>
                                {config.lastTestDate && (
                                    <p style={{ fontSize: 13, color: '#6c757d', margin: '2px 0 0 0', display: 'flex', alignItems: 'center', gap: 6 }}>
                                        <FaClock /> Son test: {new Date(config.lastTestDate).toLocaleString('tr-TR')}
                                    </p>
                                )}
                            </div>
                        </div>
                    )}

                    <div style={{ 
                        background: 'white',
                        borderRadius: 16,
                        padding: '20px 24px',
                        display: 'flex',
                        gap: 16,
                        boxShadow: '0 8px 30px rgba(0, 0, 0, 0.08)'
                    }}>
                        <div style={{
                            width: 48,
                            height: 48,
                            borderRadius: 12,
                            background: '#e0e7ff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 22,
                            color: '#6C63FF'
                        }}>
                            <FaShieldAlt />
                        </div>
                        <div>
                            <p style={{ fontSize: 15, fontWeight: 600, color: '#0f0c29', margin: 0 }}>SMTP Bilgileri</p>
                            <p style={{ fontSize: 13, color: '#6c757d', margin: '2px 0 0 0' }}>Gmail: smtp.gmail.com · 587 · SSL</p>
                            <p style={{ fontSize: 13, color: '#6c757d', margin: 0 }}>Outlook: smtp.office365.com · 587 · SSL</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MailConfiguration;