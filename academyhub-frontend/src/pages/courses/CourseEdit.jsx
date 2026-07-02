import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { FaArrowLeft, FaSave, FaSpinner } from 'react-icons/fa';
import Swal from 'sweetalert2';
import api from '../../api/api';
import { useAuth } from '../../contexts/AuthContext';

const CourseEdit = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [categories, setCategories] = useState([]);
    const [form, setForm] = useState({
        title: '',
        description: '',
        shortDescription: '',
        price: 0,
        currency: 'TL',
        isFree: false,
        categoryId: '',
        level: 'Beginner',
        whatYouWillLearn: '',
        requirements: '',
        targetAudience: '',
        isPublished: false
    });

    const isInstructor = user?.role === 'Instructor' || user?.role === 2;

    const currencyMap = {
        'TL': 1,
        'USD': 2,
        'EUR': 3,
        'GBP': 4
    };

    const levelMap = {
        'Beginner': 1,
        'Intermediate': 2,
        'Advanced': 3,
        'AllLevels': 4
    };

    const levelReverseMap = {
        1: 'Beginner',
        2: 'Intermediate',
        3: 'Advanced',
        4: 'AllLevels'
    };

    const currencyReverseMap = {
        1: 'TL',
        2: 'USD',
        3: 'EUR',
        4: 'GBP'
    };

    const currencyOptions = [
        { value: 'TL', label: '₺ TL' },
        { value: 'USD', label: '$ USD' },
        { value: 'EUR', label: '€ EUR' },
        { value: 'GBP', label: '£ GBP' }
    ];

    useEffect(() => {
        fetchData();
    }, [id]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const courseRes = await api.get(`/course/${id}`);
            const course = courseRes.data.data;
            
            const catRes = await api.get('/category');
            const categoriesData = catRes.data.data?.items || catRes.data.data || [];
            setCategories(categoriesData);

            setForm({
                title: course.title || '',
                description: course.description || '',
                shortDescription: course.shortDescription || '',
                price: course.price || 0,
                currency: currencyReverseMap[course.currency] || 'TL',
                isFree: course.isFree || false,
                categoryId: course.categoryId || '',
                level: levelReverseMap[course.level] || 'Beginner',
                whatYouWillLearn: course.whatYouWillLearn || '',
                requirements: course.requirements || '',
                targetAudience: course.targetAudience || '',
                isPublished: course.isPublished || false
            });
        } catch (error) {
            console.error('Veriler yüklenirken hata:', error);
            Swal.fire({
                icon: 'error',
                title: 'Hata!',
                text: 'Kurs bilgileri yüklenemedi!',
                confirmButtonColor: '#ef4444'
            });
            if (isInstructor) {
                navigate('/instructor/courses');
            } else {
                navigate('/courses');
            }
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
            const payload = {
                title: form.title.trim(),
                description: form.description.trim(),
                shortDescription: form.shortDescription?.trim() || '',
                price: form.isFree ? 0 : Number(form.price),
                currency: currencyMap[form.currency] || 1,
                isFree: form.isFree,
                categoryId: parseInt(form.categoryId),
                level: levelMap[form.level] || 1,
                whatYouWillLearn: form.whatYouWillLearn?.trim() || '',
                requirements: form.requirements?.trim() || '',
                targetAudience: form.targetAudience?.trim() || '',
                isPublished: form.isPublished
            };

            await api.put(`/course/${id}`, payload);
            
            Swal.fire({
                icon: 'success',
                title: 'Başarılı!',
                text: 'Kurs başarıyla güncellendi.',
                timer: 2000,
                showConfirmButton: false
            });
            
            if (isInstructor) {
                navigate('/instructor/courses');
            } else {
                navigate(`/courses/${id}`);
            }
        } catch (error) {
            console.error('Güncelleme hatası:', error);
            
            let errorMessage = 'Kurs güncellenirken bir hata oluştu!';
            if (error.response?.data?.message) {
                errorMessage = error.response.data.message;
            }
            if (error.response?.data?.errors) {
                const errors = Object.values(error.response.data.errors).flat();
                errorMessage = errors.join('\n');
            }
            
            Swal.fire({
                icon: 'error',
                title: 'Hata!',
                text: errorMessage,
                confirmButtonColor: '#ef4444'
            });
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
                <FaSpinner size={40} style={{ animation: 'spin 1s linear infinite' }} />
            </div>
        );
    }

    return (
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: 20 }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
                <Link to={isInstructor ? '/instructor/courses' : `/courses/${id}`} style={{ fontSize: 20, color: '#6c757d' }}>
                    <FaArrowLeft />
                </Link>
                <div>
                    <h1 style={{ fontSize: 28, margin: 0, color: '#0f0c29' }}>✏️ Kursu Düzenle</h1>
                    <p style={{ color: '#6c757d', margin: 4 }}>Kurs bilgilerini güncelleyin</p>
                </div>
            </div>

            {/* Form - Grid Yapısı */}
            <form onSubmit={handleSubmit} style={{ 
                background: 'white', 
                padding: 32, 
                borderRadius: 16, 
                boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '20px 24px'
            }}>
                {/* Başlık */}
                <div>
                    <label style={{ display: 'block', fontWeight: 600, marginBottom: 4, fontSize: 14 }}>Başlık *</label>
                    <input
                        type="text"
                        name="title"
                        value={form.title}
                        onChange={handleChange}
                        required
                        style={{ width: '100%', padding: 12, border: '1px solid #d1d5db', borderRadius: 8, fontSize: 15 }}
                    />
                </div>

                {/* Kategori */}
                <div>
                    <label style={{ display: 'block', fontWeight: 600, marginBottom: 4, fontSize: 14 }}>Kategori</label>
                    <select
                        name="categoryId"
                        value={form.categoryId}
                        onChange={handleChange}
                        style={{ width: '100%', padding: 12, border: '1px solid #d1d5db', borderRadius: 8, fontSize: 15 }}
                    >
                        <option value="">Seçiniz</option>
                        {categories.map(cat => (
                            <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>
                        ))}
                    </select>
                </div>

                {/* Açıklama (Tam genişlik) */}
                <div style={{ gridColumn: '1 / -1' }}>
                    <label style={{ display: 'block', fontWeight: 600, marginBottom: 4, fontSize: 14 }}>Açıklama</label>
                    <textarea
                        name="description"
                        value={form.description}
                        onChange={handleChange}
                        rows={4}
                        style={{ width: '100%', padding: 12, border: '1px solid #d1d5db', borderRadius: 8, fontSize: 15, resize: 'vertical' }}
                    />
                </div>

                {/* Fiyat */}
                <div>
                    <label style={{ display: 'block', fontWeight: 600, marginBottom: 4, fontSize: 14 }}>Fiyat</label>
                    <div style={{ display: 'flex', gap: 8 }}>
                        <input
                            type="number"
                            name="price"
                            value={form.price}
                            onChange={handleChange}
                            style={{ flex: 1, padding: 12, border: '1px solid #d1d5db', borderRadius: 8, fontSize: 15 }}
                            disabled={form.isFree}
                        />
                        <select
                            name="currency"
                            value={form.currency}
                            onChange={handleChange}
                            style={{ padding: '12px 16px', border: '1px solid #d1d5db', borderRadius: 8, background: 'white', fontSize: 15 }}
                            disabled={form.isFree}
                        >
                            {currencyOptions.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Ücretsiz Checkbox */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingTop: 24 }}>
                    <input
                        type="checkbox"
                        name="isFree"
                        checked={form.isFree}
                        onChange={handleChange}
                        style={{ width: 20, height: 20, cursor: 'pointer' }}
                    />
                    <label style={{ fontWeight: 500, fontSize: 15, cursor: 'pointer' }}>Ücretsiz</label>
                </div>

                {/* Seviye */}
                <div>
                    <label style={{ display: 'block', fontWeight: 600, marginBottom: 4, fontSize: 14 }}>Seviye</label>
                    <select
                        name="level"
                        value={form.level}
                        onChange={handleChange}
                        style={{ width: '100%', padding: 12, border: '1px solid #d1d5db', borderRadius: 8, fontSize: 15 }}
                    >
                        <option value="Beginner">Başlangıç</option>
                        <option value="Intermediate">Orta</option>
                        <option value="Advanced">İleri</option>
                        <option value="AllLevels">Tüm Seviyeler</option>
                    </select>
                </div>

                {/* Yayında Checkbox */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingTop: 24 }}>
                    <input
                        type="checkbox"
                        name="isPublished"
                        checked={form.isPublished}
                        onChange={handleChange}
                        style={{ width: 20, height: 20, cursor: 'pointer' }}
                    />
                    <label style={{ fontWeight: 500, fontSize: 15, cursor: 'pointer' }}>Yayında</label>
                </div>

                {/* Kurs İçeriği (Tam genişlik) */}
                <div style={{ gridColumn: '1 / -1' }}>
                    <label style={{ display: 'block', fontWeight: 600, marginBottom: 4, fontSize: 14 }}>Kurs İçeriği (Ne öğrenecekler?)</label>
                    <textarea
                        name="whatYouWillLearn"
                        value={form.whatYouWillLearn}
                        onChange={handleChange}
                        rows={3}
                        style={{ width: '100%', padding: 12, border: '1px solid #d1d5db', borderRadius: 8, fontSize: 15, resize: 'vertical' }}
                    />
                </div>

                {/* Kısa Açıklama (Tam genişlik) */}
                <div style={{ gridColumn: '1 / -1' }}>
                    <label style={{ display: 'block', fontWeight: 600, marginBottom: 4, fontSize: 14 }}>Kısa Açıklama</label>
                    <input
                        type="text"
                        name="shortDescription"
                        value={form.shortDescription}
                        onChange={handleChange}
                        style={{ width: '100%', padding: 12, border: '1px solid #d1d5db', borderRadius: 8, fontSize: 15 }}
                    />
                </div>

                {/* Gereksinimler (Tam genişlik) */}
                <div style={{ gridColumn: '1 / -1' }}>
                    <label style={{ display: 'block', fontWeight: 600, marginBottom: 4, fontSize: 14 }}>Gereksinimler</label>
                    <textarea
                        name="requirements"
                        value={form.requirements}
                        onChange={handleChange}
                        rows={2}
                        style={{ width: '100%', padding: 12, border: '1px solid #d1d5db', borderRadius: 8, fontSize: 15, resize: 'vertical' }}
                    />
                </div>

                {/* Hedef Kitle (Tam genişlik) */}
                <div style={{ gridColumn: '1 / -1' }}>
                    <label style={{ display: 'block', fontWeight: 600, marginBottom: 4, fontSize: 14 }}>Hedef Kitle</label>
                    <textarea
                        name="targetAudience"
                        value={form.targetAudience}
                        onChange={handleChange}
                        rows={2}
                        style={{ width: '100%', padding: 12, border: '1px solid #d1d5db', borderRadius: 8, fontSize: 15, resize: 'vertical' }}
                    />
                </div>

                {/* Butonlar (Tam genişlik) */}
                <div style={{ gridColumn: '1 / -1', display: 'flex', gap: 12, marginTop: 8 }}>
                    <button
                        type="submit"
                        disabled={saving}
                        style={{
                            flex: 1,
                            padding: '14px 32px',
                            background: 'linear-gradient(135deg, #667eea, #764ba2)',
                            color: 'white',
                            border: 'none',
                            borderRadius: 10,
                            fontSize: 16,
                            fontWeight: 600,
                            cursor: saving ? 'not-allowed' : 'pointer',
                            opacity: saving ? 0.7 : 1,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 8
                        }}
                    >
                        {saving ? <FaSpinner style={{ animation: 'spin 1s linear infinite' }} /> : <FaSave />}
                        {saving ? 'Kaydediliyor...' : 'Güncelle'}
                    </button>
                    <Link
                        to={isInstructor ? '/instructor/courses' : `/courses/${id}`}
                        style={{
                            padding: '14px 32px',
                            background: 'none',
                            border: '1px solid #d1d5db',
                            borderRadius: 10,
                            fontSize: 16,
                            fontWeight: 500,
                            textDecoration: 'none',
                            color: '#4b5563',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                    >
                        İptal
                    </Link>
                </div>
            </form>
        </div>
    );
};

export default CourseEdit;