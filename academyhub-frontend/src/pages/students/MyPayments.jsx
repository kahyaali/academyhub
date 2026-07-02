import React, { useState, useEffect } from 'react';
import { FaSpinner, FaCreditCard, FaUndo, FaClock } from 'react-icons/fa';
import Swal from 'sweetalert2';
import api from '../../api/api';

const MyPayments = () => {
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchPayments();
    }, []);

    const fetchPayments = async () => {
        try {
            setLoading(true);
            const res = await api.get('/payment/me');
            console.log('📦 Ödemeler:', res.data);
            
            const data = res.data.data || [];
            
            //  Her ödemeyi detaylı kontrol et
            data.forEach((payment, index) => {
                console.log(`💰 Ödeme ${index + 1}:`, {
                    id: payment.id,
                    status: payment.status,
                    statusType: typeof payment.status,
                    paymentDate: payment.paymentDate,
                    amount: payment.amount
                });
            });
            
            setPayments(data);
        } catch (err) {
            console.error('Ödemeler yüklenirken hata:', err);
        } finally {
            setLoading(false);
        }
    };

    const requestRefund = async (paymentId) => {
        const result = await Swal.fire({
            title: '💰 İade Talebi',
            html: `
                <p style="color: #6b7280; font-size: 14px;">
                    İade talebiniz admin tarafından incelenecek ve onaylandığında 
                    ödemeniz iade edilecektir.
                </p>
                <div style="margin-top: 16px;">
                    <label style="display: block; text-align: left; font-weight: 600; margin-bottom: 4px;">
                        İade Sebebi
                    </label>
                    <textarea 
                        id="refundReason" 
                        style="width: 100%; padding: 10px; border-radius: 8px; border: 2px solid #e5e7eb; font-size: 14px;"
                        placeholder="Lütfen iade sebebinizi detaylı açıklayın..."
                        rows="4"
                    ></textarea>
                </div>
            `,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#f59e0b',
            cancelButtonColor: '#6b7280',
            confirmButtonText: '📤 İade Talebi Gönder',
            cancelButtonText: '❌ İptal',
            preConfirm: () => {
                const reason = document.getElementById('refundReason').value;
                if (!reason || reason.length < 5) {
                    Swal.showValidationMessage('Lütfen en az 5 karakterlik bir iade sebebi girin!');
                    return false;
                }
                return { reason };
            }
        });

        if (result.isConfirmed) {
            try {
                await api.post(`/payment/${paymentId}/request-refund`, {
                    reason: result.value.reason
                });
                
                Swal.fire({
                    icon: 'success',
                    title: '✅ Talebiniz Gönderildi!',
                    text: 'İade talebiniz başarıyla oluşturuldu. Admin onayı bekleniyor.',
                    timer: 3000,
                    showConfirmButton: false
                });
                
                fetchPayments();
            } catch (err) {
                console.error('İade talebi hatası:', err);
                Swal.fire({
                    icon: 'error',
                    title: 'Hata!',
                    text: err.response?.data?.message || 'İade talebi oluşturulamadı!',
                    confirmButtonColor: '#ef4444'
                });
            }
        }
    };

    const getStatusBadge = (status) => {
        // Status'ü string'e çevir
        const statusStr = String(status);
        
        const statusMap = {
            '1': { text: '⏳ Beklemede', color: '#f59e0b', bg: '#fef3c7' },
            '2': { text: '✅ Tamamlandı', color: '#10b981', bg: '#d1fae5' },
            '3': { text: '❌ Başarısız', color: '#ef4444', bg: '#fee2e2' },
            '4': { text: '🔄 İade Edildi', color: '#6b7280', bg: '#f3f4f6' },
            '5': { text: '📤 İade Talebi', color: '#f59e0b', bg: '#fef3c7' },
            'Pending': { text: '⏳ Beklemede', color: '#f59e0b', bg: '#fef3c7' },
            'Completed': { text: '✅ Tamamlandı', color: '#10b981', bg: '#d1fae5' },
            'Failed': { text: '❌ Başarısız', color: '#ef4444', bg: '#fee2e2' },
            'Refunded': { text: '🔄 İade Edildi', color: '#6b7280', bg: '#f3f4f6' },
            'RefundRequested': { text: '📤 İade Talebi', color: '#f59e0b', bg: '#fef3c7' }
        };
        return statusMap[statusStr] || { text: String(status), color: '#6b7280', bg: '#f3f4f6' };
    };


    const canRequestRefund = (payment) => {
        // Status'ü string'e çevir
        const statusStr = String(payment.status);
        
        console.log('🔍 İade kontrolü:', {
            id: payment.id,
            status: payment.status,
            statusStr: statusStr,
            isCompleted: statusStr === '2' || statusStr === 'Completed',
            paymentDate: payment.paymentDate
        });
        
        //  Sadece Completed (2) statüsündeki ödemeler iade edilebilir
        if (statusStr !== '2' && statusStr !== 'Completed') {
            console.log(`❌ Status Completed değil: ${statusStr}`);
            return false;
        }
        
        // 30 gün içinde mi kontrol et
        if (payment.paymentDate) {
            const paymentDate = new Date(payment.paymentDate);
            const now = new Date();
            const diffDays = (now - paymentDate) / (1000 * 60 * 60 * 24);
            
            if (diffDays > 30) {
                console.log(`❌ 30 günden fazla geçmiş: ${diffDays.toFixed(1)} gün`);
                return false;
            }
            console.log(`✅ İade edilebilir: ${diffDays.toFixed(1)} gün geçmiş`);
        } else {
            console.log('❌ paymentDate null');
            return false;
        }
        
        return true;
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
                <FaSpinner size={40} style={{ animation: 'spin 1s linear infinite', color: '#667eea' }} />
                <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    return (
        <div style={{ maxWidth: 1000, margin: '0 auto', padding: '24px 20px' }}>
            <div style={{ marginBottom: 24 }}>
                <h1 style={{ fontSize: 28, fontWeight: 700, color: '#0f0c29', margin: 0 }}>
                    💳 Ödemelerim
                </h1>
                <p style={{ color: '#6b7280', margin: '4px 0 0 0', fontSize: 15 }}>
                    {payments.length} ödeme kaydınız var
                </p>
            </div>

            {payments.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 60, background: 'white', borderRadius: 16 }}>
                    <div style={{ fontSize: 48, marginBottom: 16 }}>💳</div>
                    <h3 style={{ color: '#0f0c29' }}>Henüz ödeme yapmadınız</h3>
                </div>
            ) : (
                <div style={{ background: 'white', borderRadius: 16, overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead style={{ background: '#f8fafc' }}>
                            <tr>
                                <th style={{ padding: '12px 16px', textAlign: 'left' }}>#</th>
                                <th style={{ padding: '12px 16px', textAlign: 'left' }}>Kurs</th>
                                <th style={{ padding: '12px 16px', textAlign: 'center' }}>Tutar</th>
                                <th style={{ padding: '12px 16px', textAlign: 'center' }}>Tarih</th>
                                <th style={{ padding: '12px 16px', textAlign: 'center' }}>Durum</th>
                                <th style={{ padding: '12px 16px', textAlign: 'center' }}>İşlem</th>
                            </tr>
                        </thead>
                        <tbody>
                            {payments.map((payment, index) => {
                                const status = getStatusBadge(payment.status);
                                const canRefund = canRequestRefund(payment);
                                
                                // Kurs bilgisini al
                                const courseTitle = payment.course?.title || `Kurs #${payment.courseId}`;
                                
                                console.log(`📊 Ödeme ${index + 1} - canRefund: ${canRefund}`);
                                
                                return (
                                    <tr key={payment.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                        <td style={{ padding: '12px 16px' }}>{index + 1}</td>
                                        <td style={{ padding: '12px 16px', fontWeight: 500 }}>
                                            {courseTitle}
                                        </td>
                                        <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                                            {payment.amount} {payment.currency || 'TL'}
                                        </td>
                                        <td style={{ padding: '12px 16px', textAlign: 'center', fontSize: 13, color: '#6b7280' }}>
                                            {payment.paymentDate ? new Date(payment.paymentDate).toLocaleDateString('tr-TR') : '-'}
                                        </td>
                                        <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                                            <span style={{
                                                padding: '4px 12px',
                                                borderRadius: 20,
                                                fontSize: 12,
                                                fontWeight: 600,
                                                background: status.bg,
                                                color: status.color
                                            }}>
                                                {status.text}
                                            </span>
                                        </td>
                                        <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                                            {String(payment.status) === '5' && (
                                                <span style={{ fontSize: 13, color: '#f59e0b', display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'center' }}>
                                                    <FaClock /> Admin Onayı Bekliyor
                                                </span>
                                            )}
                                            {canRefund && (
                                                <button
                                                    onClick={() => requestRefund(payment.id)}
                                                    style={{
                                                        padding: '6px 14px',
                                                        background: '#f59e0b',
                                                        color: 'white',
                                                        border: 'none',
                                                        borderRadius: 6,
                                                        cursor: 'pointer',
                                                        fontSize: 13,
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: 6,
                                                        transition: 'all 0.2s'
                                                    }}
                                                    onMouseEnter={(e) => {
                                                        e.currentTarget.style.background = '#d97706';
                                                        e.currentTarget.style.transform = 'scale(1.05)';
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        e.currentTarget.style.background = '#f59e0b';
                                                        e.currentTarget.style.transform = 'scale(1)';
                                                    }}
                                                >
                                                    <FaUndo size={12} /> İade Talep Et
                                                </button>
                                            )}
                                            {String(payment.status) === '4' && (
                                                <span style={{ fontSize: 13, color: '#6b7280' }}>✅ İade Edildi</span>
                                            )}
                                            {String(payment.status) === '1' && (
                                                <span style={{ fontSize: 13, color: '#94a3b8' }}>⏳ Beklemede</span>
                                            )}
                                            {String(payment.status) === '3' && (
                                                <span style={{ fontSize: 13, color: '#ef4444' }}>❌ Başarısız</span>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default MyPayments;