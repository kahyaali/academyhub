import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { FaArrowLeft, FaSave, FaSpinner } from 'react-icons/fa';
import Swal from 'sweetalert2';
import api from '../../api/api';

const CourseCreate = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [categories, setCategories] = useState([]);
    const [instructors, setInstructors] = useState([]);
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
        instructorId: '',
        isPublished: false  
    });

    const isAdmin = user?.role === 'Admin' || user?.role === 3 || user?.role === 'admin';
    const isInstructor = user?.role === 'Instructor' || user?.role === 2 || user?.role === 'instructor';

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

    const currencyOptions = [
        { value: 'TL', label: '₺ TL' },
        { value: 'USD', label: '$ USD' },
        { value: 'EUR', label: '€ EUR' },
        { value: 'GBP', label: '£ GBP' }
    ];

    useEffect(() => {
        fetchCategories();
        if (isAdmin) {
            fetchInstructors();
        }
    }, []);

    const fetchCategories = async () => {
        try {
            const res = await api.get('/category');
            const data = res.data.data?.items || res.data.data || [];
            setCategories(data);
        } catch (err) {
            console.error('Kategoriler yüklenirken hata:', err);
        }
    };

    const fetchInstructors = async () => {
        try {
            const res = await api.get('/user/instructors');
            setInstructors(res.data.data || []);
        } catch (err) {
            console.error('Eğitmenler yüklenirken hata:', err);
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

        if (!form.title.trim()) {
            Swal.fire({
                icon: 'warning',
                title: 'Uyarı',
                text: 'Kurs başlığı gereklidir!',
                confirmButtonColor: '#667eea'
            });
            return;
        }

        if (!form.categoryId) {
            Swal.fire({
                icon: 'warning',
                title: 'Uyarı',
                text: 'Lütfen bir kategori seçiniz!',
                confirmButtonColor: '#667eea'
            });
            return;
        }

        if (isAdmin && !form.instructorId) {
            Swal.fire({
                icon: 'warning',
                title: 'Uyarı',
                text: 'Lütfen bir eğitmen seçiniz!',
                confirmButtonColor: '#667eea'
            });
            return;
        }

        setLoading(true);
        try {
            const payload = {
                title: form.title.trim(),
                description: form.description.trim() || "Kurs açıklaması",
                shortDescription: form.shortDescription?.trim() || "",
                price: form.isFree ? 0 : Number(form.price),
                currency: currencyMap[form.currency] || 1,
                isFree: form.isFree,
                categoryId: parseInt(form.categoryId),
                level: levelMap[form.level] || 1,
                whatYouWillLearn: form.whatYouWillLearn?.trim() || "",
                requirements: form.requirements?.trim() || "",
                targetAudience: form.targetAudience?.trim() || "",
                isPublished: form.isPublished  
            };

                // ============================================================
        // DEBUG - Konsola yazdır 
        // ============================================================
        console.log('📤 GÖNDERİLEN PAYLOAD:');
        console.log('📤 Title:', payload.title);
        console.log('📤 isPublished:', payload.isPublished);
        console.log('📤 Tüm payload:', payload);
        // ============================================================

            if (isAdmin && form.instructorId) {
                payload.instructorId = parseInt(form.instructorId);
            }

            const response = await api.post('/course', payload);

            //  Başarılı mesajı - Yayınlandıysa farklı mesaj göster
            if (form.isPublished) {
                Swal.fire({
                    icon: 'success',
                    title: '🎉 Kurs Yayınlandı!',
                    text: 'Kurs başarıyla yayınlandı. Öğrencilere bildirim gönderildi.',
                    timer: 3000,
                    showConfirmButton: false
                });
            } else {
                Swal.fire({
                    icon: 'success',
                    title: '✅ Kurs Oluşturuldu!',
                    text: 'Kurs taslak olarak oluşturuldu. Yayınlamak için kurs detayına gidin.',
                    timer: 2000,
                    showConfirmButton: false
                });
            }

            if (isInstructor) {
                navigate('/instructor/courses');
            } else {
                navigate('/courses');
            }
        } catch (err) {
            console.error('❌ Hata:', err.response?.data);
            
            const errors = err.response?.data?.errors;
            let errorMessage = 'Kurs oluşturulurken bir hata oluştu!';

            if (errors) {
                const errorMessages = Object.values(errors).flat();
                errorMessage = errorMessages.join('\n');
            } else if (err.response?.data?.message) {
                errorMessage = err.response.data.message;
            }

            Swal.fire({
                icon: 'error',
                title: 'Hata!',
                text: errorMessage,
                confirmButtonColor: '#ef4444'
            });
            setLoading(false);
        }
    };

    const handleBack = () => {
        if (isInstructor) {
            navigate('/instructor/courses');
        } else {
            navigate('/courses');
        }
    };

    return (
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
                <button onClick={handleBack} style={{
                    background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#4b5563'
                }}>
                    <FaArrowLeft />
                </button>
                <div>
                    <h1 style={{ fontSize: 28, margin: 0, color: '#0f0c29' }}>Yeni Kurs</h1>
                    <p style={{ color: '#6c757d', margin: 4 }}>Yeni bir kurs oluşturun</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} style={{ 
                background: 'white', 
                padding: 32, 
                borderRadius: 16, 
                boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '20px 24px'
            }}>
                {isAdmin && (
                    <div style={{ gridColumn: '1 / -1' }}>
                        <label style={{ display: 'block', fontWeight: 600, marginBottom: 4, fontSize: 14 }}>Eğitmen *</label>
                        <select
                            name="instructorId"
                            value={form.instructorId}
                            onChange={handleChange}
                            style={{ width: '100%', padding: 12, border: '1px solid #d1d5db', borderRadius: 8, fontSize: 15 }}
                            required
                        >
                            <option value="">Eğitmen Seçin</option>
                            {instructors.map(inst => (
                                <option key={inst.id} value={inst.id}>
                                    {inst.firstName} {inst.lastName} ({inst.email})
                                </option>
                            ))}
                        </select>
                    </div>
                )}

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

                <div>
                    <label style={{ display: 'block', fontWeight: 600, marginBottom: 4, fontSize: 14 }}>Kategori *</label>
                    <select
                        name="categoryId"
                        value={form.categoryId}
                        onChange={handleChange}
                        style={{ width: '100%', padding: 12, border: '1px solid #d1d5db', borderRadius: 8, fontSize: 15 }}
                        required
                    >
                        <option value="">Seçiniz</option>
                        {categories.map(cat => (
                            <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>
                        ))}
                    </select>
                </div>

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

             
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingTop: 24 }}>
                    <input
                        type="checkbox"
                        name="isPublished"
                        checked={form.isPublished}
                        onChange={handleChange}
                        style={{ width: 20, height: 20, cursor: 'pointer' }}
                    />
                    <label style={{ fontWeight: 500, fontSize: 15, cursor: 'pointer' }}>
                        📢 Kursu hemen yayınla
                    </label>
                    <span style={{ fontSize: 12, color: '#6b7280' }}>
                        (İşaretlerseniz kurs yayınlanır ve öğrencilere bildirim gider)
                    </span>
                </div>

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

                <div>
                    <label style={{ display: 'block', fontWeight: 600, marginBottom: 4, fontSize: 14 }}>Kısa Açıklama</label>
                    <input
                        type="text"
                        name="shortDescription"
                        value={form.shortDescription}
                        onChange={handleChange}
                        style={{ width: '100%', padding: 12, border: '1px solid #d1d5db', borderRadius: 8, fontSize: 15 }}
                    />
                </div>

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

                <div style={{ gridColumn: '1 / -1', display: 'flex', gap: 12, marginTop: 8 }}>
                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            flex: 1,
                            padding: '14px 32px',
                            background: 'linear-gradient(135deg, #667eea, #764ba2)',
                            color: 'white',
                            border: 'none',
                            borderRadius: 10,
                            fontSize: 16,
                            fontWeight: 600,
                            cursor: loading ? 'not-allowed' : 'pointer',
                            opacity: loading ? 0.7 : 1,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 8
                        }}
                    >
                        {loading ? <FaSpinner style={{ animation: 'spin 1s linear infinite' }} /> : <FaSave />}
                        {loading ? 'Kaydediliyor...' : form.isPublished ? '📢 Yayınla ve Kaydet' : 'Taslak Olarak Kaydet'}
                    </button>
                    <button
                        type="button"
                        onClick={handleBack}
                        style={{
                            padding: '14px 32px',
                            background: 'none',
                            border: '1px solid #d1d5db',
                            borderRadius: 10,
                            fontSize: 16,
                            fontWeight: 500,
                            cursor: 'pointer',
                            color: '#4b5563'
                        }}
                    >
                        İptal
                    </button>
                </div>
            </form>
        </div>
    );
};

export default CourseCreate;