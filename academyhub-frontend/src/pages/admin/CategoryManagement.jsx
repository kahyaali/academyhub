import React, { useState, useEffect, useRef } from 'react';
import { FaPlus, FaEdit, FaTrash, FaSpinner, FaSmile, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import Swal from 'sweetalert2';
import Layout from '../../components/Layout';
import api from '../../api/api';
import './CategoryManagement.css';

const CategoryManagement = () => {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [form, setForm] = useState({ name: '', icon: '📁', description: '' });
    const [editingId, setEditingId] = useState(null);
    const [error, setError] = useState('');
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const emojiPickerRef = useRef(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [totalCount, setTotalCount] = useState(0);

    const emojiList = ['💻', '🌐', '📊', '📱', '🎮', '🤖', '🎨', '💼', '📚', '📁', '🏷️', '⚡', '🔥', '🌟', '🎯', '📖', '✏️', '🛠️', '🧠', '💡'];
    const pageSizeOptions = [5, 10, 20, 50, 100];

    useEffect(() => {
        fetchCategories();
    }, [currentPage, pageSize]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target)) {
                setShowEmojiPicker(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const fetchCategories = async () => {
        try {
            setLoading(true);
            const res = await api.get('/category');
            const data = res.data.data?.items || res.data.data || [];
            setCategories(data);
            setTotalCount(data.length);
            setError('');
        } catch {
            setError('Kategoriler yüklenirken hata oluştu');
        } finally {
            setLoading(false);
        }
    };

 const handleSubmit = async (e) => {
    e.preventDefault();
    
    // ============ VALIDASYON ============
    if (!form.name.trim()) {
        Swal.fire({ icon: 'warning', title: 'Uyarı', text: 'Kategori adı gerekli!', confirmButtonColor: '#667eea' });
        return;
    }

    // ============ GÖNDERİLECEK VERİ ============
    const payload = {
        name: form.name.trim(),
        icon: form.icon || '📁',
        description: form.description || ''
    };

    try {
        if (editingId) {
            await api.put(`/category/${editingId}`, payload);
            Swal.fire({ icon: 'success', title: 'Başarılı!', text: 'Kategori güncellendi.', timer: 1500, showConfirmButton: false });
        } else {
            await api.post('/category', payload);
            Swal.fire({ icon: 'success', title: 'Başarılı!', text: 'Kategori eklendi.', timer: 1500, showConfirmButton: false });
        }
        setForm({ name: '', icon: '📁', description: '' });
        setEditingId(null);
        setCurrentPage(1);
        fetchCategories();
    } catch (err) {
        const errorMsg = err.response?.data?.message || err.response?.data?.title || 'İşlem başarısız!';
        Swal.fire({ icon: 'error', title: 'Hata!', text: errorMsg, confirmButtonColor: '#ef4444' });
    }
};
    const handleEdit = (cat) => {
        setForm({ name: cat.name, icon: cat.icon || '📁', description: cat.description || '' });
        setEditingId(cat.id);
    };

    const handleDelete = async (id) => {
        const result = await Swal.fire({
            title: 'Emin misiniz?',
            text: 'Bu kategoriyi silmek istediğinize emin misiniz?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#6c757d',
            confirmButtonText: 'Evet, sil!',
            cancelButtonText: 'Vazgeç'
        });
        if (result.isConfirmed) {
            try {
                await api.delete(`/category/${id}`);
                Swal.fire({ icon: 'success', title: 'Silindi!', text: 'Kategori silindi.', timer: 2000, showConfirmButton: false });
                fetchCategories();
            } catch {
                Swal.fire({ icon: 'error', title: 'Hata!', text: 'Silinirken hata oluştu!', confirmButtonColor: '#ef4444' });
            }
        }
    };

    const totalPages = Math.ceil(totalCount / pageSize);
    const startIndex = (currentPage - 1) * pageSize;
    const currentData = categories.slice(startIndex, startIndex + pageSize);

    const goToPage = (page) => {
        if (page < 1 || page > totalPages) return;
        setCurrentPage(page);
    };

    if (loading) {
        return (
            <Layout>
                <div className="category-loading"><FaSpinner size={40} className="spinner" /></div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="category-page">
                <div className="category-header">
                    <div>
                        <h1 className="category-title">📂 Kategoriler</h1>
                        <p className="category-subtitle">Kategorileri yönetin</p>
                    </div>
                    <span className="category-count">Toplam: {totalCount}</span>
                </div>

                {error && <div className="category-error">{error}</div>}

                <form onSubmit={handleSubmit} className="category-form">
                    <div className="category-form-grid">
                        <div className="category-form-group">
                            <label>Kategori Adı *</label>
                            <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Örn: Programlama" required />
                        </div>

                        <div className="category-form-group" ref={emojiPickerRef}>
                            <label>İkon (Emoji)</label>
                            <div className="icon-input-wrapper">
                                <input type="text" value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })} placeholder="📁" />
                                <button type="button" className="icon-trigger-btn" onClick={() => setShowEmojiPicker(!showEmojiPicker)}>
                                    <FaSmile />
                                </button>
                            </div>
                            {showEmojiPicker && (
                                <div className="emoji-picker-dropdown">
                                    <div className="emoji-picker-grid">
                                        {emojiList.map((emoji) => (
                                            <button
                                                key={emoji}
                                                type="button"
                                                className={`emoji-item ${form.icon === emoji ? 'active' : ''}`}
                                                onClick={() => {
                                                    setForm({ ...form, icon: emoji });
                                                    setShowEmojiPicker(false);
                                                }}
                                            >
                                                {emoji}
                                            </button>
                                        ))}
                                    </div>
                                    <div className="emoji-picker-footer">
                                        <small>👆 Bir emoji seçin</small>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="category-form-group">
                            <label>Açıklama</label>
                            <input type="text" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Kategori açıklaması" />
                        </div>

                        <div className="category-form-actions">
                            <button type="submit" className="btn-submit"><FaPlus /> {editingId ? 'Güncelle' : 'Ekle'}</button>
                            {editingId && <button type="button" className="btn-cancel" onClick={() => { setForm({ name: '', icon: '📁', description: '' }); setEditingId(null); }}>İptal</button>}
                        </div>
                    </div>
                </form>

                <div className="category-table-wrapper">
                    <table className="category-table">
                        <thead><tr><th>İkon</th><th>Ad</th><th>Açıklama</th><th className="text-center">İşlem</th></tr></thead>
                        <tbody>
                            {currentData.length === 0 ? (
                                <tr><td colSpan="4" className="empty-state">Henüz kategori yok.</td></tr>
                            ) : (
                                currentData.map((cat) => (
                                    <tr key={cat.id}>
                                        <td className="category-icon">{cat.icon || '📁'}</td>
                                        <td className="category-name">{cat.name}</td>
                                        <td className="category-desc">{cat.description || '-'}</td>
                                        <td className="category-actions">
                                            <button onClick={() => handleEdit(cat)} className="btn-edit" title="Düzenle"><FaEdit /></button>
                                            <button onClick={() => handleDelete(cat.id)} className="btn-delete" title="Sil"><FaTrash /></button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {totalPages > 0 && (
                    <div className="pagination-wrapper">
                        <div className="pagination-left">
                            <span className="pagination-info">
                                Toplam <strong>{totalCount}</strong> kategori · Sayfa <strong>{currentPage}</strong> / {totalPages}
                            </span>
                            <div className="pagination-page-size">
                                <label>Göster:</label>
                                <select value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}>
                                    {pageSizeOptions.map((size) => (
                                        <option key={size} value={size}>{size}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="pagination-center">
                            <button className="pagination-arrow" onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1}>
                                <FaChevronLeft />
                            </button>

                            {totalPages <= 7 ? (
                                [...Array(totalPages).keys()].map((_, index) => {
                                    const page = index + 1;
                                    return (
                                        <button key={page} className={`pagination-btn ${currentPage === page ? 'active' : ''}`} onClick={() => goToPage(page)}>
                                            {page}
                                        </button>
                                    );
                                })
                            ) : (
                                <>
                                    <button className={`pagination-btn ${currentPage === 1 ? 'active' : ''}`} onClick={() => goToPage(1)}>1</button>
                                    {currentPage > 3 && <span className="pagination-dots">…</span>}
                                    {[...Array(3).keys()].map((_, index) => {
                                        const page = currentPage - 1 + index;
                                        if (page > 1 && page < totalPages) {
                                            return (
                                                <button key={page} className={`pagination-btn ${currentPage === page ? 'active' : ''}`} onClick={() => goToPage(page)}>
                                                    {page}
                                                </button>
                                            );
                                        }
                                        return null;
                                    })}
                                    {currentPage < totalPages - 2 && <span className="pagination-dots">…</span>}
                                    <button className={`pagination-btn ${currentPage === totalPages ? 'active' : ''}`} onClick={() => goToPage(totalPages)}>
                                        {totalPages}
                                    </button>
                                </>
                            )}

                            <button className="pagination-arrow" onClick={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages}>
                                <FaChevronRight />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    );
};

export default CategoryManagement;