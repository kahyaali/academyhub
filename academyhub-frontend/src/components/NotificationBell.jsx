import React, { useState, useEffect, useRef } from 'react';
import { FaBell, FaSpinner, FaTimes, FaCheckCircle, FaExclamationCircle, FaInfoCircle, FaExclamationTriangle } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import api from '../api/api';

const NotificationBell = () => {
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    //  Dışarı tıklayınca kapat
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    //  Bildirimleri getir (ve unreadCount'u güncelle)
    const fetchNotifications = async () => {
        try {
            setLoading(true);
            console.log('🔍 BİLDİRİMLER ÇAĞRILIYOR...');
            const res = await api.get('/notification');
            console.log('📦 BİLDİRİMLER CEVABI:', res.data);
            
            const data = res.data.data || [];
            setNotifications(data);
            
           
            const unread = data.filter(n => !n.isRead).length;
            setUnreadCount(unread);
            console.log(`✅ setNotifications yapıldı, ${data.length} bildirim, ${unread} okunmamış`);
            
        } catch (err) {
            console.error('❌ Bildirimler yüklenirken hata:', err);
            setNotifications([]);
        } finally {
            setLoading(false);
        }
    };

    //  Okunmamış sayısını getir
    const fetchUnreadCount = async () => {
        try {
            console.log('🔍 OKUNMAMIŞ SAYISI ÇAĞRILIYOR...');
            const res = await api.get('/notification/count');
            console.log('📦 OKUNMAMIŞ CEVABI:', res.data);
            setUnreadCount(res.data.data?.unreadCount || 0);
        } catch (err) {
            console.error('❌ Bildirim sayısı alınırken hata:', err);
            setUnreadCount(0);
        }
    };

    //  Her açılışta yenile
    useEffect(() => {
        if (isOpen) {
            fetchNotifications();
        }
    }, [isOpen]);

    //  İlk yüklemede ve periyodik kontrol
    useEffect(() => {
        console.log('🔔 NotificationBell mounted');
        fetchUnreadCount();
        const interval = setInterval(fetchUnreadCount, 30000);
        return () => clearInterval(interval);
    }, []);

    //  Bildirimi okundu işaretle
    const markAsRead = async (id) => {
        try {
            await api.put(`/notification/${id}/read`);
            setNotifications(prev => 
                prev.map(n => n.id === id ? { ...n, isRead: true } : n)
            );
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (err) {
            console.error('Bildirim okundu işaretlenirken hata:', err);
        }
    };

    //  Tümünü okundu işaretle
    const markAllAsRead = async () => {
        try {
            await api.put('/notification/read-all');
            setNotifications(prev => 
                prev.map(n => ({ ...n, isRead: true }))
            );
            setUnreadCount(0);
        } catch (err) {
            console.error('Tüm bildirimler okundu işaretlenirken hata:', err);
        }
    };

    //  Bildirim sil
    const deleteNotification = async (id) => {
        try {
            await api.delete(`/notification/${id}`);
            setNotifications(prev => prev.filter(n => n.id !== id));
        } catch (err) {
            console.error('Bildirim silinirken hata:', err);
        }
    };

    //  Tip rengi ve ikonu
    const getTypeColor = (type) => {
        if (!type) return '#667eea';
        switch(type.toLowerCase()) {
            case 'success': return '#10b981';
            case 'warning': return '#f59e0b';
            case 'error': return '#ef4444';
            default: return '#667eea';
        }
    };

    const getTypeIcon = (type) => {
        if (!type) return <FaInfoCircle />;
        switch(type.toLowerCase()) {
            case 'success': return <FaCheckCircle />;
            case 'warning': return <FaExclamationTriangle />;
            case 'error': return <FaExclamationCircle />;
            default: return <FaInfoCircle />;
        }
    };

    return (
        <div ref={dropdownRef} style={{ position: 'relative' }}>
            {/* Bell Butonu */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    position: 'relative',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: 22,
                    color: '#4b5563',
                    padding: '6px 8px',
                    borderRadius: 8,
                    transition: 'background 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#e5e7eb'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
                <FaBell />
                {unreadCount > 0 && (
                    <span style={{
                        position: 'absolute',
                        top: 0,
                        right: 0,
                        background: '#ef4444',
                        color: 'white',
                        borderRadius: '50%',
                        width: 18,
                        height: 18,
                        fontSize: 10,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700
                    }}>
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown */}
            {isOpen && (
                <div style={{
                    position: 'absolute',
                    top: 40,
                    right: 0,
                    width: 380,
                    maxHeight: 480,
                    background: 'white',
                    borderRadius: 12,
                    boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
                    overflow: 'hidden',
                    zIndex: 1000,
                    border: '1px solid #f1f5f9',
                    animation: 'slideDown 0.2s ease'
                }}>
                    <style>{`
                        @keyframes slideDown {
                            from { opacity: 0; transform: translateY(-10px); }
                            to { opacity: 1; transform: translateY(0); }
                        }
                    `}</style>

                    {/* Header */}
                    <div style={{
                        padding: '14px 20px',
                        borderBottom: '1px solid #f1f5f9',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        background: '#fafbfc'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontSize: 18 }}>🔔</span>
                            <span style={{ fontSize: 15, fontWeight: 600, color: '#0f0c29' }}>
                                Bildirimler
                            </span>
                            {unreadCount > 0 && (
                                <span style={{
                                    background: '#667eea',
                                    color: 'white',
                                    borderRadius: 12,
                                    padding: '1px 10px',
                                    fontSize: 11,
                                    fontWeight: 600
                                }}>
                                    {unreadCount} yeni
                                </span>
                            )}
                        </div>
                        {unreadCount > 0 && (
                            <button
                                onClick={markAllAsRead}
                                style={{
                                    background: 'transparent',
                                    border: 'none',
                                    color: '#667eea',
                                    cursor: 'pointer',
                                    fontSize: 12,
                                    fontWeight: 500,
                                    padding: '4px 8px',
                                    borderRadius: 4,
                                    transition: 'background 0.2s'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.background = '#eef2ff'}
                                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                            >
                                Tümünü Okundu İşaretle
                            </button>
                        )}
                    </div>

                    {/* Liste */}
                    {loading ? (
                        <div style={{ textAlign: 'center', padding: 40 }}>
                            <FaSpinner style={{ animation: 'spin 1s linear infinite', color: '#667eea', fontSize: 28 }} />
                        </div>
                    ) : notifications.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: 50, color: '#94a3b8' }}>
                            <div style={{ fontSize: 40, marginBottom: 8 }}>🔕</div>
                            <p style={{ margin: 0, fontSize: 14 }}>Henüz bildiriminiz yok</p>
                        </div>
                    ) : (
                        <div style={{ maxHeight: 380, overflowY: 'auto' }}>
                            {notifications.map((notification) => (
                                <div 
                                    key={notification.id}
                                    style={{
                                        padding: '12px 16px',
                                        borderBottom: '1px solid #f1f5f9',
                                        background: notification.isRead ? 'white' : '#f8fafc',
                                        cursor: 'pointer',
                                        transition: 'background 0.15s'
                                    }}
                                    onClick={() => {
                                        if (!notification.isRead) {
                                            markAsRead(notification.id);
                                        }
                                        if (notification.link) {
                                            navigate(notification.link);
                                            setIsOpen(false);
                                        }
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.background = '#f1f5f9'}
                                    onMouseLeave={(e) => e.currentTarget.style.background = notification.isRead ? 'white' : '#f8fafc'}
                                >
                                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                                        <div style={{
                                            width: 34,
                                            height: 34,
                                            borderRadius: '50%',
                                            background: getTypeColor(notification.type) + '20',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: getTypeColor(notification.type),
                                            fontSize: 14,
                                            flexShrink: 0
                                        }}>
                                            {getTypeIcon(notification.type)}
                                        </div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                <div style={{ 
                                                    fontSize: 13, 
                                                    fontWeight: 600, 
                                                    color: '#0f0c29',
                                                    flex: 1
                                                }}>
                                                    {notification.title}
                                                </div>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        deleteNotification(notification.id);
                                                    }}
                                                    style={{
                                                        background: 'transparent',
                                                        border: 'none',
                                                        color: '#94a3b8',
                                                        cursor: 'pointer',
                                                        padding: '2px 4px',
                                                        borderRadius: 4,
                                                        fontSize: 12,
                                                        flexShrink: 0
                                                    }}
                                                    onMouseEnter={(e) => e.currentTarget.style.background = '#f1f5f9'}
                                                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                                >
                                                    <FaTimes />
                                                </button>
                                            </div>
                                            <div style={{ 
                                                fontSize: 13, 
                                                color: '#6b7280', 
                                                marginTop: 2,
                                                display: '-webkit-box',
                                                WebkitLineClamp: 2,
                                                WebkitBoxOrient: 'vertical',
                                                overflow: 'hidden'
                                            }}>
                                                {notification.message}
                                            </div>
                                            <div style={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                marginTop: 4
                                            }}>
                                                <span style={{
                                                    fontSize: 10,
                                                    color: '#94a3b8'
                                                }}>
                                                    {new Date(notification.createdDate).toLocaleString('tr-TR')}
                                                </span>
                                                {!notification.isRead && (
                                                    <span style={{
                                                        display: 'inline-block',
                                                        width: 6,
                                                        height: 6,
                                                        borderRadius: '50%',
                                                        background: '#667eea'
                                                    }} />
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default NotificationBell;