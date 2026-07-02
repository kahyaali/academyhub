import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
    FaArrowLeft, FaPlay, FaPause, FaExpand, FaCompress, 
    FaSpinner, FaLock, FaClock, FaBookOpen,
    FaVolumeUp, FaVolumeMute, FaEye
} from 'react-icons/fa';
import Swal from 'sweetalert2';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../api/api';

const LessonPlayer = () => {
    const { courseId, lessonId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const videoRef = useRef(null);
    const containerRef = useRef(null);
    
    const [course, setCourse] = useState(null);
    const [lessons, setLessons] = useState([]);
    const [currentLesson, setCurrentLesson] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const [duration, setDuration] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [isEnrolled, setIsEnrolled] = useState(false);
    const [enrollmentId, setEnrollmentId] = useState(null);
    const [videoError, setVideoError] = useState(false);
    const [previewEnded, setPreviewEnded] = useState(false);
    const [lastSavedTime, setLastSavedTime] = useState(0);
    const [lessonCompleted, setLessonCompleted] = useState(false);
    const [hasExam, setHasExam] = useState(false);
    const [examId, setExamId] = useState(null);
    const [allLessonsCompleted, setAllLessonsCompleted] = useState(false);
    const [hasCertificate, setHasCertificate] = useState(false);

    const isInstructor = user?.role === 'Instructor' || user?.role === 2;
    const isAdmin = user?.role === 'Admin' || user?.role === 3;
    const isAuthenticated = !!user;

    const PREVIEW_DURATION = 60;

    const getFullVideoUrl = (url) => {
        if (!url) return null;
        if (url.startsWith('http')) return url;
        if (url.startsWith('/')) return `http://localhost:7230${url}`;
        return `http://localhost:7230/${url}`;
    };

    const saveProgress = async (watchTimeSeconds) => {
        if (!enrollmentId || !currentLesson) return;
        if (Math.floor(watchTimeSeconds) === Math.floor(lastSavedTime)) return;
        
        try {
            await api.post('/enrollment/progress', {
                enrollmentId: enrollmentId,
                lessonId: currentLesson.id,
                watchTimeSeconds: Math.floor(watchTimeSeconds)
            });
            setLastSavedTime(Math.floor(watchTimeSeconds));
            console.log('✅ İlerleme kaydedildi:', Math.floor(watchTimeSeconds));
        } catch (err) {
            console.error('❌ İlerleme kaydedilemedi:', err);
        }
    };

    const markLessonCompleted = async () => {
        if (lessonCompleted) return;
        
        try {
            await api.post('/enrollment/progress', {
                enrollmentId: enrollmentId,
                lessonId: currentLesson.id,
                watchTimeSeconds: Math.floor(duration || currentTime)
            });
            setLessonCompleted(true);
            console.log('✅ Ders tamamlandı olarak işaretlendi!');
            
            Swal.fire({
                icon: 'success',
                title: '🎉 Ders Tamamlandı!',
                text: `"${currentLesson.title}" dersini başarıyla tamamladın.`,
                timer: 2500,
                showConfirmButton: false,
                background: '#1e1b4b',
                color: 'white'
            });
        } catch (err) {
            console.error('❌ Ders tamamlama hatası:', err);
        }
    };

    const checkAllLessonsCompleted = async () => {
        if (!enrollmentId) return;
        try {
            const res = await api.get(`/enrollment/${enrollmentId}/progress`);
            const progressData = res.data.data;
            if (progressData.progressPercentage >= 100) {
                setAllLessonsCompleted(true);
                console.log('✅ Tüm dersler tamamlandı! Sınav butonu aktif.');
                
                Swal.fire({
                    icon: 'success',
                    title: '🎉 Tüm Dersler Tamamlandı!',
                    text: 'Artık sınava başlayabilirsin.',
                    confirmButtonColor: '#667eea',
                    confirmButtonText: '📝 Sınava Başla'
                }).then((result) => {
                    if (result.isConfirmed && hasExam) {
                        navigate(`/courses/${courseId}/exams`);
                    }
                });
            }
        } catch (err) {
            console.error('Tamamlama kontrolü hatası:', err);
        }
    };

    const checkCertificate = async () => {
        try {
            const res = await api.get(`/certificate/course/${courseId}`);
            if (res.data.success && res.data.data) {
                setHasCertificate(true);
                console.log('✅ Sertifika bulundu!');
            }
        } catch (err) {
            setHasCertificate(false);
        }
    };

    const checkExam = async () => {
        try {
            console.log('🔍 Sınav kontrolü yapılıyor - CourseId:', courseId);
            const examRes = await api.get(`/exam/course/${courseId}`);
            console.log('📦 Sınav API cevabı:', examRes.data);
            
            const exams = examRes.data.data || [];
            const publishedExam = exams.find(e => e.isPublished === true);
            
            if (publishedExam) {
                setHasExam(true);
                setExamId(publishedExam.id);
                console.log('✅ Sınav bulundu:', publishedExam.id);
            } else {
                console.log('❌ Yayında sınav bulunamadı!');
                setHasExam(false);
            }
        } catch (examErr) {
            console.error('❌ Sınav kontrolü hatası:', examErr);
            setHasExam(false);
        }
    };

    const handleVideoEnded = () => {
        console.log('✅ Video bitti!');
        setIsPlaying(false);
        setProgress(100);
        setCurrentTime(duration || 0);
        
        if (enrollmentId && currentLesson) {
            saveProgress(duration || currentTime);
            if (isEnrolled) {
                markLessonCompleted();
                setTimeout(() => {
                    checkAllLessonsCompleted();
                }, 500);
            }
        }
    };

    useEffect(() => {
        fetchData();
    }, [courseId, lessonId]);

    const fetchData = async () => {
        try {
            setLoading(true);
            setLessonCompleted(false);
            setLastSavedTime(0);
            
            const courseRes = await api.get(`/course/${courseId}`);
            setCourse(courseRes.data.data);
            
            const lessonsRes = await api.get(`/lesson/course/${courseId}`);
            const lessonData = lessonsRes.data.data || [];
            setLessons(lessonData);
            
            await checkExam();
            
            if (isAuthenticated) {
                try {
                    console.log('🔍 Kayıt kontrolü yapılıyor - CourseId:', courseId);
                    const enrollRes = await api.get(`/enrollment/check/${courseId}`);
                    console.log('📦 Kayıt kontrolü cevabı:', enrollRes.data);
                    
                    
                    const responseData = enrollRes.data.data || {};
                    const isEnrolledFromApi = responseData.isEnrolled || false;
                    const status = responseData.status;
                    const enrollmentIdFromApi = responseData.enrollmentId;
                    
                    // Status 2 (Active) veya 3 (Completed) ise kayıtlıdır
                    const isValidEnrollment = isEnrolledFromApi || status === 2 || status === 3;
                    
                    setIsEnrolled(isValidEnrollment);
                    console.log('✅ isEnrolled:', isValidEnrollment);
                    console.log('📌 Status:', status);
                    console.log('📌 Enrollment ID:', enrollmentIdFromApi);
                    
                    if (isValidEnrollment && enrollmentIdFromApi) {
                        setEnrollmentId(enrollmentIdFromApi);
                        console.log('✅ Enrollment ID KAYDEDİLDİ:', enrollmentIdFromApi);
                        
                        try {
                            const progressRes = await api.get(`/enrollment/${enrollmentIdFromApi}/progress`);
                            const progressData = progressRes.data.data;
                            if (progressData.progressPercentage >= 100) {
                                setAllLessonsCompleted(true);
                                console.log('✅ Tüm dersler zaten tamamlanmış!');
                            }
                        } catch (err) {
                            console.error('❌ Progress alınamadı:', err);
                        }
                    } else {
                        console.log('❌ Geçerli enrollment bulunamadı!');
                    }
                } catch (enrollErr) {
                    console.error('❌ Kayıt kontrolü hatası:', enrollErr);
                    setIsEnrolled(false);
                }
            }
            
            await checkCertificate();
            
            let current = null;
            if (lessonId) {
                current = lessonData.find(l => l.id === parseInt(lessonId));
            }
            if (!current && lessonData.length > 0) {
                current = lessonData[0];
            }
            setCurrentLesson(current);
            setPreviewEnded(false);
            
        } catch (err) {
            console.error('Veriler yüklenirken hata:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleLessonClick = (lesson) => {
        setCurrentLesson(lesson);
        setIsPlaying(false);
        setProgress(0);
        setVideoError(false);
        setPreviewEnded(false);
        setLessonCompleted(false);
        setLastSavedTime(0);
        navigate(`/courses/${courseId}/lesson/${lesson.id}`, { replace: true });
        setTimeout(() => {
            if (videoRef.current) {
                videoRef.current.load();
            }
        }, 100);
    };

    const togglePlay = () => {
        if (videoRef.current) {
            if (videoRef.current.ended) {
                videoRef.current.currentTime = 0;
                setProgress(0);
                setCurrentTime(0);
                setLessonCompleted(false);
                setIsPlaying(false);
                videoRef.current.play().catch(err => {
                    console.error('Video oynatılamadı:', err);
                    setVideoError(true);
                });
                setIsPlaying(true);
                return;
            }
            
            if (isPlaying) {
                videoRef.current.pause();
            } else {
                videoRef.current.play().catch(err => {
                    console.error('Video oynatılamadı:', err);
                    setVideoError(true);
                });
            }
            setIsPlaying(!isPlaying);
        }
    };

    const handleTimeUpdate = () => {
        if (videoRef.current) {
            const current = videoRef.current.currentTime;
            const total = videoRef.current.duration || 1;
            setCurrentTime(current);
            setProgress((current / total) * 100);
            
            if (total > 0 && current >= total - 0.3 && !lessonCompleted) {
                handleVideoEnded();
                return;
            }
            
            if (!isEnrolled && !isInstructor && !isAdmin && currentLesson?.isPreview && current > PREVIEW_DURATION && !previewEnded) {
                videoRef.current.pause();
                setIsPlaying(false);
                setPreviewEnded(true);
                
                Swal.fire({
                    icon: 'info',
                    title: '⏰ Önizleme Bitti',
                    text: 'Bu dersin önizlemesi sona erdi. Devam etmek için kursa kaydolun.',
                    confirmButtonColor: '#667eea',
                    confirmButtonText: '🎯 Kursa Kaydol',
                    showCancelButton: true,
                    cancelButtonText: 'Kursa Dön',
                    cancelButtonColor: '#6b7280'
                }).then((result) => {
                    if (result.isConfirmed) {
                        if (isAuthenticated) {
                            navigate(`/courses/${courseId}`);
                        } else {
                            navigate('/login');
                        }
                    } else {
                        navigate(`/courses/${courseId}`);
                    }
                });
            }
        }
    };

    const handleLoadedMetadata = () => {
        if (videoRef.current) {
            setDuration(videoRef.current.duration);
            setVideoError(false);
        }
    };

    const handleVideoError = (e) => {
        console.error('❌ Video yüklenemedi:', currentLesson?.videoUrl);
        setVideoError(true);
    };

    const handleProgressClick = (e) => {
        if (!isEnrolled && !isInstructor && !isAdmin && currentLesson?.isPreview) {
            Swal.fire({
                icon: 'warning',
                title: 'Önizleme',
                text: 'Önizleme dersinde ileri saramazsınız. Kaydolun!',
                confirmButtonColor: '#667eea'
            });
            return;
        }
        const rect = e.currentTarget.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width;
        if (videoRef.current) {
            videoRef.current.currentTime = x * duration;
        }
    };

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            containerRef.current?.requestFullscreen();
            setIsFullscreen(true);
        } else {
            document.exitFullscreen();
            setIsFullscreen(false);
        }
    };

    const toggleMute = () => {
        if (videoRef.current) {
            videoRef.current.muted = !isMuted;
            setIsMuted(!isMuted);
        }
    };

    const formatTime = (seconds) => {
        if (!seconds || isNaN(seconds)) return '0:00';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, []);

    useEffect(() => {
        setVideoError(false);
        setPreviewEnded(false);
        setLessonCompleted(false);
        setLastSavedTime(0);
        if (videoRef.current) {
            videoRef.current.load();
        }
    }, [currentLesson?.videoUrl]);

    useEffect(() => {
        if (!isPlaying || !enrollmentId || !currentLesson) return;
        
        const interval = setInterval(() => {
            if (videoRef.current && currentTime > 0) {
                saveProgress(currentTime);
            }
        }, 10000);
        
        return () => clearInterval(interval);
    }, [isPlaying, currentTime, enrollmentId, currentLesson]);

    useEffect(() => {
        const handleBeforeUnload = () => {
            if (currentTime > 0 && enrollmentId) {
                saveProgress(currentTime);
            }
        };
        
        const handleVisibilityChange = () => {
            if (document.hidden && currentTime > 0 && enrollmentId) {
                saveProgress(currentTime);
            }
        };
        
        window.addEventListener('beforeunload', handleBeforeUnload);
        document.addEventListener('visibilitychange', handleVisibilityChange);
        
        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [currentTime, enrollmentId]);

    if (loading) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 16 }}>
                <FaSpinner style={{ animation: 'spin 1s linear infinite', color: '#667eea', fontSize: 48 }} />
                <p style={{ color: '#6b7280' }}>Dersler yükleniyor...</p>
                <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    const isPreviewLesson = currentLesson?.isPreview === true;
    const canAccess = isInstructor || isAdmin || isEnrolled || isPreviewLesson;

    if (!canAccess && currentLesson) {
        return (
            <div style={{ maxWidth: 800, margin: '60px auto', textAlign: 'center', padding: '0 20px' }}>
                <div style={{ fontSize: 64, marginBottom: 24 }}>🔒</div>
                <h2 style={{ fontSize: 28, color: '#0f0c29', marginBottom: 12 }}>Bu Derse Erişim Yok</h2>
                <p style={{ color: '#6b7280', fontSize: 16, marginBottom: 24 }}>
                    Bu dersi izlemek için kursa kaydolmalısınız.
                </p>
                <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                    <Link to={`/courses/${courseId}`} style={{ padding: '12px 32px', background: 'linear-gradient(135deg, #667eea, #764ba2)', color: 'white', borderRadius: 10, textDecoration: 'none', fontWeight: 600, display: 'inline-block' }}>
                        Kursa Dön
                    </Link>
                </div>
            </div>
        );
    }

    const videoSrc = getFullVideoUrl(currentLesson?.videoUrl);
    const isPreviewMode = !isEnrolled && !isInstructor && !isAdmin && currentLesson?.isPreview;

    return (
        <div ref={containerRef} style={{ 
            display: 'flex', 
            flexDirection: 'column',
            height: '100vh',
            background: '#0f0c29',
            color: 'white',
            overflow: 'hidden'
        }}>
            {/* Top Bar */}
            <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                padding: '12px 24px',
                background: 'rgba(0,0,0,0.3)',
                borderBottom: '1px solid rgba(255,255,255,0.05)',
                flexShrink: 0,
                zIndex: 10
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <Link to={`/courses/${courseId}`} style={{ color: 'white', opacity: 0.7 }}>
                        <FaArrowLeft size={20} />
                    </Link>
                    <span style={{ fontSize: 14, opacity: 0.7 }}>{course?.title}</span>
                    <span style={{ fontSize: 12, opacity: 0.5, marginLeft: 4 }}>/ {currentLesson?.title}</span>
                    {currentLesson?.isPreview && (
                        <span style={{ 
                            fontSize: 11, 
                            background: '#f59e0b', 
                            color: 'white', 
                            padding: '2px 12px', 
                            borderRadius: 12,
                            fontWeight: 600,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4
                        }}>
                            <FaEye size={12} /> Önizleme
                        </span>
                    )}
                    {isPreviewMode && (
                        <span style={{ 
                            fontSize: 11, 
                            background: '#ef4444', 
                            color: 'white', 
                            padding: '2px 12px', 
                            borderRadius: 12,
                            fontWeight: 600
                        }}>
                            ⏰ 1 dk
                        </span>
                    )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <span style={{ fontSize: 13, opacity: 0.6 }}>{isFullscreen ? 'Tam Ekran' : 'Standart'}</span>
                    <button 
                        onClick={toggleFullscreen}
                        style={{ background: 'none', border: 'none', color: 'white', opacity: 0.7, cursor: 'pointer', fontSize: 18 }}
                    >
                        {isFullscreen ? <FaCompress /> : <FaExpand />}
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
                {/* LEFT - Lessons List */}
                <div style={{ 
                    width: 340,
                    minWidth: 340,
                    background: 'rgba(0,0,0,0.2)',
                    borderRight: '1px solid rgba(255,255,255,0.05)',
                    padding: '16px 12px',
                    flexShrink: 0,
                    display: 'flex',
                    flexDirection: 'column'
                }}>
                    <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        marginBottom: 16,
                        paddingBottom: 12,
                        borderBottom: '1px solid rgba(255,255,255,0.05)'
                    }}>
                        <span style={{ fontSize: 14, fontWeight: 600, opacity: 0.8 }}>
                            <FaBookOpen style={{ marginRight: 8 }} />
                            Dersler ({lessons.length})
                        </span>
                    </div>

                    <div style={{ 
                        display: 'flex', 
                        flexDirection: 'column', 
                        gap: 2,
                        flex: 1,
                        overflowY: 'auto',
                        marginBottom: 12
                    }}>
                        {lessons.map((lesson, index) => {
                            const isLocked = !lesson.isPreview && !isEnrolled && !isInstructor && !isAdmin && !isAuthenticated;
                            
                            return (
                                <button
                                    key={lesson.id}
                                    onClick={() => handleLessonClick(lesson)}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 12,
                                        padding: '10px 14px',
                                        borderRadius: 8,
                                        background: currentLesson?.id === lesson.id ? 'rgba(102, 126, 234, 0.2)' : 'transparent',
                                        border: currentLesson?.id === lesson.id ? '1px solid rgba(102, 126, 234, 0.3)' : '1px solid transparent',
                                        width: '100%',
                                        cursor: isLocked ? 'not-allowed' : 'pointer',
                                        transition: 'all 0.2s',
                                        color: 'white',
                                        textAlign: 'left',
                                        opacity: isLocked ? 0.5 : 1
                                    }}
                                    disabled={isLocked}
                                >
                                    <span style={{ 
                                        fontSize: 13, 
                                        fontWeight: 600,
                                        color: currentLesson?.id === lesson.id ? '#667eea' : 'rgba(255,255,255,0.4)',
                                        minWidth: 28
                                    }}>
                                        {String(index + 1).padStart(2, '0')}
                                    </span>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: 14, fontWeight: 500, opacity: currentLesson?.id === lesson.id ? 1 : 0.7 }}>
                                            {lesson.title}
                                        </div>
                                        <div style={{ fontSize: 12, opacity: 0.4, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                                            <FaClock size={10} /> {lesson.videoDuration || '0:00'}
                                            {lesson.isPreview && (
                                                <span style={{ 
                                                    fontSize: 10, 
                                                    background: '#f59e0b', 
                                                    color: 'white', 
                                                    padding: '1px 8px', 
                                                    borderRadius: 10,
                                                    fontWeight: 600,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 3
                                                }}>
                                                    <FaEye size={9} /> Önizleme
                                                </span>
                                            )}
                                            {isLocked && (
                                                <span style={{ 
                                                    fontSize: 10, 
                                                    color: 'rgba(255,255,255,0.3)',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 3
                                                }}>
                                                    <FaLock size={9} /> Kilitli
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    {currentLesson?.id === lesson.id && (
                                        <span style={{ color: '#667eea', fontSize: 12 }}>▶</span>
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    {allLessonsCompleted && hasExam && isEnrolled && (
                        <div style={{ 
                            paddingTop: 12,
                            borderTop: '2px solid rgba(245, 158, 11, 0.3)',
                            marginTop: 'auto'
                        }}>
                            <button
                                onClick={() => navigate(`/courses/${courseId}/exams`)}
                                style={{
                                    width: '100%',
                                    padding: '12px 16px',
                                    background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: 10,
                                    fontWeight: 700,
                                    fontSize: 14,
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: 8,
                                    transition: 'all 0.3s ease',
                                    boxShadow: '0 4px 16px rgba(245, 158, 11, 0.3)'
                                }}
                            >
                                📝 Sınava Başla
                            </button>
                            
                            {hasCertificate && (
                                <button
                                    onClick={() => navigate('/certificates')}
                                    style={{
                                        width: '100%',
                                        padding: '10px 16px',
                                        marginTop: 8,
                                        background: 'linear-gradient(135deg, #10b981, #059669)',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: 10,
                                        fontWeight: 600,
                                        fontSize: 13,
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: 8,
                                        transition: 'all 0.3s ease',
                                        boxShadow: '0 4px 16px rgba(16, 185, 129, 0.3)'
                                    }}
                                >
                                    🎓 Sertifikam
                                </button>
                            )}
                        </div>
                    )}
                </div>

                {/* RIGHT - Video Player */}
                <div style={{ 
                    flex: 1, 
                    display: 'flex', 
                    flexDirection: 'column',
                    background: '#000',
                    position: 'relative'
                }}>
                    {currentLesson ? (
                        <>
                            <div style={{ 
                                flex: 1, 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'center',
                                position: 'relative',
                                background: '#000'
                            }}>
                                {videoSrc && !videoError ? (
                                    <video
                                        ref={videoRef}
                                        key={videoSrc}
                                        src={videoSrc}
                                        style={{ 
                                            width: '100%', 
                                            height: '100%', 
                                            objectFit: 'contain',
                                            maxHeight: 'calc(100vh - 120px)',
                                            backgroundColor: '#000'
                                        }}
                                        onTimeUpdate={handleTimeUpdate}
                                        onLoadedMetadata={handleLoadedMetadata}
                                        onError={handleVideoError}
                                        onEnded={handleVideoEnded}
                                        onClick={togglePlay}
                                        controls={false}
                                        preload="auto"
                                        playsInline
                                        crossOrigin="anonymous"
                                    />
                                ) : (
                                    <div style={{ 
                                        display: 'flex', 
                                        flexDirection: 'column', 
                                        alignItems: 'center', 
                                        justifyContent: 'center',
                                        color: 'rgba(255,255,255,0.3)'
                                    }}>
                                        <div style={{ fontSize: 64, marginBottom: 16 }}>{videoError ? '❌' : '🎬'}</div>
                                        <div style={{ fontSize: 18 }}>{videoError ? 'Video yüklenemedi' : 'Bu ders için video yüklenmemiş'}</div>
                                    </div>
                                )}
                            </div>

                            {videoSrc && !videoError && (
                                <div style={{
                                    padding: '12px 24px',
                                    background: 'rgba(0,0,0,0.8)',
                                    borderTop: '1px solid rgba(255,255,255,0.05)',
                                    flexShrink: 0
                                }}>
                                    <div 
                                        onClick={handleProgressClick}
                                        style={{
                                            width: '100%',
                                            height: 4,
                                            background: 'rgba(255,255,255,0.1)',
                                            borderRadius: 2,
                                            cursor: isPreviewMode ? 'not-allowed' : 'pointer',
                                            marginBottom: 10,
                                            position: 'relative',
                                            opacity: isPreviewMode ? 0.5 : 1
                                        }}
                                    >
                                        <div style={{
                                            width: `${progress}%`,
                                            height: '100%',
                                            background: 'linear-gradient(90deg, #667eea, #764ba2)',
                                            borderRadius: 2,
                                            transition: 'width 0.1s'
                                        }} />
                                        {isPreviewMode && (
                                            <div style={{
                                                position: 'absolute',
                                                left: `${(PREVIEW_DURATION / duration) * 100}%`,
                                                top: -6,
                                                width: 2,
                                                height: 16,
                                                background: '#ef4444',
                                                borderRadius: 2
                                            }} />
                                        )}
                                    </div>

                                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                                        <button
                                            onClick={togglePlay}
                                            style={{
                                                background: 'none',
                                                border: 'none',
                                                color: 'white',
                                                fontSize: 20,
                                                cursor: 'pointer',
                                                opacity: 0.8,
                                                padding: 4
                                            }}
                                        >
                                            {isPlaying ? <FaPause /> : <FaPlay />}
                                        </button>

                                        <button
                                            onClick={toggleMute}
                                            style={{
                                                background: 'none',
                                                border: 'none',
                                                color: 'white',
                                                fontSize: 18,
                                                cursor: 'pointer',
                                                opacity: 0.8,
                                                padding: 4
                                            }}
                                        >
                                            {isMuted ? <FaVolumeMute /> : <FaVolumeUp />}
                                        </button>

                                        <span style={{ fontSize: 13, opacity: 0.6, minWidth: 100 }}>
                                            {formatTime(currentTime)} / {formatTime(duration)}
                                        </span>

                                        {isPreviewMode && (
                                            <span style={{ 
                                                fontSize: 12, 
                                                color: '#f59e0b',
                                                background: 'rgba(245, 158, 11, 0.2)',
                                                padding: '2px 12px',
                                                borderRadius: 12
                                            }}>
                                                ⏰ {Math.max(0, Math.ceil(PREVIEW_DURATION - currentTime))} sn kaldı
                                            </span>
                                        )}

                                        <div style={{ flex: 1 }} />

                                        <button
                                            onClick={toggleFullscreen}
                                            style={{
                                                background: 'none',
                                                border: 'none',
                                                color: 'white',
                                                fontSize: 18,
                                                cursor: 'pointer',
                                                opacity: 0.8,
                                                padding: 4
                                            }}
                                        >
                                            {isFullscreen ? <FaCompress /> : <FaExpand />}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </>
                    ) : (
                        <div style={{ 
                            display: 'flex', 
                            flexDirection: 'column', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            color: 'rgba(255,255,255,0.3)',
                            height: '100%'
                        }}>
                            <div style={{ fontSize: 48, marginBottom: 16 }}>📚</div>
                            <div style={{ fontSize: 18 }}>Ders seçin</div>
                            <div style={{ fontSize: 14, opacity: 0.5, marginTop: 8 }}>Sol taraftan bir ders seçin</div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default LessonPlayer;