import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaSave, FaSpinner } from 'react-icons/fa';
import Swal from 'sweetalert2';
import Layout from '../../components/Layout';
import api from '../../api/api';

const InstructorCreate = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        confirmPassword: '',
        bio: '',
        expertise: ''
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
            await api.post('/auth/register', {
                ...form,
                role: 2  
            });

            Swal.fire({
                icon: 'success',
                title: 'Başarılı!',
                text: 'Eğitmen başarıyla oluşturuldu.',
                timer: 2000,
                showConfirmButton: false
            });

            navigate('/instructors');
        } catch (err) {
            const errorMessage = err.response?.data?.message || 'Eğitmen oluşturulurken hata oluştu!';
            Swal.fire({
                icon: 'error',
                title: 'Hata!',
                text: errorMessage,
                confirmButtonColor: '#ef4444'
            });
            setLoading(false);
        }
    };

    return (
        <Layout>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
                <button onClick={() => navigate('/instructors')} style={{
                    background: 'none', border: 'none', fontSize: 20, cursor: 'pointer'
                }}>
                    <FaArrowLeft />
                </button>
                <div>
                    <h1 style={{ fontSize: 28, margin: 0 }}>Yeni Eğitmen</h1>
                    <p style={{ color: '#6c757d', margin: 4 }}>Sisteme yeni eğitmen ekleyin</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} style={{ background: 'white', padding: 24, borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <div>
                        <label style={{ display: 'block', fontWeight: 600, marginBottom: 4 }}>Ad *</label>
                        <input
                            type="text"
                            name="firstName"
                            value={form.firstName}
                            onChange={handleChange}
                            required
                            style={{ width: '100%', padding: 10, border: '1px solid #d1d5db', borderRadius: 8 }}
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', fontWeight: 600, marginBottom: 4 }}>Soyad *</label>
                        <input
                            type="text"
                            name="lastName"
                            value={form.lastName}
                            onChange={handleChange}
                            required
                            style={{ width: '100%', padding: 10, border: '1px solid #d1d5db', borderRadius: 8 }}
                        />
                    </div>
                </div>

                <div style={{ marginTop: 16 }}>
                    <label style={{ display: 'block', fontWeight: 600, marginBottom: 4 }}>E-posta *</label>
                    <input
                        type="email"
                        name="email"
                        value={form.email}
                        onChange={handleChange}
                        required
                        style={{ width: '100%', padding: 10, border: '1px solid #d1d5db', borderRadius: 8 }}
                    />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 16 }}>
                    <div>
                        <label style={{ display: 'block', fontWeight: 600, marginBottom: 4 }}>Şifre *</label>
                        <input
                            type="password"
                            name="password"
                            value={form.password}
                            onChange={handleChange}
                            required
                            style={{ width: '100%', padding: 10, border: '1px solid #d1d5db', borderRadius: 8 }}
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', fontWeight: 600, marginBottom: 4 }}>Şifre Tekrar *</label>
                        <input
                            type="password"
                            name="confirmPassword"
                            value={form.confirmPassword}
                            onChange={handleChange}
                            required
                            style={{ width: '100%', padding: 10, border: '1px solid #d1d5db', borderRadius: 8 }}
                        />
                    </div>
                </div>

                <div style={{ marginTop: 16 }}>
                    <label style={{ display: 'block', fontWeight: 600, marginBottom: 4 }}>Biyografi</label>
                    <textarea
                        name="bio"
                        value={form.bio}
                        onChange={handleChange}
                        rows={3}
                        placeholder="Eğitmen hakkında kısa bilgi..."
                        style={{ width: '100%', padding: 10, border: '1px solid #d1d5db', borderRadius: 8 }}
                    />
                </div>

                <div style={{ marginTop: 16 }}>
                    <label style={{ display: 'block', fontWeight: 600, marginBottom: 4 }}>Uzmanlık Alanları</label>
                    <input
                        type="text"
                        name="expertise"
                        value={form.expertise}
                        onChange={handleChange}
                        placeholder="Örn: React, C#, Python"
                        style={{ width: '100%', padding: 10, border: '1px solid #d1d5db', borderRadius: 8 }}
                    />
                </div>

                <div style={{ marginTop: 24, display: 'flex', gap: 12 }}>
                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            background: 'linear-gradient(135deg, #667eea, #764ba2)',
                            color: 'white',
                            border: 'none',
                            padding: '10px 32px',
                            borderRadius: 8,
                            cursor: loading ? 'not-allowed' : 'pointer',
                            opacity: loading ? 0.7 : 1,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8
                        }}
                    >
                        {loading ? <FaSpinner style={{ animation: 'spin 1s linear infinite' }} /> : <FaSave />}
                        {loading ? 'Kaydediliyor...' : 'Ekle'}
                    </button>
                    <button
                        type="button"
                        onClick={() => navigate('/instructors')}
                        style={{
                            background: 'none',
                            border: '1px solid #d1d5db',
                            padding: '10px 24px',
                            borderRadius: 8,
                            cursor: 'pointer'
                        }}
                    >
                        İptal
                    </button>
                </div>
            </form>
        </Layout>
    );
};

export default InstructorCreate;