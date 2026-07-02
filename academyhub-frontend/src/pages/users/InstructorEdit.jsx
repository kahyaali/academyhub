import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { FaArrowLeft, FaSave, FaSpinner } from 'react-icons/fa';
import Swal from 'sweetalert2';
import Layout from '../../components/Layout';
import api from '../../api/api';

const InstructorEdit = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({
        firstName: '',
        lastName: '',
        email: '',
        bio: '',
        expertise: '',
        isActive: true
    });

    useEffect(() => {
        fetchInstructor();
    }, [id]);

    const fetchInstructor = async () => {
        try {
            const res = await api.get(`/user/${id}`);
            const data = res.data.data;
            setForm({
                firstName: data.firstName || '',
                lastName: data.lastName || '',
                email: data.email || '',
                bio: data.bio || '',
                expertise: data.expertise || '',
                isActive: data.isActive !== undefined ? data.isActive : true
            });
        } catch (err) {
            Swal.fire({
                icon: 'error',
                title: 'Hata!',
                text: 'Eğitmen bilgileri yüklenemedi!',
                confirmButtonColor: '#ef4444'
            });
            navigate('/instructors');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setForm({
            ...form,
            [name]: type === 'checkbox' ? checked : value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            await api.put(`/user/${id}`, form);
            Swal.fire({
                icon: 'success',
                title: 'Başarılı!',
                text: 'Eğitmen bilgileri güncellendi.',
                timer: 2000,
                showConfirmButton: false
            });
            navigate(`/instructors/${id}`);
        } catch (err) {
            Swal.fire({
                icon: 'error',
                title: 'Hata!',
                text: err.response?.data?.message || 'Güncelleme başarısız!',
                confirmButtonColor: '#ef4444'
            });
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <Layout>
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
                    <FaSpinner size={40} style={{ animation: 'spin 1s linear infinite' }} />
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
                <Link to={`/instructors/${id}`} style={{ fontSize: 20, color: '#6c757d' }}>
                    <FaArrowLeft />
                </Link>
                <div>
                    <h1 style={{ fontSize: 28, margin: 0 }}>✏️ Eğitmen Düzenle</h1>
                    <p style={{ color: '#6c757d', margin: 4 }}>Eğitmen bilgilerini güncelleyin</p>
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

                <div style={{ marginTop: 16 }}>
                    <label style={{ display: 'block', fontWeight: 600, marginBottom: 4 }}>Biyografi</label>
                    <textarea
                        name="bio"
                        value={form.bio}
                        onChange={handleChange}
                        rows={3}
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
                        style={{ width: '100%', padding: 10, border: '1px solid #d1d5db', borderRadius: 8 }}
                    />
                </div>

                <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
                    <input
                        type="checkbox"
                        name="isActive"
                        checked={form.isActive}
                        onChange={handleChange}
                        style={{ width: 18, height: 18 }}
                    />
                    <label>Aktif</label>
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
                    <Link
                        to={`/instructors/${id}`}
                        style={{
                            background: 'none',
                            border: '1px solid #d1d5db',
                            padding: '10px 24px',
                            borderRadius: 8,
                            textDecoration: 'none',
                            color: '#333'
                        }}
                    >
                        İptal
                    </Link>
                </div>
            </form>
        </Layout>
    );
};

export default InstructorEdit;