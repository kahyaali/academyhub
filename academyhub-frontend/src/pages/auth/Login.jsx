import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { FaEnvelope, FaLock, FaEye, FaEyeSlash } from 'react-icons/fa';
import Swal from 'sweetalert2';
import './Auth.css';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!email.trim()) {
            Swal.fire({
                icon: 'warning',
                title: 'Uyarı',
                text: 'E-posta alanı boş olamaz!',
                confirmButtonColor: '#667eea'
            });
            return;
        }
        
        if (!password.trim()) {
            Swal.fire({
                icon: 'warning',
                title: 'Uyarı',
                text: 'Şifre alanı boş olamaz!',
                confirmButtonColor: '#667eea'
            });
            return;
        }

        setLoading(true);
        
        try {
            await login(email, password);
            navigate('/dashboard');
        } catch (err) {
            const errorMessage = err.response?.data?.message || 'Giriş yapılırken bir hata oluştu!';
            Swal.fire({
                icon: 'error',
                title: 'Hata!',
                text: errorMessage,
                confirmButtonColor: '#ef4444'
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-container">
                <div className="auth-card">
                    <div className="auth-header">
                        <h1>Giriş Yap</h1>
                        <p>Hesabınıza giriş yapın</p>
                    </div>

                    <form onSubmit={handleSubmit} className="auth-form">
                        <div className="form-group">
                            <label><FaEnvelope /> E-posta Adresi</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="ornek@mail.com"
                                autoComplete="email"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label><FaLock /> Şifre</label>
                            <div className="password-wrapper">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    autoComplete="current-password"
                                    required
                                />
                                <button
                                    type="button"
                                    className="password-toggle"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                                </button>
                            </div>
                        </div>

                        <div className="auth-options">
                            <label>
                                <input type="checkbox" /> Beni Hatırla
                            </label>
                            <Link to="/forgot-password">Şifremi Unuttum?</Link>
                        </div>

                        <button type="submit" className="auth-btn" disabled={loading}>
                            {loading ? 'Giriş Yapılıyor...' : 'Giriş Yap'}
                        </button>
                    </form>

                    <div className="auth-footer">
                        <p>Hesabınız yok mu? <Link to="/register">Kaydol</Link></p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;