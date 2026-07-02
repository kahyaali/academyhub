import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
    FaHome, FaBook, FaChalkboardTeacher, FaUserGraduate, 
    FaCog, FaSignOutAlt, FaBars, FaTrophy, FaFolder,
    FaUser, FaUsers, FaBookOpen, FaMoneyBillWave,
    FaVideo, FaPlusCircle, FaClipboardList, FaCertificate,
    FaUserPlus, FaCreditCard, FaEnvelope, FaComments 
} from 'react-icons/fa';
import api from '../api/api';
import NotificationBell from './NotificationBell';
import './Layout.css';

//  .env'den API_URL al
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:7230';

const Layout = ({ children }) => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [collapsed, setCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [profileImage, setProfileImage] = useState(null);

    const isAuthenticated = !!user;
    const isAdmin = user?.role === 'Admin' || user?.role === 3;
    const isInstructor = user?.role === 'Instructor' || user?.role === 2;
    const isStudent = user?.role === 'Student' || user?.role === 1;

    //  Profil resmini al
    useEffect(() => {
        const fetchProfileImage = async () => {
            if (!isAuthenticated) return;
            
            if (user?.profileImage) {
                setProfileImage(user.profileImage);
                return;
            }
            
            try {
                const token = localStorage.getItem('token');
                const res = await api.get('/auth/me', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                
                console.log('📸 Profil resmi API cevabı:', res.data);
                
                const image = res.data?.data?.profileImage || null;
                setProfileImage(image);
                
                if (image) {
                    const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
                    storedUser.profileImage = image;
                    localStorage.setItem('user', JSON.stringify(storedUser));
                }
            } catch (err) {
                console.log('Profil resmi alınamadı:', err);
            }
        };
        
        fetchProfileImage();
    }, [isAuthenticated, user]);

    // localStorage değişikliklerini dinle
    useEffect(() => {
        const handleStorageChange = () => {
            try {
                const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
                if (storedUser?.profileImage) {
                    setProfileImage(storedUser.profileImage);
                }
            } catch (e) {}
        };
        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, []);


    const getFullImageUrl = (imagePath) => {
        if (!imagePath) return null;
        if (imagePath.startsWith('http')) return imagePath;
        if (imagePath.startsWith('/')) return `${API_URL}${imagePath}`;
        return `${API_URL}/${imagePath}`;
    };

    const getMenuItems = () => {
        if (!isAuthenticated) {
            return [
                { path: '/courses', icon: <FaBook />, label: 'Kurslar' },
            ];
        }

        if (isAdmin) {
            return [
                { path: '/dashboard', icon: <FaHome />, label: 'Dashboard' },
                { path: '/courses', icon: <FaBook />, label: 'Tüm Kurslar' },
                { path: '/instructors', icon: <FaChalkboardTeacher />, label: 'Eğitmenler' },
                { path: '/students', icon: <FaUserGraduate />, label: 'Öğrenciler' },
                { path: '/admin/categories', icon: <FaFolder />, label: 'Kategoriler' },
                { path: '/admin/users/create', icon: <FaUserPlus />, label: 'Kullanıcı Ekle' },
                { path: '/admin/refunds', icon: <FaMoneyBillWave />, label: 'İade Talepleri' },
                { path: '/admin/mail-configuration', icon: <FaEnvelope />, label: 'Mail Ayarları' },
                { path: '/admin/reviews', icon: <FaComments />, label: 'Yorum Onayları' },
                { path: '/admin/profile', icon: <FaCog />, label: 'Profil' },
            ];
        }

        if (isInstructor) {
            return [
                { path: '/dashboard', icon: <FaHome />, label: 'Dashboard' },
                { path: '/instructor/courses', icon: <FaBookOpen />, label: 'Kurslarım' },
                { path: '/instructor/exams', icon: <FaClipboardList />, label: 'Sınavlarım' },
                { path: '/instructor/students', icon: <FaUsers />, label: 'Öğrencilerim' },
                { path: '/instructor/certificates', icon: <FaCertificate />, label: 'Sertifikalar' },
                { path: '/admin/categories', icon: <FaFolder />, label: 'Kategoriler' },
                { path: '/instructor/profile', icon: <FaUser />, label: 'Profilim' },
            ];
        }

        if (isStudent) {
            return [
                { path: '/dashboard', icon: <FaHome />, label: 'Dashboard' },
                { path: '/courses', icon: <FaBook />, label: 'Keşfet' },
                { path: '/my-courses', icon: <FaBookOpen />, label: 'Kurslarım' },
                { path: '/payments', icon: <FaCreditCard />, label: 'Ödemelerim' },
                { path: '/certificates', icon: <FaCertificate />, label: 'Sertifikalarım' },
                { path: '/profile', icon: <FaCog />, label: 'Profil' },
            ];
        }

        return [];
    };

    const menu = getMenuItems();

    const isActive = (path) => {
        return location.pathname === path || location.pathname.startsWith(path + '/');
    };

    const handleLogout = async () => {
        await logout();
        navigate('/courses');
    };

    const Avatar = ({ size = 32, showName = false }) => {
        const imageUrl = getFullImageUrl(profileImage);
        const firstLetter = user?.firstName?.charAt(0) || 'U';
        
        return (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                    width: size,
                    height: size,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #667eea, #764ba2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontWeight: 600,
                    fontSize: size * 0.4,
                    flexShrink: 0,
                    overflow: 'hidden'
                }}>
                    {imageUrl ? (
                        <img 
                            src={imageUrl} 
                            alt="Avatar"
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.parentElement.textContent = firstLetter;
                            }}
                        />
                    ) : (
                        firstLetter
                    )}
                </div>
                {showName && (
                    <div>
                        <div style={{ fontWeight: 600, color: '#0f0c29', fontSize: 14 }}>
                            {user?.firstName} {user?.lastName}
                        </div>
                        <div style={{ fontSize: 12, color: '#94a3b8' }}>
                            {isAdmin ? 'Admin' : isInstructor ? 'Eğitmen' : 'Öğrenci'}
                        </div>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="layout">
            {/* Sidebar */}
            <div className={`sidebar ${collapsed ? 'collapsed' : ''} ${mobileOpen ? 'open' : ''}`}>
                <div className="sidebar-brand">
                    <span>{collapsed ? '🏫' : 'AcademyHub'}</span>
                    <button className="sidebar-toggle" onClick={() => setCollapsed(!collapsed)}>
                        <FaBars />
                    </button>
                </div>

                {isAuthenticated && (
                    <div className="sidebar-user">
                        {collapsed ? (
                            <Avatar size={40} />
                        ) : (
                            <Avatar size={44} showName={true} />
                        )}
                    </div>
                )}

                <nav className="sidebar-nav">
                    {menu.map((item) => (
                        <Link 
                            key={item.path} 
                            to={item.path} 
                            className={`nav-item ${isActive(item.path) ? 'active' : ''}`}
                            onClick={() => setMobileOpen(false)}
                        >
                            {item.icon}
                            {!collapsed && <span className="nav-label">{item.label}</span>}
                        </Link>
                    ))}
                </nav>

                <div className="sidebar-footer">
                    {isAuthenticated ? (
                        <button className="nav-item" onClick={handleLogout}>
                            <FaSignOutAlt />
                            {!collapsed && <span className="nav-label">Çıkış Yap</span>}
                        </button>
                    ) : (
                        <Link to="/login" className="nav-item">
                            <FaSignOutAlt />
                            {!collapsed && <span className="nav-label">Giriş Yap</span>}
                        </Link>
                    )}
                </div>
            </div>

            <div className={`overlay ${mobileOpen ? 'show' : ''}`} onClick={() => setMobileOpen(false)}></div>

            <div className="main">
                <header className="topbar">
                    <div className="topbar-left">
                        <button className="mobile-toggle" onClick={() => setMobileOpen(true)}>
                            <FaBars />
                        </button>
                        <span className="topbar-title">AcademyHub</span>
                    </div>
                    <div className="topbar-right" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        {isAuthenticated && <NotificationBell />}
                        
                        {isAuthenticated ? (
                            <div className="topbar-user-info" style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                padding: '6px 14px',
                                borderRadius: '8px',
                                background: '#f1f5f9',
                                cursor: 'default'
                            }}>
                                <Avatar size={32} />
                                <div style={{ lineHeight: 1.3 }}>
                                    <div style={{ fontSize: 13, fontWeight: 600, color: '#0f0c29' }}>
                                        {user?.firstName} {user?.lastName}
                                    </div>
                                    <div style={{ fontSize: 11, color: '#94a3b8' }}>
                                        {isAdmin ? 'Admin' : isInstructor ? 'Eğitmen' : 'Öğrenci'}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="topbar-auth-buttons">
                                <Link to="/login" className="topbar-login-btn">Giriş Yap</Link>
                                <Link to="/register" className="topbar-register-btn">Kaydol</Link>
                            </div>
                        )}
                    </div>
                </header>
                <div className="content">{children}</div>
            </div>
        </div>
    );
};

export default Layout;