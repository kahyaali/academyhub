import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaEdit, FaTrash, FaSpinner, FaEnvelope, FaUser, FaBook } from 'react-icons/fa';
import Swal from 'sweetalert2';
import Layout from '../../components/Layout';
import api from '../../api/api';

const InstructorDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [instructor, setInstructor] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchInstructor();
    }, [id]);

    const fetchInstructor = async () => {
        try {
            const res = await api.get(`/user/${id}`);
            setInstructor(res.data.data);
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

    const handleDelete = async () => {
        const result = await Swal.fire({
            title: 'Emin misiniz?',
            text: `${instructor?.firstName} ${instructor?.lastName} adlı eğitmeni silmek istediğinize emin misiniz?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#6c757d',
            confirmButtonText: 'Evet, sil!',
            cancelButtonText: 'Vazgeç'
        });

        if (result.isConfirmed) {
            try {
                await api.delete(`/user/${id}`);
                Swal.fire({
                    icon: 'success',
                    title: 'Silindi!',
                    text: 'Eğitmen başarıyla silindi.',
                    timer: 2000,
                    showConfirmButton: false
                });
                navigate('/instructors');
            } catch (err) {
                Swal.fire({
                    icon: 'error',
                    title: 'Hata!',
                    text: err.response?.data?.message || 'Eğitmen silinirken hata oluştu!',
                    confirmButtonColor: '#ef4444'
                });
            }
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

    if (!instructor) return null;

    return (
        <Layout>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <Link to="/instructors" style={{ fontSize: 20, color: '#6c757d' }}>
                        <FaArrowLeft />
                    </Link>
                    <div>
                        <h1 style={{ fontSize: 28, margin: 0 }}>👨‍🏫 Eğitmen Detayı</h1>
                        <p style={{ color: '#6c757d', margin: 4 }}>Eğitmen bilgilerini görüntüleyin</p>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                    <Link to={`/instructors/edit/${id}`} style={{
                        background: '#f59e0b',
                        color: 'white',
                        border: 'none',
                        padding: '8px 16px',
                        borderRadius: 8,
                        textDecoration: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8
                    }}>
                        <FaEdit /> Düzenle
                    </Link>
                    <button onClick={handleDelete} style={{
                        background: '#ef4444',
                        color: 'white',
                        border: 'none',
                        padding: '8px 16px',
                        borderRadius: 8,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8
                    }}>
                        <FaTrash /> Sil
                    </button>
                </div>
            </div>

            <div style={{ background: 'white', borderRadius: 12, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
                <div style={{ display: 'flex', gap: 32, alignItems: 'flex-start' }}>
                    <div style={{
                        width: 120,
                        height: 120,
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #667eea, #764ba2)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 48,
                        color: 'white',
                        flexShrink: 0
                    }}>
                        {instructor.firstName?.charAt(0)}{instructor.lastName?.charAt(0)}
                    </div>

                    <div style={{ flex: 1 }}>
                        <h2 style={{ margin: 0, fontSize: 24 }}>{instructor.firstName} {instructor.lastName}</h2>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#6c757d' }}>
                                <FaEnvelope /> {instructor.email}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#6c757d' }}>
                                <FaUser /> Rol: {instructor.role}
                            </div>
                            {instructor.expertise && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#6c757d' }}>
                                    <FaBook /> Uzmanlık: {instructor.expertise}
                                </div>
                            )}
                            <div style={{ marginTop: 8 }}>
                                <span style={{
                                    background: instructor.isActive ? '#d1fae5' : '#fee2e2',
                                    color: instructor.isActive ? '#065f46' : '#991b1b',
                                    padding: '4px 12px',
                                    borderRadius: 12,
                                    fontSize: 12,
                                    fontWeight: 600
                                }}>
                                    {instructor.isActive ? 'Aktif' : 'Pasif'}
                                </span>
                            </div>
                        </div>

                        {instructor.bio && (
                            <div style={{ marginTop: 16 }}>
                                <h4 style={{ margin: 0, marginBottom: 4 }}>Biyografi</h4>
                                <p style={{ color: '#6c757d', margin: 0 }}>{instructor.bio}</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default InstructorDetail;