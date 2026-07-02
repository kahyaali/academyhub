import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { FaArrowLeft, FaSave, FaSpinner, FaVideo, FaFile, FaEye } from 'react-icons/fa';
import Swal from 'sweetalert2';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../api/api';
import VideoUploader from '../../components/VideoUploader';

const LessonEdit = () => {
    const { courseId, lessonId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [course, setCourse] = useState(null);
    
    const [videoUrl, setVideoUrl] = useState('');
    const [videoDuration, setVideoDuration] = useState('');
    const [resourceUrl, setResourceUrl] = useState('');
    const [resourceFileName, setResourceFileName] = useState('');

    const [form, setForm] = useState({
        title: '',
        description: '',
        order: 0,
        isPreview: false
    });

    const isInstructor = user?.role === 'Instructor' || user?.role === 2;
    const isAdmin = user?.role === 'Admin' || user?.role === 3;

    useEffect(() => {
        fetchData();
    }, [courseId, lessonId]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const courseRes = await api.get(`/course/${courseId}`);
            setCourse(courseRes.data.data);

            const lessonRes = await api.get(`/lesson/${lessonId}`);
            const lesson = lessonRes.data.data;

            setForm({
                title: lesson.title || '',
                description: lesson.description || '',
                order: lesson.order || 0,
                isPreview: lesson.isPreview || false
            });

            setVideoUrl(lesson.videoUrl || '');
            setVideoDuration(lesson.videoDuration || '');
            setResourceUrl(lesson.resourceUrl || '');
            setResourceFileName(lesson.resourceFileName || '');

        } catch (err) {
            console.error('Veriler yüklenirken hata:', err);
            Swal.fire({
                icon: 'error',
                title: 'Hata!',
                text: 'Veriler yüklenemedi!'
            });
            navigate(`/courses/${courseId}`);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setForm({
            ...form,
            [name]: type === 'checkbox' ? checked : value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!form.title.trim()) {
            Swal.fire({
                icon: 'warning',
                title: 'Uyarı',
                text: 'Ders başlığı gereklidir!',
                confirmButtonColor: '#667eea'
            });
            return;
        }

        setSaving(true);
        try {
            const payload = {
                title: form.title.trim(),
                description: form.description?.trim() || '',
                videoUrl: videoUrl?.trim() || '',
                videoDuration: videoDuration?.trim() || '',
                order: parseInt(form.order) || 0,
                isPreview: form.isPreview,
                resourceUrl: resourceUrl?.trim() || '',
                resourceFileName: resourceFileName?.trim() || ''
            };

            await api.put(`/lesson/${lessonId}`, payload);

            Swal.fire({
                icon: 'success',
                title: 'Başarılı!',
                text: 'Ders başarıyla güncellendi.',
                timer: 2000,
                showConfirmButton: false
            });

            navigate(`/courses/${courseId}`);
        } catch (err) {
            console.error('Ders güncellenirken hata:', err);
            Swal.fire({
                icon: 'error',
                title: 'Hata!',
                text: err.response?.data?.message || 'Ders güncellenirken bir hata oluştu!',
                confirmButtonColor: '#ef4444'
            });
            setSaving(false);
        }
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
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px 20px' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 28 }}>
                <Link to={`/courses/${courseId}`} style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    width: 40, 
                    height: 40, 
                    borderRadius: 10, 
                    background: 'white', 
                    border: '1px solid #e2e8f0',
                    color: '#64748b',
                    transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#667eea'; e.currentTarget.style.color = '#667eea'; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.color = '#64748b'; }}>
                    <FaArrowLeft size={18} />
                </Link>
                <div>
                    <h1 style={{ fontSize: 26, fontWeight: 700, color: '#0f0c29', margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
                        Dersi Düzenle
                        <span style={{ fontSize: 14, fontWeight: 400, color: '#94a3b8' }}>
                            / {course?.title}
                        </span>
                    </h1>
                    <p style={{ color: '#94a3b8', margin: 2, fontSize: 14 }}>Ders bilgilerini güncelleyin</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} style={{ 
                background: 'white', 
                padding: 32, 
                borderRadius: 16, 
                boxShadow: '0 4px 24px rgba(0,0,0,0.04)',
                border: '1px solid rgba(0,0,0,0.04)'
            }}>
                {/* 2 Sütun - Başlık ve Sıralama */}
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20 }}>
                    <div>
                        <label style={{ display: 'block', fontWeight: 600, marginBottom: 6, fontSize: 14, color: '#0f0c29' }}>
                            Ders Başlığı <span style={{ color: '#ef4444' }}>*</span>
                        </label>
                        <input
                            type="text"
                            name="title"
                            value={form.title}
                            onChange={handleChange}
                            placeholder="Ders başlığını girin"
                            style={{ 
                                width: '100%', 
                                padding: '12px 16px', 
                                border: '2px solid #e2e8f0', 
                                borderRadius: 10, 
                                fontSize: 15,
                                transition: 'border-color 0.2s',
                                outline: 'none'
                            }}
                            onFocus={(e) => e.target.style.borderColor = '#667eea'}
                            onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                            required
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', fontWeight: 600, marginBottom: 6, fontSize: 14, color: '#0f0c29' }}>
                            Sıralama
                        </label>
                        <input
                            type="number"
                            name="order"
                            value={form.order}
                            onChange={handleChange}
                            min="1"
                            style={{ 
                                width: '100%', 
                                padding: '12px 16px', 
                                border: '2px solid #e2e8f0', 
                                borderRadius: 10, 
                                fontSize: 15,
                                transition: 'border-color 0.2s',
                                outline: 'none'
                            }}
                            onFocus={(e) => e.target.style.borderColor = '#667eea'}
                            onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                        />
                    </div>
                </div>

                {/* Açıklama */}
                <div style={{ marginTop: 16 }}>
                    <label style={{ display: 'block', fontWeight: 600, marginBottom: 6, fontSize: 14, color: '#0f0c29' }}>
                        Açıklama
                    </label>
                    <textarea
                        name="description"
                        value={form.description}
                        onChange={handleChange}
                        placeholder="Ders açıklaması"
                        rows={3}
                        style={{ 
                            width: '100%', 
                            padding: '12px 16px', 
                            border: '2px solid #e2e8f0', 
                            borderRadius: 10, 
                            fontSize: 15, 
                            resize: 'vertical',
                            transition: 'border-color 0.2s',
                            outline: 'none',
                            fontFamily: 'inherit'
                        }}
                        onFocus={(e) => e.target.style.borderColor = '#667eea'}
                        onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                    />
                </div>

                {/* Video Bölümü */}
                <div style={{ 
                    marginTop: 20, 
                    border: '1px solid #e2e8f0', 
                    borderRadius: 12, 
                    padding: 20, 
                    background: '#fafbfc' 
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                        <FaVideo style={{ color: '#667eea' }} />
                        <h3 style={{ fontSize: 15, fontWeight: 600, color: '#0f0c29', margin: 0 }}>Video</h3>
                        <span style={{ fontSize: 12, color: '#94a3b8', marginLeft: 'auto' }}>URL veya dosya yükleyin</span>
                    </div>
                    <VideoUploader
                        type="video"
                        value={videoUrl}
                        onChange={setVideoUrl}
                        onDurationChange={setVideoDuration}
                        accept="video/*"
                        maxSizeMB={1024}
                        allowedExtensions={['.mp4', '.webm', '.ogg', '.mov', '.avi']}
                        placeholder="/uploads/videos/video.mp4 veya YouTube URL"
                    />
                </div>

                {/* Video Süresi */}
                <div style={{ marginTop: 16 }}>
                    <label style={{ display: 'block', fontWeight: 600, marginBottom: 6, fontSize: 14, color: '#0f0c29' }}>
                        Video Süresi
                    </label>
                    <input
                        type="text"
                        value={videoDuration}
                        onChange={(e) => setVideoDuration(e.target.value)}
                        placeholder="Video süresi otomatik gelecek (örn: 15:30)"
                        style={{ 
                            width: '100%', 
                            padding: '12px 16px', 
                            border: '2px solid #e2e8f0', 
                            borderRadius: 10, 
                            fontSize: 15,
                            background: videoDuration ? '#f0fdf4' : 'white',
                            transition: 'border-color 0.2s',
                            outline: 'none'
                        }}
                        onFocus={(e) => e.target.style.borderColor = '#667eea'}
                        onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                    />
                    {videoDuration && (
                        <div style={{ marginTop: 4, fontSize: 12, color: '#10b981' }}>
                            ✅ Süre: <strong>{videoDuration}</strong>
                        </div>
                    )}
                </div>

                {/* 2 Sütun - Önizleme */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginTop: 16 }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingTop: 4 }}>
                            <input
                                type="checkbox"
                                name="isPreview"
                                checked={form.isPreview}
                                onChange={handleChange}
                                style={{ 
                                    width: 18, 
                                    height: 18, 
                                    cursor: 'pointer',
                                    accentColor: '#667eea'
                                }}
                            />
                            <label style={{ fontSize: 14, cursor: 'pointer', color: '#0f0c29' }}>
                                <FaEye style={{ color: '#f59e0b', marginRight: 4 }} /> Önizleme Dersi
                            </label>
                        </div>
                    </div>
                </div>

                {/* Resource Bölümü */}
                <div style={{ 
                    marginTop: 20, 
                    border: '1px solid #e2e8f0', 
                    borderRadius: 12, 
                    padding: 20, 
                    background: '#fafbfc' 
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                        <FaFile style={{ color: '#667eea' }} />
                        <h3 style={{ fontSize: 15, fontWeight: 600, color: '#0f0c29', margin: 0 }}>Kaynak Dosyası</h3>
                        <span style={{ fontSize: 12, color: '#94a3b8', marginLeft: 'auto' }}>PDF, DOC, PPT, XLS</span>
                    </div>
                    <VideoUploader
                        type="resource"
                        value={resourceUrl}
                        onChange={(url, originalFileName) => {
                            setResourceUrl(url);
                            if (originalFileName) {
                                setResourceFileName(originalFileName);
                            } else if (url) {
                                let fileName = url.split('/').pop();
                                const match = fileName.match(/^\d+_\d+_(.+)$/);
                                if (match) {
                                    fileName = match[1];
                                }
                                setResourceFileName(fileName);
                            }
                        }}
                        accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx"
                        maxSizeMB={50}
                        allowedExtensions={['.pdf', '.doc', '.docx', '.ppt', '.pptx', '.xls', '.xlsx']}
                        placeholder="/uploads/resources/dosya.pdf veya https://example.com/dosya.pdf"
                    />
                </div>

                {/* Kaynak Dosyası Adı */}
                <div style={{ marginTop: 16 }}>
                    <label style={{ display: 'block', fontWeight: 600, marginBottom: 6, fontSize: 14, color: '#0f0c29' }}>
                        Kaynak Dosyası Adı
                    </label>
                    <input
                        type="text"
                        value={resourceFileName}
                        onChange={(e) => setResourceFileName(e.target.value)}
                        placeholder="Dosya adı otomatik gelecek"
                        style={{ 
                            width: '100%', 
                            padding: '12px 16px', 
                            border: '2px solid #e2e8f0', 
                            borderRadius: 10, 
                            fontSize: 15,
                            background: resourceFileName ? '#f0fdf4' : 'white',
                            transition: 'border-color 0.2s',
                            outline: 'none'
                        }}
                        onFocus={(e) => e.target.style.borderColor = '#667eea'}
                        onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                    />
                    {resourceFileName && (
                        <div style={{ marginTop: 4, fontSize: 12, color: '#10b981' }}>
                            ✅ Dosya adı: <strong>{resourceFileName}</strong>
                        </div>
                    )}
                </div>

                {/* Butonlar */}
                <div style={{ display: 'flex', gap: 12, marginTop: 28, paddingTop: 20, borderTop: '1px solid #e2e8f0' }}>
                    <button
                        type="submit"
                        disabled={saving}
                        style={{
                            flex: 1,
                            padding: '14px 32px',
                            background: 'linear-gradient(135deg, #667eea, #764ba2)',
                            color: 'white',
                            border: 'none',
                            borderRadius: 12,
                            fontSize: 16,
                            fontWeight: 600,
                            cursor: saving ? 'not-allowed' : 'pointer',
                            opacity: saving ? 0.7 : 1,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 8,
                            transition: 'all 0.3s',
                            boxShadow: '0 4px 14px rgba(102,126,234,0.3)'
                        }}
                        onMouseEnter={(e) => { 
                            if (!saving) {
                                e.currentTarget.style.transform = 'translateY(-2px)'; 
                                e.currentTarget.style.boxShadow = '0 8px 24px rgba(102,126,234,0.4)'; 
                            }
                        }}
                        onMouseLeave={(e) => { 
                            e.currentTarget.style.transform = 'translateY(0)'; 
                            e.currentTarget.style.boxShadow = '0 4px 14px rgba(102,126,234,0.3)'; 
                        }}
                    >
                        {saving ? <FaSpinner style={{ animation: 'spin 1s linear infinite' }} /> : <FaSave />}
                        {saving ? 'Kaydediliyor...' : 'Güncelle'}
                    </button>
                    <Link
                        to={`/courses/${courseId}`}
                        style={{
                            padding: '14px 32px',
                            background: 'white',
                            border: '2px solid #e2e8f0',
                            borderRadius: 12,
                            textDecoration: 'none',
                            color: '#64748b',
                            fontWeight: 500,
                            fontSize: 16,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#667eea'; e.currentTarget.style.color = '#667eea'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.color = '#64748b'; }}
                    >
                        İptal
                    </Link>
                </div>
            </form>

            <style>{`
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
};

export default LessonEdit;