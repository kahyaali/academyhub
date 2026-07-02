import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaPlus, FaEdit, FaTrash, FaSpinner, FaEye } from 'react-icons/fa';
import Swal from 'sweetalert2';
import Layout from '../../components/Layout';
import api from '../../api/api';

const InstructorList = () => {
    const [instructors, setInstructors] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchInstructors();
    }, []);

    const fetchInstructors = async () => {
        try {
            const res = await api.get('/user/instructors');
            setInstructors(res.data.data || []);
        } catch (err) {
            console.error('Eğitmenler yüklenirken hata:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id, name) => {
        const result = await Swal.fire({
            title: 'Emin misiniz?',
            text: `${name} adlı eğitmeni silmek istediğinize emin misiniz?`,
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
                fetchInstructors();
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

    return (
        <Layout>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <div>
                    <h1 style={{ fontSize: 28, margin: 0 }}>👨‍🏫 Eğitmenler</h1>
                    <p style={{ color: '#6c757d', margin: 4 }}>Sistemdeki eğitmenleri yönetin</p>
                </div>
                <Link to="/instructors/create" style={{
                    background: 'linear-gradient(135deg, #667eea, #764ba2)',
                    color: 'white',
                    border: 'none',
                    padding: '10px 20px',
                    borderRadius: 8,
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8
                }}>
                    <FaPlus /> Yeni Eğitmen
                </Link>
            </div>

            <div style={{ background: 'white', borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead style={{ background: '#f8f9fa' }}>
                        <tr>
                            <th style={{ padding: 12, textAlign: 'left' }}>#</th>
                            <th style={{ padding: 12, textAlign: 'left' }}>Ad Soyad</th>
                            <th style={{ padding: 12, textAlign: 'left' }}>E-posta</th>
                            <th style={{ padding: 12, textAlign: 'left' }}>Uzmanlık</th>
                            <th style={{ padding: 12, textAlign: 'center' }}>İşlem</th>
                        </tr>
                    </thead>
                    <tbody>
                        {instructors.length === 0 ? (
                            <tr>
                                <td colSpan="5" style={{ textAlign: 'center', padding: 40, color: '#6c757d' }}>
                                    Henüz eğitmen yok.
                                </td>
                            </tr>
                        ) : (
                            instructors.map((inst, index) => (
                                <tr key={inst.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                                    <td style={{ padding: 12 }}>{index + 1}</td>
                                    <td style={{ padding: 12, fontWeight: 500 }}>{inst.firstName} {inst.lastName}</td>
                                    <td style={{ padding: 12 }}>{inst.email}</td>
                                    <td style={{ padding: 12 }}>{inst.expertise || '-'}</td>
                                    <td style={{ padding: 12, textAlign: 'center' }}>
                                        <Link to={`/instructors/${inst.id}`} style={{ color: '#667eea', marginRight: 8 }}>
                                            <FaEye />
                                        </Link>
                                        <Link to={`/instructors/edit/${inst.id}`} style={{ color: '#f59e0b', marginRight: 8 }}>
                                            <FaEdit />
                                        </Link>
                                        <button onClick={() => handleDelete(inst.id, `${inst.firstName} ${inst.lastName}`)} style={{
                                            background: 'none',
                                            border: 'none',
                                            color: '#ef4444',
                                            cursor: 'pointer'
                                        }}>
                                            <FaTrash />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </Layout>
    );
};

export default InstructorList;