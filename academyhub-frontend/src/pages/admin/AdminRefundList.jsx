import React, { useState, useEffect } from 'react';
import { FaSpinner, FaCheck, FaTimes, FaClock, FaUser, FaBook, FaMoneyBillWave } from 'react-icons/fa';
import Swal from 'sweetalert2';
import api from '../../api/api';

const AdminRefundList = () => {
    const [refunds, setRefunds] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all'); // all, pending, approved, rejected

    useEffect(() => {
        fetchRefundRequests();
    }, []);

    const fetchRefundRequests = async () => {
        try {
            setLoading(true);
            const res = await api.get('/payment/refund-requests');
            console.log('📦 İade talepleri:', res.data);
            setRefunds(res.data.data || []);
        } catch (err) {
            console.error('İade talepleri yüklenirken hata:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (paymentId) => {
        const result = await Swal.fire({
            title: '✅ İadeyi Onayla',
            text: 'Bu ödemeyi iade etmek istediğinize emin misiniz?',
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#10b981',
            cancelButtonColor: '#6b7280',
            confirmButtonText: '✅ Evet, Onayla',
            cancelButtonText: '❌ İptal'
        });

        if (result.isConfirmed) {
            try {
                await api.post(`/payment/${paymentId}/approve-refund`);
                
                Swal.fire({
                    icon: 'success',
                    title: '✅ İade Onaylandı!',
                    text: 'Ödeme başarıyla iade edildi.',
                    timer: 2000,
                    showConfirmButton: false
                });
                
                fetchRefundRequests();
            } catch (err) {
                Swal.fire({
                    icon: 'error',
                    title: 'Hata!',
                    text: err.response?.data?.message || 'İade onaylanırken hata oluştu!',
                    confirmButtonColor: '#ef4444'
                });
            }
        }
    };

    const handleReject = async (paymentId) => {
        const { value: reason } = await Swal.fire({
            title: '❌ İadeyi Reddet',
            html: `
                <p style="color: #6b7280; font-size: 14px; text-align: left;">
                    İade talebini reddetme sebebinizi girin:
                </p>
                <textarea 
                    id="rejectReason" 
                    style="width: 100%; padding: 10px; border-radius: 8px; border: 2px solid #e5e7eb; font-size: 14px; margin-top: 8px;"
                    placeholder="Reddetme sebebi..."
                    rows="3"
                ></textarea>
            `,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#6b7280',
            confirmButtonText: '❌ Reddet',
            cancelButtonText: 'İptal',
            preConfirm: () => {
                const reason = document.getElementById('rejectReason').value;
                if (!reason || reason.length < 5) {
                    Swal.showValidationMessage('Lütfen en az 5 karakterlik bir sebep girin!');
                    return false;
                }
                return reason;
            }
        });

        if (reason) {
            try {
                await api.post(`/payment/${paymentId}/reject-refund`, {
                    reason: reason
                });
                
                Swal.fire({
                    icon: 'success',
                    title: '❌ İade Reddedildi!',
                    text: 'İade talebi reddedildi.',
                    timer: 2000,
                    showConfirmButton: false
                });
                
                fetchRefundRequests();
            } catch (err) {
                Swal.fire({
                    icon: 'error',
                    title: 'Hata!',
                    text: err.response?.data?.message || 'İade reddedilirken hata oluştu!',
                    confirmButtonColor: '#ef4444'
                });
            }
        }
    };

    const getStatusBadge = (status) => {
        const statusMap = {
            'RefundRequested': { text: '⏳ Bekliyor', color: '#f59e0b', bg: '#fef3c7' },
            'Refunded': { text: '✅ İade Edildi', color: '#10b981', bg: '#d1fae5' },
            'Completed': { text: '❌ Reddedildi', color: '#ef4444', bg: '#fee2e2' }
        };
        return statusMap[status] || { text: status, color: '#6b7280', bg: '#f3f4f6' };
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
                <FaSpinner size={40} style={{ animation: 'spin 1s linear infinite', color: '#667eea' }} />
            </div>
        );
    }

    return (
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 20px' }}>
            <div style={{ marginBottom: 24 }}>
                <h1 style={{ fontSize: 28, fontWeight: 700, color: '#0f0c29', margin: 0 }}>
                    💰 İade Talepleri
                </h1>
                <p style={{ color: '#6b7280', margin: '4px 0 0 0', fontSize: 15 }}>
                    {refunds.length} bekleyen iade talebi
                </p>
            </div>

            {refunds.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 60, background: 'white', borderRadius: 16 }}>
                    <div style={{ fontSize: 48, marginBottom: 16 }}>🔕</div>
                    <h3 style={{ color: '#0f0c29', marginBottom: 8 }}>Bekleyen İade Talebi Yok</h3>
                    <p style={{ color: '#6b7280' }}>Henüz öğrencilerden iade talebi gelmemiş.</p>
                </div>
            ) : (
                <div style={{ background: 'white', borderRadius: 16, overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead style={{ background: '#f8fafc' }}>
                                <tr>
                                    <th style={{ padding: '12px 16px', textAlign: 'left' }}>#</th>
                                    <th style={{ padding: '12px 16px', textAlign: 'left' }}>Öğrenci</th>
                                    <th style={{ padding: '12px 16px', textAlign: 'left' }}>Kurs</th>
                                    <th style={{ padding: '12px 16px', textAlign: 'center' }}>Tutar</th>
                                    <th style={{ padding: '12px 16px', textAlign: 'center' }}>Tarih</th>
                                    <th style={{ padding: '12px 16px', textAlign: 'center' }}>Sebep</th>
                                    <th style={{ padding: '12px 16px', textAlign: 'center' }}>İşlem</th>
                                </tr>
                            </thead>
                            <tbody>
                                {refunds.map((payment, index) => {
                                    const status = getStatusBadge(payment.status);
                                    
                                    return (
                                        <tr key={payment.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                            <td style={{ padding: '12px 16px' }}>{index + 1}</td>
                                            <td style={{ padding: '12px 16px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                    <div style={{
                                                        width: 32,
                                                        height: 32,
                                                        borderRadius: '50%',
                                                        background: 'linear-gradient(135deg, #667eea, #764ba2)',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        color: 'white',
                                                        fontWeight: 600,
                                                        fontSize: 13
                                                    }}>
                                                        {payment.user?.firstName?.charAt(0) || 'Ö'}
                                                    </div>
                                                    <div>
                                                        <div style={{ fontWeight: 500, fontSize: 14 }}>
                                                            {payment.user?.firstName} {payment.user?.lastName}
                                                        </div>
                                                        <div style={{ fontSize: 12, color: '#6b7280' }}>
                                                            {payment.user?.email}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td style={{ padding: '12px 16px' }}>
                                                <span style={{
                                                    display: 'inline-block',
                                                    padding: '3px 12px',
                                                    background: '#eef2ff',
                                                    color: '#667eea',
                                                    borderRadius: 12,
                                                    fontSize: 12,
                                                    fontWeight: 500
                                                }}>
                                                    {payment.course?.title || 'Kurs Yok'}
                                                </span>
                                            </td>
                                            <td style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 600 }}>
                                                {payment.amount} {payment.currency || 'TL'}
                                            </td>
                                            <td style={{ padding: '12px 16px', textAlign: 'center', fontSize: 13, color: '#6b7280' }}>
                                                {payment.refundDate ? new Date(payment.refundDate).toLocaleDateString('tr-TR') : '-'}
                                            </td>
                                            <td style={{ padding: '12px 16px', maxWidth: 150 }}>
                                                <div style={{
                                                    fontSize: 13,
                                                    color: '#475569',
                                                    whiteSpace: 'nowrap',
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis'
                                                }} title={payment.refundReason}>
                                                    {payment.refundReason || 'Sebep belirtilmemiş'}
                                                </div>
                                            </td>
                                            <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                                                <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                                                    <button
                                                        onClick={() => handleApprove(payment.id)}
                                                        style={{
                                                            padding: '6px 12px',
                                                            background: '#10b981',
                                                            color: 'white',
                                                            border: 'none',
                                                            borderRadius: 6,
                                                            cursor: 'pointer',
                                                            fontSize: 12,
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: 4,
                                                            transition: 'all 0.2s'
                                                        }}
                                                        onMouseEnter={(e) => {
                                                            e.currentTarget.style.background = '#059669';
                                                            e.currentTarget.style.transform = 'scale(1.05)';
                                                        }}
                                                        onMouseLeave={(e) => {
                                                            e.currentTarget.style.background = '#10b981';
                                                            e.currentTarget.style.transform = 'scale(1)';
                                                        }}
                                                        title="İadeyi Onayla"
                                                    >
                                                        <FaCheck size={12} /> Onayla
                                                    </button>
                                                    <button
                                                        onClick={() => handleReject(payment.id)}
                                                        style={{
                                                            padding: '6px 12px',
                                                            background: '#ef4444',
                                                            color: 'white',
                                                            border: 'none',
                                                            borderRadius: 6,
                                                            cursor: 'pointer',
                                                            fontSize: 12,
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: 4,
                                                            transition: 'all 0.2s'
                                                        }}
                                                        onMouseEnter={(e) => {
                                                            e.currentTarget.style.background = '#dc2626';
                                                            e.currentTarget.style.transform = 'scale(1.05)';
                                                        }}
                                                        onMouseLeave={(e) => {
                                                            e.currentTarget.style.background = '#ef4444';
                                                            e.currentTarget.style.transform = 'scale(1)';
                                                        }}
                                                        title="İadeyi Reddet"
                                                    >
                                                        <FaTimes size={12} /> Reddet
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminRefundList;