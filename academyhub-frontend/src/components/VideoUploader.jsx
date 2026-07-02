import React, { useState, useRef } from 'react';
import { FaUpload, FaSpinner, FaTrash, FaCheckCircle, FaExclamationTriangle, FaFile } from 'react-icons/fa';
import Swal from 'sweetalert2';
import api from '../api/api';

const VideoUploader = ({ 
    value, 
    onChange, 
    onUpload, 
    onDurationChange,
    accept = 'video/*',
    type = 'video',
    placeholder = 'https://www.youtube.com/embed/... veya /uploads/videos/...',
    maxSizeMB = 500,
    allowedExtensions = ['.mp4', '.webm', '.ogg', '.mov', '.avi']
}) => {
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [fileUrl, setFileUrl] = useState(value || '');
    const [error, setError] = useState('');
    const [duration, setDuration] = useState('');
    const [fileName, setFileName] = useState('');
    const fileInputRef = useRef(null);
    const videoRef = useRef(null);

    const formatDuration = (seconds) => {
        if (!seconds || isNaN(seconds)) return '';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const handleUrlChange = (e) => {
        const url = e.target.value;
        setFileUrl(url);
        onChange(url);
        if (onUpload) onUpload(url);
        setError('');
    };

    const handleVideoLoadedMetadata = () => {
        if (videoRef.current && type === 'video') {
            const durationSeconds = videoRef.current.duration;
            const durationFormatted = formatDuration(durationSeconds);
            setDuration(durationFormatted);
            if (onDurationChange) {
                onDurationChange(durationFormatted);
            }
        }
    };

    const validateFile = (file) => {
        if (type === 'video' && !file.type.startsWith('video/')) {
            setError('Lütfen geçerli bir video dosyası seçin!');
            return false;
        }

        if (file.size > maxSizeMB * 1024 * 1024) {
            setError(`Dosya boyutu ${maxSizeMB}MB'dan küçük olmalı!`);
            return false;
        }

        const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
        if (!allowedExtensions.includes(fileExtension)) {
            setError(`Sadece ${allowedExtensions.join(', ')} dosyaları yüklenebilir!`);
            return false;
        }

        setError('');
        return true;
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (!validateFile(file)) {
            Swal.fire({
                icon: 'warning',
                title: 'Uyarı',
                text: error,
                confirmButtonColor: '#f59e0b'
            });
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
            return;
        }

        const originalFileName = file.name; 
        setFileName(originalFileName);

        if (type === 'video') {
            const tempVideo = document.createElement('video');
            tempVideo.preload = 'metadata';
            tempVideo.onloadedmetadata = function() {
                const durationSeconds = this.duration;
                const durationFormatted = formatDuration(durationSeconds);
                setDuration(durationFormatted);
                if (onDurationChange) {
                    onDurationChange(durationFormatted);
                }
            };
            tempVideo.src = URL.createObjectURL(file);
        }

        setUploading(true);
        setProgress(0);
        setError('');

        const formData = new FormData();
        formData.append('File', file);

        const endpoint = type === 'video' ? '/video/upload' : '/resource/upload';

        try {
            const res = await api.post(endpoint, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
                timeout: 600000,
                onUploadProgress: (progressEvent) => {
                    if (progressEvent.total) {
                        const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                        setProgress(percent);
                    }
                }
            });

            const url = res.data.data.fileUrl || res.data.data.videoUrl;
            setFileUrl(url);
            onChange(url, originalFileName); 
            if (onUpload) onUpload(url, file);

            Swal.fire({
                icon: 'success',
                title: 'Başarılı!',
                text: `${type === 'video' ? 'Video' : 'Dosya'} başarıyla yüklendi.`,
                timer: 2000,
                showConfirmButton: false,
                toast: true,
                position: 'top-end'
            });

        } catch (err) {
            console.error('Yükleme hatası:', err);
            
            let errorMessage = `${type === 'video' ? 'Video' : 'Dosya'} yüklenirken bir hata oluştu!`;
            
            if (err.code === 'ECONNABORTED') {
                errorMessage = 'Bağlantı zaman aşımına uğradı.';
            } else if (err.response?.data?.message) {
                errorMessage = err.response.data.message;
            } else if (err.message === 'Network Error') {
                errorMessage = 'Sunucuya bağlanılamadı.';
            }

            setError(errorMessage);

            Swal.fire({
                icon: 'error',
                title: 'Hata!',
                text: errorMessage,
                confirmButtonColor: '#ef4444'
            });

        } finally {
            setUploading(false);
            setProgress(0);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const handleRemove = () => {
        setFileUrl('');
        setDuration('');
        setFileName('');
        onChange('');
        if (onUpload) onUpload('');
        if (onDurationChange) onDurationChange('');
        setError('');
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        const file = e.dataTransfer.files[0];
        if (file && fileInputRef.current) {
            const dataTransfer = new DataTransfer();
            dataTransfer.items.add(file);
            fileInputRef.current.files = dataTransfer.files;
            fileInputRef.current.dispatchEvent(new Event('change'));
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
    };

    const isVideo = type === 'video';

    return (
        <div style={{ marginBottom: 8 }}>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
                <div style={{ flex: 1, minWidth: 200 }}>
                    <label style={{ display: 'block', fontWeight: 600, marginBottom: 6, fontSize: 14 }}>
                        {isVideo ? '🎬 Video URL' : '📄 Dosya URL'}
                    </label>
                    <input
                        type="text"
                        value={fileUrl}
                        onChange={handleUrlChange}
                        placeholder={placeholder}
                        style={{
                            width: '100%',
                            padding: '12px 16px',
                            border: '2px solid #e5e7eb',
                            borderRadius: 8,
                            fontSize: 15,
                            outline: 'none'
                        }}
                        onFocus={(e) => e.target.style.borderColor = '#667eea'}
                        onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                    />
                </div>

                <div>
                    <label style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        padding: '12px 24px',
                        background: uploading ? '#9ca3af' : 'linear-gradient(135deg, #667eea, #764ba2)',
                        color: 'white',
                        borderRadius: 8,
                        cursor: uploading ? 'not-allowed' : 'pointer',
                        fontWeight: 600,
                        fontSize: 14,
                        opacity: uploading ? 0.7 : 1
                    }}>
                        {uploading ? <FaSpinner style={{ animation: 'spin 1s linear infinite' }} /> : <FaUpload />}
                        {uploading ? `${progress}%` : isVideo ? '🎬 Video Yükle' : '📁 Dosya Seç'}
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept={accept}
                            onChange={handleFileUpload}
                            style={{ display: 'none' }}
                            disabled={uploading}
                        />
                    </label>
                </div>

                {fileUrl && (
                    <div>
                        <button
                            onClick={handleRemove}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 6,
                                padding: '12px 20px',
                                background: '#ef4444',
                                color: 'white',
                                border: 'none',
                                borderRadius: 8,
                                cursor: 'pointer',
                                fontWeight: 600,
                                fontSize: 14
                            }}
                        >
                            <FaTrash /> Temizle
                        </button>
                    </div>
                )}
            </div>

            {error && (
                <div style={{
                    marginTop: 8,
                    padding: '8px 12px',
                    background: '#fef2f2',
                    border: '1px solid #fecaca',
                    borderRadius: 6,
                    color: '#dc2626',
                    fontSize: 13,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6
                }}>
                    <FaExclamationTriangle /> {error}
                </div>
            )}

            {uploading && progress > 0 && (
                <div style={{ marginTop: 10 }}>
                    <div style={{
                        width: '100%',
                        height: 6,
                        background: '#e5e7eb',
                        borderRadius: 3,
                        overflow: 'hidden'
                    }}>
                        <div style={{
                            width: `${progress}%`,
                            height: '100%',
                            background: 'linear-gradient(90deg, #667eea, #764ba2)',
                            transition: 'width 0.3s'
                        }} />
                    </div>
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        marginTop: 4,
                        fontSize: 12,
                        color: '#6b7280'
                    }}>
                        <span>{progress}% yüklendi</span>
                        <span>{uploading ? 'Yükleniyor...' : 'Tamamlandı!'}</span>
                    </div>
                </div>
            )}

            {isVideo && fileUrl && !uploading && (
                <div style={{ marginTop: 10, position: 'relative' }}>
                    <video
                        ref={videoRef}
                        src={fileUrl}
                        controls
                        onLoadedMetadata={handleVideoLoadedMetadata}
                        style={{
                            maxWidth: '100%',
                            maxHeight: 200,
                            borderRadius: 8,
                            background: '#000',
                            display: 'block'
                        }}
                    />
                    <div style={{
                        position: 'absolute',
                        bottom: 8,
                        right: 8,
                        background: 'rgba(16, 185, 129, 0.9)',
                        color: 'white',
                        padding: '4px 12px',
                        borderRadius: 12,
                        fontSize: 12,
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4
                    }}>
                        <FaCheckCircle size={12} /> Yüklendi
                    </div>
                </div>
            )}

            {!isVideo && fileUrl && !uploading && (
                <div style={{
                    marginTop: 10,
                    padding: '12px 16px',
                    background: '#f3f4f6',
                    borderRadius: 8,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12
                }}>
                    <FaFile size={24} color="#667eea" />
                    <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, color: '#0f0c29' }}>
                            {fileName || 'Dosya yüklendi'}
                        </div>
                        <a 
                            href={fileUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            style={{ color: '#667eea', fontSize: 13, textDecoration: 'none' }}
                        >
                            Dosyayı Görüntüle →
                        </a>
                    </div>
                </div>
            )}

            {!fileUrl && !uploading && (
                <div
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    style={{
                        marginTop: 10,
                        padding: '20px',
                        border: '2px dashed #d1d5db',
                        borderRadius: 8,
                        textAlign: 'center',
                        color: '#6b7280',
                        fontSize: 14,
                        cursor: 'pointer'
                    }}
                    onClick={() => fileInputRef.current?.click()}
                >
                    <FaUpload style={{ fontSize: 24, marginBottom: 8, color: '#9ca3af' }} />
                    <div>{isVideo ? 'Video' : 'Dosya'} buraya sürükleyin veya tıklayın</div>
                    <div style={{ fontSize: 12, marginTop: 4, color: '#9ca3af' }}>
                        Desteklenen formatlar: {allowedExtensions.join(', ')} (Max {maxSizeMB}MB)
                    </div>
                </div>
            )}

            <style>{`
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
};

export default VideoUploader;