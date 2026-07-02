// pages/instructor/InstructorExamEdit.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaSpinner, FaTrash, FaPlus } from 'react-icons/fa';
import Swal from 'sweetalert2';
import api from '../../api/api';

const InstructorExamEdit = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [exam, setExam] = useState({
        title: '',
        description: '',
        durationMinutes: 30,
        passingScore: 70,
        questions: []
    });

    useEffect(() => {
        fetchExam();
    }, [id]);

    const fetchExam = async () => {
        try {
            setLoading(true);
            const res = await api.get(`/exam/${id}`);
            const data = res.data.data;
            setExam({
                title: data.title,
                description: data.description || '',
                durationMinutes: data.durationMinutes,
                passingScore: data.passingScore,
                questions: data.questions || []
            });
        } catch (err) {
            console.error('Sınav yüklenirken hata:', err);
            Swal.fire({
                icon: 'error',
                title: 'Hata!',
                text: err.response?.data?.message || 'Sınav yüklenirken hata oluştu!',
                confirmButtonColor: '#ef4444'
            });
            navigate('/instructor/exams');
        } finally {
            setLoading(false);
        }
    };

    //  Soru Ekle
    const addQuestion = () => {
        setExam({
            ...exam,
            questions: [
                ...exam.questions,
                {
                    id: 0,
                    text: '',
                    points: 10,
                    answers: [
                        { id: 0, text: '', isCorrect: false },
                        { id: 0, text: '', isCorrect: false },
                        { id: 0, text: '', isCorrect: false },
                        { id: 0, text: '', isCorrect: false }
                    ]
                }
            ]
        });
    };

    //  Soru Sil
    const removeQuestion = (index) => {
        if (exam.questions.length <= 1) {
            Swal.fire({
                icon: 'warning',
                title: 'En az 1 soru olmalı',
                text: 'Sınavda en az 1 soru bulunmalıdır.',
                confirmButtonColor: '#667eea'
            });
            return;
        }
        const newQuestions = [...exam.questions];
        newQuestions.splice(index, 1);
        setExam({ ...exam, questions: newQuestions });
    };

    //  Soru Güncelle
    const updateQuestion = (index, field, value) => {
        const newQuestions = [...exam.questions];
        newQuestions[index][field] = value;
        setExam({ ...exam, questions: newQuestions });
    };

    //  Cevap Güncelle
    const updateAnswer = (qIndex, aIndex, field, value) => {
        const newQuestions = [...exam.questions];
        newQuestions[qIndex].answers[aIndex][field] = value;
        setExam({ ...exam, questions: newQuestions });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Validasyon
        if (!exam.title.trim()) {
            Swal.fire({ icon: 'warning', title: 'Başlık gerekli', text: 'Sınav başlığını girin.' });
            return;
        }

        for (let i = 0; i < exam.questions.length; i++) {
            const q = exam.questions[i];
            if (!q.text.trim()) {
                Swal.fire({ icon: 'warning', title: 'Soru boş', text: `${i+1}. soruyu doldurun.` });
                return;
            }
            const hasCorrect = q.answers.some(a => a.isCorrect);
            if (!hasCorrect) {
                Swal.fire({ icon: 'warning', title: 'Doğru cevap yok', text: `${i+1}. soru için doğru cevap işaretleyin.` });
                return;
            }
        }

        setSubmitting(true);
        try {
            // 1. Sınav bilgilerini güncelle
            await api.put(`/exam/${id}`, {
                title: exam.title,
                description: exam.description,
                durationMinutes: exam.durationMinutes,
                passingScore: exam.passingScore
            });

            // 2. Soruları güncelle (önce eski soruları sil, sonra yenileri ekle)
            const existingQuestions = await api.get(`/exam/${id}/questions`);
            for (const q of existingQuestions.data.data) {
                await api.delete(`/exam/question/${q.id}`);
            }

            for (const question of exam.questions) {
                await api.post('/exam/question', {
                    examId: parseInt(id),
                    text: question.text,
                    type: 0,
                    points: question.points,
                    answers: question.answers
                });
            }

            Swal.fire({
                icon: 'success',
                title: 'Güncellendi!',
                text: 'Sınav başarıyla güncellendi.',
                timer: 1500,
                showConfirmButton: false
            });
            navigate('/instructor/exams');
        } catch (err) {
            Swal.fire({
                icon: 'error',
                title: 'Hata!',
                text: err.response?.data?.message || 'Sınav güncellenirken hata oluştu!',
                confirmButtonColor: '#ef4444'
            });
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
                <FaSpinner size={40} style={{ animation: 'spin 1s linear infinite' }} />
            </div>
        );
    }

    return (
        <div>
            <h1 style={{ fontSize: 28, marginBottom: 8 }}>📝 Sınav Düzenle</h1>
            <p style={{ color: '#6c757d', marginBottom: 24 }}>Sınav bilgilerini ve soruları güncelleyin</p>

            <form onSubmit={handleSubmit} style={{ maxWidth: 800 }}>
                {/* Sınav Bilgileri */}
                <div style={{ background: 'white', padding: 24, borderRadius: 12, marginBottom: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
                    <h3 style={{ marginTop: 0, marginBottom: 16 }}>Sınav Bilgileri</h3>

                    <div style={{ marginBottom: 16 }}>
                        <label style={{ display: 'block', fontWeight: 500, marginBottom: 6 }}>Sınav Başlığı *</label>
                        <input
                            type="text"
                            value={exam.title}
                            onChange={(e) => setExam({ ...exam, title: e.target.value })}
                            style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #d1d5db', fontSize: 14 }}
                            required
                        />
                    </div>

                    <div style={{ marginBottom: 16 }}>
                        <label style={{ display: 'block', fontWeight: 500, marginBottom: 6 }}>Açıklama</label>
                        <textarea
                            value={exam.description}
                            onChange={(e) => setExam({ ...exam, description: e.target.value })}
                            style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #d1d5db', fontSize: 14, minHeight: 80 }}
                        />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                        <div>
                            <label style={{ display: 'block', fontWeight: 500, marginBottom: 6 }}>Süre (dakika)</label>
                            <input
                                type="number"
                                value={exam.durationMinutes}
                                onChange={(e) => setExam({ ...exam, durationMinutes: parseInt(e.target.value) || 0 })}
                                style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #d1d5db', fontSize: 14 }}
                                min="1"
                                max="180"
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontWeight: 500, marginBottom: 6 }}>Geçme Notu (%)</label>
                            <input
                                type="number"
                                value={exam.passingScore}
                                onChange={(e) => setExam({ ...exam, passingScore: parseInt(e.target.value) || 0 })}
                                style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #d1d5db', fontSize: 14 }}
                                min="1"
                                max="100"
                            />
                        </div>
                    </div>
                </div>

                {/* Sorular */}
                <div style={{ background: 'white', padding: 24, borderRadius: 12, marginBottom: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                        <h3 style={{ margin: 0 }}>Sorular ({exam.questions.length})</h3>
                        <button
                            type="button"
                            onClick={addQuestion}
                            style={{
                                background: '#667eea',
                                color: 'white',
                                border: 'none',
                                padding: '8px 16px',
                                borderRadius: 8,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 6
                            }}
                        >
                            <FaPlus /> Soru Ekle
                        </button>
                    </div>

                    {exam.questions.map((question, qIndex) => (
                        <div key={qIndex} style={{
                            border: '1px solid #e5e7eb',
                            borderRadius: 8,
                            padding: 16,
                            marginBottom: 16,
                            background: '#fafafa'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                                <strong>Soru {qIndex + 1}</strong>
                                <button
                                    type="button"
                                    onClick={() => removeQuestion(qIndex)}
                                    style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}
                                >
                                    <FaTrash />
                                </button>
                            </div>

                            <div style={{ marginBottom: 12 }}>
                                <input
                                    type="text"
                                    value={question.text}
                                    onChange={(e) => updateQuestion(qIndex, 'text', e.target.value)}
                                    style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #d1d5db', fontSize: 14 }}
                                    placeholder="Soru metni..."
                                />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                                <div>
                                    <label style={{ fontSize: 13, fontWeight: 500 }}>Puan</label>
                                    <input
                                        type="number"
                                        value={question.points}
                                        onChange={(e) => updateQuestion(qIndex, 'points', parseInt(e.target.value) || 0)}
                                        style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #d1d5db', fontSize: 14 }}
                                        min="1"
                                        max="100"
                                    />
                                </div>
                            </div>

                            <div>
                                <label style={{ fontSize: 13, fontWeight: 500, display: 'block', marginBottom: 6 }}>Cevaplar</label>
                                {question.answers.map((answer, aIndex) => (
                                    <div key={aIndex} style={{ display: 'flex', gap: 8, marginBottom: 6, alignItems: 'center' }}>
                                        <input
                                            type="text"
                                            value={answer.text}
                                            onChange={(e) => updateAnswer(qIndex, aIndex, 'text', e.target.value)}
                                            style={{ flex: 1, padding: '8px 12px', borderRadius: 8, border: '1px solid #d1d5db', fontSize: 14 }}
                                            placeholder={`Cevap ${String.fromCharCode(65 + aIndex)}`}
                                        />
                                        <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13 }}>
                                            <input
                                                type="checkbox"
                                                checked={answer.isCorrect}
                                                onChange={(e) => updateAnswer(qIndex, aIndex, 'isCorrect', e.target.checked)}
                                            />
                                            Doğru
                                        </label>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                <div style={{ display: 'flex', gap: 12 }}>
                    <button
                        type="submit"
                        disabled={submitting}
                        style={{
                            padding: '12px 32px',
                            background: 'linear-gradient(135deg, #667eea, #764ba2)',
                            color: 'white',
                            border: 'none',
                            borderRadius: 8,
                            fontSize: 16,
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8
                        }}
                    >
                        {submitting ? <FaSpinner style={{ animation: 'spin 1s linear infinite' }} /> : 'Güncelle'}
                    </button>
                    <button
                        type="button"
                        onClick={() => navigate('/instructor/exams')}
                        style={{
                            padding: '12px 32px',
                            background: '#e5e7eb',
                            color: '#1f2937',
                            border: 'none',
                            borderRadius: 8,
                            fontSize: 16,
                            fontWeight: 600,
                            cursor: 'pointer'
                        }}
                    >
                        İptal
                    </button>
                </div>
            </form>
        </div>
    );
};

export default InstructorExamEdit;