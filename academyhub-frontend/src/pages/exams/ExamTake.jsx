import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FaClock, FaSpinner, FaCheckCircle, FaTimesCircle, FaArrowLeft } from 'react-icons/fa';
import { examApi } from '../../api/api';
import Swal from 'sweetalert2';

const ExamTake = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const examData = location.state;
    
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [answers, setAnswers] = useState({});
    const [timeLeft, setTimeLeft] = useState(0);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (!examData) {
            navigate('/courses');
            return;
        }

        const endTime = new Date(examData.endTime);
        const now = new Date();
        const diff = Math.floor((endTime - now) / 1000);
        setTimeLeft(diff > 0 ? diff : 0);

        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(timer);
                    handleSubmit();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [examData]);

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const handleAnswerSelect = (questionId, answerId) => {
        setAnswers(prev => ({
            ...prev,
            [questionId]: answerId
        }));
    };

    const handleSubmit = async () => {
        if (Object.keys(answers).length < examData.totalQuestions) {
            const result = await Swal.fire({
                icon: 'warning',
                title: 'Tüm soruları cevaplamadınız!',
                text: `${examData.totalQuestions - Object.keys(answers).length} soru boş. Yine de göndermek istiyor musunuz?`,
                showCancelButton: true,
                confirmButtonText: 'Evet, gönder',
                cancelButtonText: 'Hayır, devam et'
            });
            
            if (!result.isConfirmed) return;
        }

        setSubmitting(true);
        try {
            const res = await examApi.submitExam({
                examResultId: examData.examResultId,
                answers: answers
            });

            navigate(`/exam/result/${res.data.data.id}`, {
                state: { result: res.data.data }
            });
        } catch (err) {
            Swal.fire({
                icon: 'error',
                title: 'Hata!',
                text: err.response?.data?.message || 'Sınav gönderilemedi',
                confirmButtonColor: '#ef4444'
            });
        } finally {
            setSubmitting(false);
        }
    };

    if (!examData) {
        return <div>Sınav bilgisi bulunamadı</div>;
    }

    const question = examData.questions[currentQuestion];
    const isLastQuestion = currentQuestion === examData.totalQuestions - 1;
    const answeredCount = Object.keys(answers).length;

    return (
        <div style={{ 
            maxWidth: 900, 
            margin: '0 auto', 
            padding: '24px 20px',
            minHeight: '100vh',
            background: '#f8fafc'
        }}>
            {/* Header */}
            <div style={{
                background: 'white',
                borderRadius: 16,
                padding: '20px 24px',
                boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
                border: '1px solid rgba(0,0,0,0.04)',
                marginBottom: 24,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 12
            }}>
                <div>
                    <h2 style={{ fontSize: 20, fontWeight: 700, color: '#0f0c29', margin: 0 }}>
                        {examData.examTitle}
                    </h2>
                    <p style={{ fontSize: 13, color: '#6b7280', margin: '4px 0 0 0' }}>
                        {answeredCount} / {examData.totalQuestions} soru cevaplandı
                    </p>
                </div>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    background: timeLeft < 60 ? '#fee2e2' : '#f1f5f9',
                    padding: '8px 16px',
                    borderRadius: 10
                }}>
                    <FaClock style={{ color: timeLeft < 60 ? '#ef4444' : '#667eea' }} />
                    <span style={{ 
                        fontSize: 22, 
                        fontWeight: 700,
                        color: timeLeft < 60 ? '#ef4444' : '#0f0c29',
                        minWidth: 60
                    }}>
                        {formatTime(timeLeft)}
                    </span>
                </div>
            </div>

            {/* Progress Bar */}
            <div style={{ marginBottom: 24 }}>
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 8
                }}>
                    <span style={{ fontSize: 14, color: '#6b7280', fontWeight: 500 }}>
                        Soru {currentQuestion + 1} / {examData.totalQuestions}
                    </span>
                    <span style={{ fontSize: 14, color: '#6b7280', fontWeight: 500 }}>
                        {Math.round(((currentQuestion + 1) / examData.totalQuestions) * 100)}%
                    </span>
                </div>
                <div style={{
                    width: '100%',
                    height: 8,
                    background: '#e5e7eb',
                    borderRadius: 4,
                    overflow: 'hidden'
                }}>
                    <div style={{
                        width: `${((currentQuestion + 1) / examData.totalQuestions) * 100}%`,
                        height: '100%',
                        background: 'linear-gradient(90deg, #667eea, #764ba2)',
                        borderRadius: 4,
                        transition: 'width 0.3s ease'
                    }} />
                </div>
            </div>

            {/* Question Card */}
            <div style={{
                background: 'white',
                borderRadius: 16,
                padding: '32px',
                boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
                border: '1px solid rgba(0,0,0,0.04)',
                marginBottom: 24
            }}>
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 20,
                    flexWrap: 'wrap',
                    gap: 8
                }}>
                    <span style={{
                        fontSize: 14,
                        fontWeight: 600,
                        color: '#667eea',
                        background: '#eef2ff',
                        padding: '4px 14px',
                        borderRadius: 20
                    }}>
                        Soru {currentQuestion + 1}
                    </span>
                    <span style={{
                        fontSize: 14,
                        fontWeight: 600,
                        color: '#6b7280',
                        background: '#f3f4f6',
                        padding: '4px 14px',
                        borderRadius: 20
                    }}>
                        {question.points} puan
                    </span>
                </div>

                <p style={{
                    fontSize: 18,
                    fontWeight: 500,
                    color: '#0f0c29',
                    marginBottom: 24,
                    lineHeight: 1.6
                }}>
                    {question.text}
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {question.answers.map((answer) => {
                        const isSelected = answers[question.id] === answer.id;
                        return (
                            <div
                                key={answer.id}
                                onClick={() => handleAnswerSelect(question.id, answer.id)}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 14,
                                    padding: '14px 20px',
                                    border: `2px solid ${isSelected ? '#667eea' : '#e5e7eb'}`,
                                    borderRadius: 12,
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease',
                                    background: isSelected ? '#eef2ff' : 'white',
                                    boxShadow: isSelected ? '0 0 0 4px rgba(102,126,234,0.1)' : 'none'
                                }}
                                onMouseEnter={(e) => {
                                    if (!isSelected) {
                                        e.currentTarget.style.borderColor = '#667eea';
                                        e.currentTarget.style.background = '#f8fafc';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (!isSelected) {
                                        e.currentTarget.style.borderColor = '#e5e7eb';
                                        e.currentTarget.style.background = 'white';
                                    }
                                }}
                            >
                                <div style={{
                                    width: 24,
                                    height: 24,
                                    borderRadius: '50%',
                                    border: `2px solid ${isSelected ? '#667eea' : '#d1d5db'}`,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexShrink: 0,
                                    background: isSelected ? '#667eea' : 'transparent',
                                    transition: 'all 0.2s ease'
                                }}>
                                    {isSelected && <FaCheckCircle style={{ color: 'white', fontSize: 14 }} />}
                                </div>
                                <span style={{
                                    fontSize: 15,
                                    color: isSelected ? '#0f0c29' : '#1f2937',
                                    fontWeight: isSelected ? 600 : 400
                                }}>
                                    {answer.text}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Navigation Buttons */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 12,
                flexWrap: 'wrap'
            }}>
                <button
                    onClick={() => setCurrentQuestion(prev => Math.max(0, prev - 1))}
                    disabled={currentQuestion === 0}
                    style={{
                        padding: '10px 24px',
                        border: 'none',
                        borderRadius: 10,
                        fontWeight: 600,
                        fontSize: 14,
                        cursor: currentQuestion === 0 ? 'not-allowed' : 'pointer',
                        background: currentQuestion === 0 ? '#e5e7eb' : '#f1f5f9',
                        color: currentQuestion === 0 ? '#9ca3af' : '#1f2937',
                        transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                        if (currentQuestion !== 0) {
                            e.currentTarget.style.background = '#e5e7eb';
                        }
                    }}
                    onMouseLeave={(e) => {
                        if (currentQuestion !== 0) {
                            e.currentTarget.style.background = '#f1f5f9';
                        }
                    }}
                >
                    ← Önceki
                </button>

                {isLastQuestion ? (
                    <button
                        onClick={handleSubmit}
                        disabled={submitting}
                        style={{
                            padding: '10px 32px',
                            border: 'none',
                            borderRadius: 10,
                            fontWeight: 700,
                            fontSize: 14,
                            cursor: submitting ? 'not-allowed' : 'pointer',
                            background: 'linear-gradient(135deg, #667eea, #764ba2)',
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            transition: 'all 0.3s ease',
                            boxShadow: '0 4px 14px rgba(102,126,234,0.3)'
                        }}
                        onMouseEnter={(e) => {
                            if (!submitting) {
                                e.currentTarget.style.transform = 'translateY(-2px)';
                                e.currentTarget.style.boxShadow = '0 8px 24px rgba(102,126,234,0.4)';
                            }
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = '0 4px 14px rgba(102,126,234,0.3)';
                        }}
                    >
                        {submitting ? (
                            <>
                                <FaSpinner style={{ animation: 'spin 1s linear infinite' }} />
                                Gönderiliyor...
                            </>
                        ) : (
                            '📤 Sınavı Gönder'
                        )}
                    </button>
                ) : (
                    <button
                        onClick={() => setCurrentQuestion(prev => Math.min(examData.totalQuestions - 1, prev + 1))}
                        style={{
                            padding: '10px 24px',
                            border: 'none',
                            borderRadius: 10,
                            fontWeight: 600,
                            fontSize: 14,
                            cursor: 'pointer',
                            background: 'linear-gradient(135deg, #667eea, #764ba2)',
                            color: 'white',
                            transition: 'all 0.3s ease',
                            boxShadow: '0 4px 14px rgba(102,126,234,0.3)'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-2px)';
                            e.currentTarget.style.boxShadow = '0 8px 24px rgba(102,126,234,0.4)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = '0 4px 14px rgba(102,126,234,0.3)';
                        }}
                    >
                        Sonraki →
                    </button>
                )}
            </div>
        </div>
    );
};

export default ExamTake;