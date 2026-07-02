import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/api';
import './Auth.css';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');
        setLoading(true);

        try {
            const response = await api.post('/auth/forgot-password', { email });

            if (response.data.success) {
                setMessage(response.data.message || 'Şifre sıfırlama linki e-posta adresinize gönderildi.');
            } else {
                setError(response.data.message || 'Bir hata oluştu');
            }
        } catch (err) {
          
            console.error('❌ TÜM HATA:', err);
            console.error('❌ RESPONSE:', err.response);
            console.error('❌ DATA:', err.response?.data);
            console.error('❌ STATUS:', err.response?.status);
            setError(err.response?.data?.message || 'Bir hata oluştu');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-container">
                <div className="auth-card">
                    <div className="auth-header">
                        <h1>🔐 Şifremi Unuttum</h1>
                        <p>E-posta adresinize sıfırlama linki gönderelim</p>
                    </div>

                    <form onSubmit={handleSubmit} className="auth-form">
                        {message && (
                            <div className="alert alert-success" style={{ background: '#d1fae5', color: '#065f46', padding: '12px', borderRadius: '10px', marginBottom: '20px' }}>
                                {message}
                            </div>
                        )}
                        {error && <div className="alert alert-danger">{error}</div>}

                        <div className="form-group">
                            <label>E-posta Adresi</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="ornek@mail.com"
                                required
                            />
                        </div>

                        <button type="submit" disabled={loading} className="auth-btn">
                            {loading ? 'Gönderiliyor...' : 'Sıfırlama Linki Gönder'}
                        </button>
                    </form>

                    <div className="auth-footer">
                        <Link to="/login">Giriş sayfasına dön</Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;