import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { FaBook, FaUsers, FaChalkboardTeacher, FaUserGraduate, FaSpinner, FaCertificate, FaMoneyBillWave } from 'react-icons/fa';
import api from '../../api/api';
import './Dashboard.css';

const Dashboard = () => {
    const { user } = useAuth();
    const [stats, setStats] = useState({
        totalUsers: 0,
        totalStudents: 0,
        totalInstructors: 0,
        totalCourses: 0,
        publishedCourses: 0,
        totalEnrollments: 0,
        totalRevenue: 0,
        totalCategories: 0,
        totalLessons: 0,
        averageRating: 0,
        completedCourses: 0,
        inProgressCourses: 0,
        averageProgress: 0,
        totalSpent: 0,
        totalCertificates: 0,
        totalReviews: 0,
        revenueByCurrency: []  
    });
    const [loading, setLoading] = useState(true);

    const isAdmin = user?.role === 'Admin' || user?.role === 3;
    const isInstructor = user?.role === 'Instructor' || user?.role === 2;
    const isStudent = user?.role === 'Student' || user?.role === 1;

    //  Para birimi sembolü ve renkleri
    const getCurrencyConfig = (currency) => {
        const configs = {
            'TL': { symbol: '₺', color: '#10b981', bg: '#d1fae5', label: 'Türk Lirası' },
            'USD': { symbol: '$', color: '#3b82f6', bg: '#dbeafe', label: 'Amerikan Doları' },
            'EUR': { symbol: '€', color: '#8b5cf6', bg: '#ede9fe', label: 'Euro' },
            'GBP': { symbol: '£', color: '#f59e0b', bg: '#fef3c7', label: 'Sterlin' }
        };
        return configs[currency] || { symbol: '₺', color: '#6b7280', bg: '#f3f4f6', label: currency };
    };

    //  Para birimi formatı
    const formatCurrency = (amount, currency) => {
        if (!amount && amount !== 0) return `0 ${getCurrencyConfig(currency).symbol}`;
        const config = getCurrencyConfig(currency);
        return `${amount.toFixed(2)} ${config.symbol}`;
    };

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            setLoading(true);
            
            let endpoint = '/stats';
            
            if (isInstructor) {
                endpoint = '/stats/instructor';
            } else if (isStudent) {
                endpoint = '/stats/student';
            }
            
            const res = await api.get(endpoint);
            console.log('📊 Stats response:', res.data);
            setStats(res.data.data);
        } catch (err) {
            console.error('İstatistikler yüklenirken hata:', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="dashboard-loading" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 16 }}>
                <FaSpinner className="spin" style={{ animation: 'spin 1s linear infinite', color: '#667eea', fontSize: 48 }} />
                <p style={{ color: '#6b7280' }}>Yükleniyor...</p>
                <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    return (
        <div className="dashboard-page" style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 20px' }}>
            <div className="dashboard-header" style={{ marginBottom: 32 }}>
                <div>
                    <h1 style={{ fontSize: 28, fontWeight: 700, color: '#0f0c29', margin: 0 }}>
                        👋 Hoş Geldiniz, {user?.firstName || 'Kullanıcı'}!
                    </h1>
                    <p style={{ color: '#6b7280', margin: '4px 0 0 0', fontSize: 15 }}>
                        {isAdmin && 'Platform özetiniz'}
                        {isInstructor && 'Eğitmen paneliniz'}
                        {isStudent && 'Öğrenim durumunuz'}
                    </p>
                </div>
            </div>

            <div className="dashboard-stats" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 20 }}>
                {/* ============ ADMIN STATS ============ */}
                {isAdmin && (
                    <>
                        <div className="stat-card" style={{ background: 'white', padding: 20, borderRadius: 16, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid rgba(0,0,0,0.04)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <div style={{ padding: 12, borderRadius: 12, background: '#eef2ff', color: '#667eea' }}><FaBook size={24} /></div>
                                <div>
                                    <p style={{ fontSize: 24, fontWeight: 700, color: '#0f0c29', margin: 0 }}>{stats.totalCourses}</p>
                                    <p style={{ fontSize: 14, color: '#6b7280', margin: 0 }}>Toplam Kurs</p>
                                </div>
                            </div>
                        </div>
                        <div className="stat-card" style={{ background: 'white', padding: 20, borderRadius: 16, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid rgba(0,0,0,0.04)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <div style={{ padding: 12, borderRadius: 12, background: '#d1fae5', color: '#10b981' }}><FaUsers size={24} /></div>
                                <div>
                                    <p style={{ fontSize: 24, fontWeight: 700, color: '#0f0c29', margin: 0 }}>{stats.totalStudents}</p>
                                    <p style={{ fontSize: 14, color: '#6b7280', margin: 0 }}>Toplam Öğrenci</p>
                                </div>
                            </div>
                        </div>
                        <div className="stat-card" style={{ background: 'white', padding: 20, borderRadius: 16, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid rgba(0,0,0,0.04)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <div style={{ padding: 12, borderRadius: 12, background: '#fef3c7', color: '#f59e0b' }}><FaChalkboardTeacher size={24} /></div>
                                <div>
                                    <p style={{ fontSize: 24, fontWeight: 700, color: '#0f0c29', margin: 0 }}>{stats.totalInstructors}</p>
                                    <p style={{ fontSize: 14, color: '#6b7280', margin: 0 }}>Toplam Eğitmen</p>
                                </div>
                            </div>
                        </div>
                        <div className="stat-card" style={{ background: 'white', padding: 20, borderRadius: 16, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid rgba(0,0,0,0.04)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <div style={{ padding: 12, borderRadius: 12, background: '#fce4ec', color: '#ef4444' }}><FaUserGraduate size={24} /></div>
                                <div>
                                    <p style={{ fontSize: 24, fontWeight: 700, color: '#0f0c29', margin: 0 }}>{stats.totalEnrollments}</p>
                                    <p style={{ fontSize: 14, color: '#6b7280', margin: 0 }}>Toplam Kayıt</p>
                                </div>
                            </div>
                        </div>
                        <div className="stat-card" style={{ background: 'white', padding: 20, borderRadius: 16, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid rgba(0,0,0,0.04)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <div style={{ padding: 12, borderRadius: 12, background: '#f3e8ff', color: '#8b5cf6' }}><FaCertificate size={24} /></div>
                                <div>
                                    <p style={{ fontSize: 24, fontWeight: 700, color: '#0f0c29', margin: 0 }}>{stats.publishedCourses}</p>
                                    <p style={{ fontSize: 14, color: '#6b7280', margin: 0 }}>Yayındaki Kurs</p>
                                </div>
                            </div>
                        </div>

                        {/*  Admin için para birimi bazında gelir kartları */}
                        {stats.revenueByCurrency && stats.revenueByCurrency.length > 0 && (
                            stats.revenueByCurrency.map((item, index) => {
                                const config = getCurrencyConfig(item.currency);
                                return (
                                    <div key={index} className="stat-card" style={{ background: 'white', padding: 20, borderRadius: 16, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid rgba(0,0,0,0.04)' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                            <div style={{ padding: 12, borderRadius: 12, background: config.bg, color: config.color }}>
                                                <FaMoneyBillWave size={24} />
                                            </div>
                                            <div>
                                                <p style={{ fontSize: 24, fontWeight: 700, color: '#0f0c29', margin: 0 }}>
                                                    {formatCurrency(item.total, item.currency)}
                                                </p>
                                                <p style={{ fontSize: 14, color: '#6b7280', margin: 0 }}>
                                                    {config.label} Geliri
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </>
                )}

                {/* ============ INSTRUCTOR STATS ============ */}
                {isInstructor && (
                    <>
                        <div className="stat-card" style={{ background: 'white', padding: 20, borderRadius: 16, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid rgba(0,0,0,0.04)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <div style={{ padding: 12, borderRadius: 12, background: '#eef2ff', color: '#667eea' }}><FaBook size={24} /></div>
                                <div>
                                    <p style={{ fontSize: 24, fontWeight: 700, color: '#0f0c29', margin: 0 }}>{stats.totalCourses}</p>
                                    <p style={{ fontSize: 14, color: '#6b7280', margin: 0 }}>Toplam Kurs</p>
                                </div>
                            </div>
                        </div>
                        <div className="stat-card" style={{ background: 'white', padding: 20, borderRadius: 16, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid rgba(0,0,0,0.04)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <div style={{ padding: 12, borderRadius: 12, background: '#d1fae5', color: '#10b981' }}><FaUsers size={24} /></div>
                                <div>
                                    <p style={{ fontSize: 24, fontWeight: 700, color: '#0f0c29', margin: 0 }}>{stats.totalStudents}</p>
                                    <p style={{ fontSize: 14, color: '#6b7280', margin: 0 }}>Toplam Öğrenci</p>
                                </div>
                            </div>
                        </div>
                        <div className="stat-card" style={{ background: 'white', padding: 20, borderRadius: 16, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid rgba(0,0,0,0.04)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <div style={{ padding: 12, borderRadius: 12, background: '#fce4ec', color: '#ef4444' }}><FaUserGraduate size={24} /></div>
                                <div>
                                    <p style={{ fontSize: 24, fontWeight: 700, color: '#0f0c29', margin: 0 }}>{stats.totalEnrollments}</p>
                                    <p style={{ fontSize: 14, color: '#6b7280', margin: 0 }}>Toplam Kayıt</p>
                                </div>
                            </div>
                        </div>
                        <div className="stat-card" style={{ background: 'white', padding: 20, borderRadius: 16, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid rgba(0,0,0,0.04)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <div style={{ padding: 12, borderRadius: 12, background: '#f3e8ff', color: '#8b5cf6' }}><FaCertificate size={24} /></div>
                                <div>
                                    <p style={{ fontSize: 24, fontWeight: 700, color: '#0f0c29', margin: 0 }}>{stats.publishedCourses}</p>
                                    <p style={{ fontSize: 14, color: '#6b7280', margin: 0 }}>Yayındaki Kurs</p>
                                </div>
                            </div>
                        </div>

                        {/*  Instructor için para birimi bazında gelir kartları */}
                        {stats.revenueByCurrency && stats.revenueByCurrency.length > 0 && (
                            stats.revenueByCurrency.map((item, index) => {
                                const config = getCurrencyConfig(item.currency);
                                return (
                                    <div key={index} className="stat-card" style={{ background: 'white', padding: 20, borderRadius: 16, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid rgba(0,0,0,0.04)' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                            <div style={{ padding: 12, borderRadius: 12, background: config.bg, color: config.color }}>
                                                <FaMoneyBillWave size={24} />
                                            </div>
                                            <div>
                                                <p style={{ fontSize: 24, fontWeight: 700, color: '#0f0c29', margin: 0 }}>
                                                    {formatCurrency(item.total, item.currency)}
                                                </p>
                                                <p style={{ fontSize: 14, color: '#6b7280', margin: 0 }}>
                                                    {config.label} Kazancı
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </>
                )}

                {/* ============ STUDENT STATS ============ */}
                {isStudent && (
                    <>
                        <div className="stat-card" style={{ background: 'white', padding: 20, borderRadius: 16, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid rgba(0,0,0,0.04)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <div style={{ padding: 12, borderRadius: 12, background: '#eef2ff', color: '#667eea' }}><FaBook size={24} /></div>
                                <div>
                                    <p style={{ fontSize: 24, fontWeight: 700, color: '#0f0c29', margin: 0 }}>{stats.totalEnrollments}</p>
                                    <p style={{ fontSize: 14, color: '#6b7280', margin: 0 }}>Kayıtlı Kurs</p>
                                </div>
                            </div>
                        </div>
                        <div className="stat-card" style={{ background: 'white', padding: 20, borderRadius: 16, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid rgba(0,0,0,0.04)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <div style={{ padding: 12, borderRadius: 12, background: '#d1fae5', color: '#10b981' }}><FaUserGraduate size={24} /></div>
                                <div>
                                    <p style={{ fontSize: 24, fontWeight: 700, color: '#0f0c29', margin: 0 }}>{stats.completedCourses}</p>
                                    <p style={{ fontSize: 14, color: '#6b7280', margin: 0 }}>Tamamlanan</p>
                                </div>
                            </div>
                        </div>
                        <div className="stat-card" style={{ background: 'white', padding: 20, borderRadius: 16, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid rgba(0,0,0,0.04)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <div style={{ padding: 12, borderRadius: 12, background: '#fef3c7', color: '#f59e0b' }}><FaSpinner size={24} /></div>
                                <div>
                                    <p style={{ fontSize: 24, fontWeight: 700, color: '#0f0c29', margin: 0 }}>{stats.inProgressCourses}</p>
                                    <p style={{ fontSize: 14, color: '#6b7280', margin: 0 }}>Devam Eden</p>
                                </div>
                            </div>
                        </div>
                        <div className="stat-card" style={{ background: 'white', padding: 20, borderRadius: 16, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid rgba(0,0,0,0.04)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <div style={{ padding: 12, borderRadius: 12, background: '#e0f2fe', color: '#3b82f6' }}><FaChalkboardTeacher size={24} /></div>
                                <div>
                                    <p style={{ fontSize: 24, fontWeight: 700, color: '#0f0c29', margin: 0 }}>{stats.averageProgress}%</p>
                                    <p style={{ fontSize: 14, color: '#6b7280', margin: 0 }}>Ortalama İlerleme</p>
                                </div>
                            </div>
                        </div>
                        <div className="stat-card" style={{ background: 'white', padding: 20, borderRadius: 16, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid rgba(0,0,0,0.04)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <div style={{ padding: 12, borderRadius: 12, background: '#f3e8ff', color: '#8b5cf6' }}><FaCertificate size={24} /></div>
                                <div>
                                    <p style={{ fontSize: 24, fontWeight: 700, color: '#0f0c29', margin: 0 }}>{stats.totalCertificates}</p>
                                    <p style={{ fontSize: 14, color: '#6b7280', margin: 0 }}>Sertifika</p>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default Dashboard;