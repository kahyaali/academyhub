import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import api from '../../api/api';
import './Auth.css';

const ResetPassword = () => {
    const [params] = useSearchParams();
    const token = params.get('token');
    const email = params.get('email');

    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

 const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    if (password !== confirm) {
        setError('Şifreler eşleşmiyor');
        return;
    }

    if (password.length < 8) {
        setError('Şifre en az 8 karakter olmalıdır');
        return;
    }

    setLoading(true);

    try {
        console.log('📤 Şifre sıfırlama isteği gönderiliyor...');
        console.log('📧 Email:', email);
        console.log('🔑 Token:', token);
        console.log('🔐 Yeni Şifre:', password);

       
        const response = await api.post('/auth/reset-password', {
            email: email,
            token: token,
            newPassword: password,
            confirmPassword: confirm  
        });

        console.log('📥 API Cevabı:', response.data);

        if (response.data.success) {
            setMessage(response.data.message || 'Şifreniz başarıyla güncellendi.');
            setTimeout(() => navigate('/login'), 2000);
        } else {
            setError(response.data.message || 'Bir hata oluştu');
        }
    } catch (err) {
        console.error('❌ TÜM HATA:', err);
        console.error('❌ RESPONSE:', err.response);
        console.error('❌ DATA:', err.response?.data);
        console.error('❌ STATUS:', err.response?.status);
        
        let errorMessage = 'Bir hata oluştu';
        if (err.response?.data?.message) {
            errorMessage = err.response.data.message;
        } else if (err.response?.data?.errors) {
            const errors = Object.values(err.response.data.errors).flat();
            errorMessage = errors.join(', ');
        } else if (err.message) {
            errorMessage = err.message;
        }
        
        setError(errorMessage);
    } finally {
        setLoading(false);
    }
};

    // Token veya email yoksa hata göster
    if (!token || !email) {
        return (
            <div className="auth-page">
                <div className="auth-container">
                    <div className="auth-card">
                        <div className="auth-header">
                            <h1>❌ Geçersiz Link</h1>
                            <p>Şifre sıfırlama linki geçersiz veya süresi dolmuş.</p>
                        </div>
                        <div className="auth-footer">
                            <Link to="/forgot-password">Yeni Link İste</Link>
                            <br />
                            <Link to="/login">Giriş sayfasına dön</Link>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="auth-page">
            <div className="auth-container">
                <div className="auth-card">
                    <div className="auth-header">
                        <h1>🔑 Yeni Şifre</h1>
                        <p>Yeni şifrenizi belirleyin</p>
                    </div>

                    <form onSubmit={handleSubmit} className="auth-form">
                        {message && (
                            <div className="alert alert-success" style={{ background: '#d1fae5', color: '#065f46', padding: '12px', borderRadius: '10px', marginBottom: '20px' }}>
                                {message}
                            </div>
                        )}
                        {error && (
                            <div className="alert alert-danger" style={{ background: '#fee2e2', color: '#991b1b', padding: '12px', borderRadius: '10px', marginBottom: '20px' }}>
                                {error}
                            </div>
                        )}

                        <div className="form-group">
                            <label>Yeni Şifre</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                required
                                minLength={8}
                                style={{
                                    width: '100%',
                                    padding: '10px 14px',
                                    border: '1px solid #ddd',
                                    borderRadius: '8px',
                                    fontSize: '14px',
                                    outline: 'none',
                                    fontFamily: 'inherit'
                                }}
                            />
                            <small style={{ color: '#6c757d', fontSize: '12px', display: 'block', marginTop: '4px' }}>
                                En az 8 karakter
                            </small>
                        </div>

                        <div className="form-group">
                            <label>Şifre Tekrar</label>
                            <input
                                type="password"
                                value={confirm}
                                onChange={(e) => setConfirm(e.target.value)}
                                placeholder="••••••••"
                                required
                                style={{
                                    width: '100%',
                                    padding: '10px 14px',
                                    border: '1px solid #ddd',
                                    borderRadius: '8px',
                                    fontSize: '14px',
                                    outline: 'none',
                                    fontFamily: 'inherit'
                                }}
                            />
                        </div>

                        <button 
                            type="submit" 
                            disabled={loading} 
                            className="auth-btn"
                            style={{
                                width: '100%',
                                padding: '12px',
                                background: 'linear-gradient(135deg, #6C63FF, #3F3D9E)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                fontSize: '16px',
                                fontWeight: '600',
                                cursor: loading ? 'not-allowed' : 'pointer',
                                opacity: loading ? 0.7 : 1,
                                transition: 'all 0.3s',
                                marginTop: '10px'
                            }}
                        >
                            {loading ? (
                                <>
                                    <span style={{ display: 'inline-block', animation: 'spin 1s linear infinite', marginRight: '8px' }}>⟳</span>
                                    Güncelleniyor...
                                </>
                            ) : (
                                'Şifreyi Güncelle'
                            )}
                        </button>
                    </form>

                    <div className="auth-footer" style={{ marginTop: '20px', textAlign: 'center' }}>
                        <Link to="/login" style={{ color: '#6C63FF', textDecoration: 'none' }}>Giriş sayfasına dön</Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ResetPassword;