import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { FaEnvelope, FaLock, FaUser, FaEye, FaEyeSlash, FaPhone, FaMapMarker, FaCalendar, FaUserGraduate, FaChalkboardTeacher } from 'react-icons/fa';
import Swal from 'sweetalert2';
import './Auth.css';

const Register = () => {
    const [data, setData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        confirmPassword: '',
        role: 1,
        phoneNumber: '',
        address: '',
        birthDate: '',
        bio: '',
        expertise: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { register } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e) => {
        setData({ ...data, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!data.firstName.trim()) {
            Swal.fire({ icon: 'warning', title: 'Uyarı', text: 'Ad alanı boş olamaz!', confirmButtonColor: '#667eea' });
            return;
        }
        if (!data.lastName.trim()) {
            Swal.fire({ icon: 'warning', title: 'Uyarı', text: 'Soyad alanı boş olamaz!', confirmButtonColor: '#667eea' });
            return;
        }
        if (!data.email.trim()) {
            Swal.fire({ icon: 'warning', title: 'Uyarı', text: 'E-posta alanı boş olamaz!', confirmButtonColor: '#667eea' });
            return;
        }
        if (data.password.length < 8) {
            Swal.fire({ icon: 'warning', title: 'Uyarı', text: 'Şifre en az 8 karakter olmalıdır!', confirmButtonColor: '#667eea' });
            return;
        }
        if (data.password !== data.confirmPassword) {
            Swal.fire({ icon: 'warning', title: 'Uyarı', text: 'Şifreler eşleşmiyor!', confirmButtonColor: '#667eea' });
            return;
        }

        if (data.role === 2) {
            if (!data.bio?.trim()) {
                Swal.fire({ icon: 'warning', title: 'Uyarı', text: 'Biyografi alanı boş olamaz!', confirmButtonColor: '#667eea' });
                return;
            }
            if (!data.expertise?.trim()) {
                Swal.fire({ icon: 'warning', title: 'Uyarı', text: 'Uzmanlık alanı boş olamaz!', confirmButtonColor: '#667eea' });
                return;
            }
        }

        setLoading(true);
        try {
            const submitData = {
                firstName: data.firstName.trim(),
                lastName: data.lastName.trim(),
                email: data.email.trim(),
                password: data.password,
                confirmPassword: data.confirmPassword,
                role: data.role === 1 ? "Student" : "Instructor",
                phoneNumber: data.phoneNumber?.trim() || "",
                address: data.address?.trim() || "",
                birthDate: data.birthDate || null,
                bio: data.bio?.trim() || "",
                expertise: data.expertise?.trim() || "",
                profileImage: ""
            };

            await register(submitData);
            navigate('/dashboard');
        } catch (err) {
            let errorMessage = 'Kayıt olurken bir hata oluştu!';
            if (err.response?.data?.message) {
                errorMessage = err.response.data.message;
            }
            if (err.response?.data?.errors) {
                const errors = Object.values(err.response.data.errors).flat();
                errorMessage = errors.join('\n');
            }
            Swal.fire({ icon: 'error', title: 'Hata!', text: errorMessage, confirmButtonColor: '#ef4444' });
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-container register-container">
                <div className="auth-card-horizontal">
                    {/* Sol Taraf - Sadece logo */}
                    <div className="auth-left">
                        <div className="auth-left-content">
                            <div className="auth-logo">🎓</div>
                            <h2>AcademyHub</h2>
                            <p>Online eğitim platformu</p>
                        </div>
                    </div>

                    {/* Sağ Taraf - Form */}
                    <div className="auth-right">
                        <div className="auth-header">
                            <h1>Kaydol</h1>
                            <p>Hemen ücretsiz hesap oluşturun</p>
                        </div>

                        <form onSubmit={handleSubmit} className="auth-form">
                            {error && <div className="alert alert-danger">{error}</div>}

                            {/* 2 SÜTUN - AD SOYAD */}
                            <div className="form-row">
                                <div className="form-group">
                                    <label><FaUser /> Ad</label>
                                    <input 
                                        type="text" 
                                        name="firstName" 
                                        value={data.firstName} 
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
                                        value={data.lastName} 
                                        onChange={handleChange} 
                                        placeholder="Soyadınız" 
                                        required 
                                    />
                                </div>
                            </div>

                            {/* 1 SÜTUN - EMAIL */}
                            <div className="form-group full-width">
                                <label><FaEnvelope /> E-posta Adresi</label>
                                <input 
                                    type="email" 
                                    name="email" 
                                    value={data.email} 
                                    onChange={handleChange} 
                                    placeholder="ornek@mail.com" 
                                    required 
                                />
                            </div>

                            {/* 2 SÜTUN - ŞİFRE */}
                            <div className="form-row">
                                <div className="form-group">
                                    <label><FaLock /> Şifre</label>
                                    <div className="password-wrapper">
                                        <input 
                                            type={showPassword ? 'text' : 'password'} 
                                            name="password" 
                                            value={data.password} 
                                            onChange={handleChange} 
                                            placeholder="••••••••" 
                                            required 
                                        />
                                        <button type="button" className="password-toggle" onClick={() => setShowPassword(!showPassword)}>
                                            {showPassword ? <FaEyeSlash /> : <FaEye />}
                                        </button>
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label><FaLock /> Şifre Tekrar</label>
                                    <div className="password-wrapper">
                                        <input 
                                            type={showConfirmPassword ? 'text' : 'password'} 
                                            name="confirmPassword" 
                                            value={data.confirmPassword} 
                                            onChange={handleChange} 
                                            placeholder="••••••••" 
                                            required 
                                        />
                                        <button type="button" className="password-toggle" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                                            {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* 2 SÜTUN - ROL */}
                            <div className="form-group full-width">
                                <label>Hesap Türü</label>
                                <div className="role-selector">
                                    <button 
                                        type="button" 
                                        className={`role-btn ${data.role === 1 ? 'active' : ''}`} 
                                        onClick={() => setData({ ...data, role: 1 })}
                                    >
                                        <FaUserGraduate /> Öğrenci
                                    </button>
                                    <button 
                                        type="button" 
                                        className={`role-btn ${data.role === 2 ? 'active' : ''}`} 
                                        onClick={() => setData({ ...data, role: 2 })}
                                    >
                                        <FaChalkboardTeacher /> Eğitmen
                                    </button>
                                </div>
                            </div>

                            {/* EĞİTMEN ALANLARI */}
                            {data.role === 2 && (
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Biyografi *</label>
                                        <textarea 
                                            name="bio" 
                                            value={data.bio} 
                                            onChange={handleChange} 
                                            placeholder="Kendinizi tanıtın..." 
                                            rows={3}
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Uzmanlık Alanları *</label>
                                        <input 
                                            type="text" 
                                            name="expertise" 
                                            value={data.expertise} 
                                            onChange={handleChange} 
                                            placeholder="Örn: React, C#, Python" 
                                            required
                                        />
                                    </div>
                                </div>
                            )}

                            {/* ÖĞRENCİ ALANLARI */}
                            {data.role === 1 && (
                                <>
                                    <div className="form-row">
                                        <div className="form-group">
                                            <label><FaPhone /> Telefon</label>
                                            <input 
                                                type="tel" 
                                                name="phoneNumber" 
                                                value={data.phoneNumber} 
                                                onChange={handleChange} 
                                                placeholder="Telefon numaranız" 
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label><FaCalendar /> Doğum Tarihi</label>
                                            <input 
                                                type="date" 
                                                name="birthDate" 
                                                value={data.birthDate} 
                                                onChange={handleChange} 
                                            />
                                        </div>
                                    </div>
                                    <div className="form-group full-width">
                                        <label><FaMapMarker /> Adres</label>
                                        <input 
                                            type="text" 
                                            name="address" 
                                            value={data.address} 
                                            onChange={handleChange} 
                                            placeholder="Adresiniz" 
                                        />
                                    </div>
                                </>
                            )}

                            <button type="submit" className="auth-btn" disabled={loading}>
                                {loading ? 'Kaydediliyor...' : 'Kaydol'}
                            </button>

                            <div className="auth-footer">
                                <p>Zaten hesabınız var mı? <Link to="/login">Giriş Yap</Link></p>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Register;