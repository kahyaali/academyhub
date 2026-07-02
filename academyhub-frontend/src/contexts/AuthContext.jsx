import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../api/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(() => {
        const saved = localStorage.getItem('user');
        return saved ? JSON.parse(saved) : null;
    });
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadUser = async () => {
            const token = localStorage.getItem('token');
            
            if (token) {
                try {
                    const res = await api.get('/auth/me');
                    const userData = res.data.data;
                    
                    if (userData.role === 3) userData.role = 'Admin';
                    else if (userData.role === 2) userData.role = 'Instructor';
                    else if (userData.role === 1) userData.role = 'Student';
                    
                    const userWithImage = {
                        ...userData,
                        profileImage: userData?.profileImage || null
                    };
                    
                    setUser(userWithImage);
                    localStorage.setItem('user', JSON.stringify(userWithImage));
                } catch {
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    setUser(null);
                }
            }
            setIsLoading(false);
        };
        loadUser();
    }, []);


    const login = async (email, password) => {
        const res = await api.post('/auth/login', { email, password });
        const { token, ...userData } = res.data.data;
        
        if (userData.role === 3) userData.role = 'Admin';
        else if (userData.role === 2) userData.role = 'Instructor';
        else if (userData.role === 1) userData.role = 'Student';
        
    
        let profileImage = userData?.profileImage || null;
        
        if (!profileImage) {
            try {
                const meRes = await api.get('/auth/me', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                profileImage = meRes.data.data?.profileImage || null;
                console.log('📸 Login - Profile Image from /auth/me:', profileImage);
            } catch (err) {
                console.log('Profile image alınamadı:', err);
            }
        }
        
        const userWithImage = {
            ...userData,
            profileImage: profileImage
        };
        
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(userWithImage));
        setUser(userWithImage);
        
        console.log('✅ Login - User with image:', userWithImage);
    };

    const register = async (data) => {
        const res = await api.post('/auth/register', data);
        const { token, ...userData } = res.data.data;
        
        if (userData.role === 3) userData.role = 'Admin';
        else if (userData.role === 2) userData.role = 'Instructor';
        else if (userData.role === 1) userData.role = 'Student';
        
      
        let profileImage = userData?.profileImage || null;
        
        if (!profileImage) {
            try {
                const meRes = await api.get('/auth/me', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                profileImage = meRes.data.data?.profileImage || null;
            } catch (err) {
                console.log('Profile image alınamadı:', err);
            }
        }
        
        const userWithImage = {
            ...userData,
            profileImage: profileImage
        };
        
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(userWithImage));
        setUser(userWithImage);
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
    };

    const updateUser = (updatedData) => {
        const updatedUser = { ...user, ...updatedData };
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                setUser,
                updateUser,
                login,
                register,
                logout,
                isAuthenticated: !!user,
                isLoading,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};