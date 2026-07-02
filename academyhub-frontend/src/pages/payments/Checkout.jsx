import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { FaSpinner, FaCreditCard, FaLock, FaArrowLeft } from 'react-icons/fa';
import Swal from 'sweetalert2';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../api/api';

const Checkout = () => {
    const { courseId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [course, setCourse] = useState(null);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [cardInfo, setCardInfo] = useState({
        cardNumber: '',
        cardHolder: '',
        expiry: '',
        cvv: ''
    });

    useEffect(() => {
        fetchCourseAndCheckEnrollment();  
    }, [courseId]);

    //  Kayıt kontrolü yapıyoruz 
    const fetchCourseAndCheckEnrollment = async () => {
        try {
            setLoading(true);
            
            // 1. Kurs bilgilerini getir
            const courseRes = await api.get(`/course/${courseId}`);
            setCourse(courseRes.data.data);
            
            // 2. Kullanıcı giriş yapmışsa kayıt kontrolü yap
            if (user) {
                try {
                    const enrollRes = await api.get(`/enrollment/check/${courseId}`);
                    console.log('🔍 Kayıt kontrolü:', enrollRes.data);
                    
                    if (enrollRes.data?.data?.isEnrolled) {
                        Swal.fire({
                            icon: 'info',
                            title: 'Zaten Kayıtlısınız!',
                            text: 'Bu kursa zaten kayıtlısınız. Kurs sayfasına yönlendiriliyorsunuz.',
                            timer: 2000,
                            showConfirmButton: false
                        });
                        navigate(`/courses/${courseId}`);
                        return;
                    }
                } catch (err) {
                    console.error('Kayıt kontrolü hatası:', err);
                }
            }
            
        } catch (err) {
            console.error('Kurs bilgileri yüklenirken hata:', err);
            Swal.fire({
                icon: 'error',
                title: 'Hata!',
                text: 'Kurs bilgileri yüklenemedi!'
            });
            navigate('/courses');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setCardInfo(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // ============================================================
        //  ÜCRETSİZ KURS KONTROLÜ 
        // ============================================================
        if (course.isFree) {
            try {
                // Doğrudan kayıt oluştur
                const response = await api.post('/enrollment', { 
                    courseId: parseInt(courseId),
                    paidAmount: 0 
                });
                
                Swal.fire({
                    icon: 'success',
                    title: '🎉 Kaydınız Başarılı!',
                    text: 'Ücretsiz kursa başarıyla kaydoldunuz.',
                    timer: 2000,
                    showConfirmButton: false
                });
                
                navigate(`/my-courses`);
                return;
            } catch (err) {
                console.error('❌ Ücretsiz kayıt hatası:', err);
                Swal.fire({
                    icon: 'error',
                    title: 'Hata!',
                    text: err.response?.data?.message || 'Kayıt işlemi başarısız!',
                    confirmButtonColor: '#ef4444'
                });
                return;
            }
        }
       

        // Ücretli kurs için ödeme işlemi
        if (!cardInfo.cardNumber || !cardInfo.cardHolder || !cardInfo.expiry || !cardInfo.cvv) {
            Swal.fire({
                icon: 'warning',
                title: 'Uyarı',
                text: 'Lütfen tüm alanları doldurun!'
            });
            return;
        }

        setProcessing(true);

        try {
            const paymentData = {
                courseId: parseInt(courseId),
                amount: course.price,
                paymentMethod: 'CreditCard',
                paymentDetails: JSON.stringify({
                    cardNumber: cardInfo.cardNumber.replace(/\s/g, '').slice(-4),
                    cardHolder: cardInfo.cardHolder,
                    expiry: cardInfo.expiry
                })
            };

            console.log('🔴 Gönderilen ödeme verisi:', paymentData);

            const paymentRes = await api.post('/payment', paymentData);
            
            console.log('🟢 Ödeme cevabı:', paymentRes.data);
            
            if (paymentRes.data.success) {
                Swal.fire({
                    icon: 'success',
                    title: '🎉 Ödeme Başarılı!',
                    text: 'Kursa başarıyla kaydoldunuz.',
                    timer: 2000,
                    showConfirmButton: false
                });

                navigate(`/my-courses`);
            }
        } catch (err) {
            console.error('❌ Ödeme hatası:', err);
            console.error('❌ Hata detayı:', err.response?.data);
            
            let errorMessage = err.response?.data?.message || 'Ödeme işlemi sırasında bir hata oluştu.';
            
            if (errorMessage.includes('zaten kayıtlı')) {
                Swal.fire({
                    icon: 'info',
                    title: 'Zaten Kayıtlısınız!',
                    text: 'Bu kursa zaten kayıtlısınız.',
                    confirmButtonColor: '#667eea'
                });
                navigate(`/courses/${courseId}`);
                return;
            }
            
            Swal.fire({
                icon: 'error',
                title: 'Ödeme Başarısız!',
                text: errorMessage
            });
        } finally {
            setProcessing(false);
        }
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
                <FaSpinner style={{ animation: 'spin 1s linear infinite', color: '#667eea', fontSize: 48 }} />
            </div>
        );
    }

    if (!course) {
        return (
            <div style={{ textAlign: 'center', padding: 60 }}>
                <h3>Kurs bulunamadı</h3>
                <button onClick={() => navigate('/courses')}>← Kurslara Dön</button>
            </div>
        );
    }

    return (
        <div style={{ maxWidth: 600, margin: '0 auto', padding: '24px 20px' }}>
            <Link to={`/courses/${courseId}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: '#64748b', textDecoration: 'none', marginBottom: 24 }}>
                <FaArrowLeft /> Kursa Dön
            </Link>

            <div style={{ background: 'white', borderRadius: 16, padding: 32, boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}>
                <h2 style={{ fontSize: 24, fontWeight: 700, color: '#0f0c29', marginBottom: 8 }}>💳 Ödeme</h2>
                <p style={{ color: '#64748b', marginBottom: 24 }}>{course?.title}</p>

                <div style={{ padding: 16, background: '#f8fafc', borderRadius: 10, marginBottom: 24 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#475569' }}>Toplam Tutar</span>
                        <span style={{ fontSize: 24, fontWeight: 700, color: '#0f0c29' }}>
                            {course.isFree ? '🆓 Ücretsiz' : (course.formattedPrice || `${course?.price} ₺`)}
                        </span>
                    </div>
                </div>

                {/*  Ücretsiz kurs için ödeme formunu gizle */}
                {course.isFree ? (
                    <div style={{ textAlign: 'center', padding: 20 }}>
                        <p style={{ fontSize: 16, color: '#10b981' }}>✅ Bu kurs tamamen ücretsizdir!</p>
                        <p style={{ fontSize: 14, color: '#6b7280', marginTop: 8 }}>
                            Kaydolmak için aşağıdaki butona tıklayın.
                        </p>
                        <button
                            onClick={handleSubmit}
                            style={{
                                width: '100%',
                                padding: '14px',
                                background: '#10b981',
                                color: 'white',
                                border: 'none',
                                borderRadius: 10,
                                fontSize: 16,
                                fontWeight: 600,
                                cursor: 'pointer',
                                marginTop: 16
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = '#059669'}
                            onMouseLeave={(e) => e.currentTarget.style.background = '#10b981'}
                        >
                            🎓 Ücretsiz Kaydol
                        </button>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit}>
                        <div style={{ marginBottom: 16 }}>
                            <label style={{ display: 'block', fontWeight: 600, marginBottom: 6, fontSize: 14, color: '#0f0c29' }}>Kart Numarası</label>
                            <input
                                type="text"
                                name="cardNumber"
                                value={cardInfo.cardNumber}
                                onChange={handleChange}
                                placeholder="1234 5678 9012 3456"
                                maxLength="19"
                                style={{ width: '100%', padding: '12px 16px', border: '2px solid #e2e8f0', borderRadius: 10, fontSize: 15 }}
                                onInput={(e) => {
                                    let value = e.target.value.replace(/\D/g, '');
                                    value = value.replace(/(.{4})/g, '$1 ').trim();
                                    e.target.value = value;
                                }}
                                required
                            />
                        </div>

                        <div style={{ marginBottom: 16 }}>
                            <label style={{ display: 'block', fontWeight: 600, marginBottom: 6, fontSize: 14, color: '#0f0c29' }}>Kart Sahibi</label>
                            <input
                                type="text"
                                name="cardHolder"
                                value={cardInfo.cardHolder}
                                onChange={handleChange}
                                placeholder="AD SOYAD"
                                style={{ width: '100%', padding: '12px 16px', border: '2px solid #e2e8f0', borderRadius: 10, fontSize: 15 }}
                                required
                            />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                            <div>
                                <label style={{ display: 'block', fontWeight: 600, marginBottom: 6, fontSize: 14, color: '#0f0c29' }}>Son Kullanma</label>
                                <input
                                    type="text"
                                    name="expiry"
                                    value={cardInfo.expiry}
                                    onChange={handleChange}
                                    placeholder="MM/YY"
                                    maxLength="5"
                                    style={{ width: '100%', padding: '12px 16px', border: '2px solid #e2e8f0', borderRadius: 10, fontSize: 15 }}
                                    onInput={(e) => {
                                        let value = e.target.value.replace(/\D/g, '');
                                        if (value.length >= 2) {
                                            value = value.substring(0, 2) + '/' + value.substring(2);
                                        }
                                        e.target.value = value;
                                    }}
                                    required
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontWeight: 600, marginBottom: 6, fontSize: 14, color: '#0f0c29' }}>CVV</label>
                                <input
                                    type="password"
                                    name="cvv"
                                    value={cardInfo.cvv}
                                    onChange={handleChange}
                                    placeholder="***"
                                    maxLength="4"
                                    style={{ width: '100%', padding: '12px 16px', border: '2px solid #e2e8f0', borderRadius: 10, fontSize: 15 }}
                                    required
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={processing}
                            style={{
                                width: '100%',
                                padding: '14px',
                                background: 'linear-gradient(135deg, #667eea, #764ba2)',
                                color: 'white',
                                border: 'none',
                                borderRadius: 10,
                                fontSize: 16,
                                fontWeight: 600,
                                cursor: processing ? 'not-allowed' : 'pointer',
                                opacity: processing ? 0.7 : 1,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 8,
                                marginTop: 24
                            }}
                        >
                            {processing ? <FaSpinner style={{ animation: 'spin 1s linear infinite' }} /> : <FaLock />}
                            {processing ? 'İşleniyor...' : `${course.formattedPrice || `${course?.price} ₺`} - Öde ve Kaydol`}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
};

export default Checkout;