// pages/instructor/InstructorExamCreate.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaPlus, FaTrash, FaSpinner } from 'react-icons/fa';
import Swal from 'sweetalert2';
import api from '../../api/api';

const InstructorExamCreate = () => {
    const navigate = useNavigate();
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [exam, setExam] = useState({
        title: '',
        description: '',
        courseId: '',
        durationMinutes: 30,
        passingScore: 70,
        questions: [
            {
                text: '',
                type: 0,
                points: 10,
                answers: [
                    { text: '', isCorrect: false },
                    { text: '', isCorrect: false },
                    { text: '', isCorrect: false },
                    { text: '', isCorrect: false }
                ]
            }
        ]
    });

    useEffect(() => {
        fetchCourses();
    }, []);

    const fetchCourses = async () => {
        try {
            const res = await api.get('/course/instructor');
            setCourses(res.data.data || []);
        } catch (err) {
            console.error('Kurslar yüklenirken hata:', err);
        } finally {
            setLoading(false);
        }
    };

    const addQuestion = () => {
        setExam({
            ...exam,
            questions: [
                ...exam.questions,
                {
                    text: '',
                    type: 0,
                    points: 10,
                    answers: [
                        { text: '', isCorrect: false },
                        { text: '', isCorrect: false },
                        { text: '', isCorrect: false },
                        { text: '', isCorrect: false }
                    ]
                }
            ]
        });
    };

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

    const updateQuestion = (index, field, value) => {
        const newQuestions = [...exam.questions];
        newQuestions[index][field] = value;
        setExam({ ...exam, questions: newQuestions });
    };

    const updateAnswer = (qIndex, aIndex, field, value) => {
        const newQuestions = [...exam.questions];
        newQuestions[qIndex].answers[aIndex][field] = value;
        setExam({ ...exam, questions: newQuestions });
    };

const handleSubmit = async (e) => {
    e.preventDefault();
    
    console.log('🔥 FORM GÖNDERİLİYOR...');
    console.log('📝 Exam:', exam);
    
    // Validasyonlar
    if (!exam.title.trim()) {
        Swal.fire({ icon: 'warning', title: 'Başlık gerekli', text: 'Sınav başlığını girin.' });
        return;
    }
    if (!exam.courseId) {
        Swal.fire({ icon: 'warning', title: 'Kurs seçin', text: 'Bir kurs seçin.' });
        return;
    }
    
    for (let i = 0; i < exam.questions.length; i++) {
        const q = exam.questions[i];
        console.log(`📝 Soru ${i+1}:`, q);
        
        if (!q.text.trim()) {
            Swal.fire({ icon: 'warning', title: 'Soru boş', text: `${i+1}. soruyu doldurun.` });
            return;
        }
        
        const filledAnswers = q.answers.filter(a => a.text.trim() !== '');
        console.log(`📝 Soru ${i+1} dolu cevap sayısı:`, filledAnswers.length);
        
        if (filledAnswers.length < 2) {
            Swal.fire({ 
                icon: 'warning', 
                title: 'Eksik Cevap!', 
                text: `${i+1}. soru için en az 2 cevap girin! (Şu an ${filledAnswers.length} cevap dolu)`,
                confirmButtonColor: '#f59e0b'
            });
            return;
        }
        
        const hasCorrect = filledAnswers.some(a => a.isCorrect);
        if (!hasCorrect) {
            Swal.fire({ 
                icon: 'warning', 
                title: 'Doğru cevap yok', 
                text: `${i+1}. soru için doğru cevap işaretleyin.`,
                confirmButtonColor: '#f59e0b'
            });
            return;
        }
    }

    setSubmitting(true);
    try {
        console.log(' 1. Sınav oluşturuluyor...');
        
        // 1. Sınavı oluştur
        const examRes = await api.post('/exam', {
            title: exam.title,
            description: exam.description,
            courseId: parseInt(exam.courseId),
            durationMinutes: exam.durationMinutes,
            passingScore: exam.passingScore
        });

        const examId = examRes.data.data.id;
        console.log('📝 Sınav oluşturuldu - ID:', examId);

        // 2. Soruları ekle
        for (let i = 0; i < exam.questions.length; i++) {
            const question = exam.questions[i];
            
            console.log(` Soru ${i+1} ekleniyor...`);
            
            const answers = question.answers
                .filter(a => a.text.trim() !== '')
                .map(a => ({
                    text: a.text,
                    isCorrect: a.isCorrect
                }));

            console.log(`📤 Soru ${i+1} cevapları:`, answers);

            const questionData = {
                examId: examId,
                text: question.text,
                type: question.type,
                points: question.points || 10,
                explanation: question.explanation || '',
                answers: answers
            };

            console.log(`📤 Soru ${i+1} gönderiliyor:`, questionData);

            const response = await api.post('/exam/question', questionData);
            console.log(`✅ Soru ${i+1} eklendi:`, response.data);
        }

        // 3. Sınavı yayınla
        console.log('🔥 Sınav yayınlanıyor...');
        await api.post(`/exam/${examId}/publish`);

        Swal.fire({
            icon: 'success',
            title: 'Sınav Oluşturuldu!',
            text: `${exam.questions.length} soru ile sınav başarıyla oluşturuldu ve yayınlandı.`,
            timer: 3000,
            showConfirmButton: false
        });

        navigate('/instructor/exams');
        
    } catch (err) {
        console.error('❌ HATA:', err);
        console.error('❌ RESPONSE:', err.response);
        console.error('❌ DATA:', err.response?.data);
        console.error('❌ STATUS:', err.response?.status);
        
        //  HATA MESAJINI DETAYLI GÖSTER 
        let errorMessage = 'Sınav oluşturulurken hata oluştu!';
        if (err.response?.data?.message) {
            errorMessage = err.response.data.message;
        } else if (err.response?.data?.title) {
            errorMessage = err.response.data.title;
        } else if (err.response?.data?.errors) {
            errorMessage = JSON.stringify(err.response.data.errors);
        }
        
        Swal.fire({
            icon: 'error',
            title: 'Hata!',
            text: errorMessage,
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
            <h1 style={{ fontSize: 28, marginBottom: 8 }}>📝 Yeni Sınav Oluştur</h1>
            <p style={{ color: '#6c757d', marginBottom: 24 }}>Kursunuza ait sınav ve soruları oluşturun</p>

            <form onSubmit={handleSubmit} style={{ maxWidth: 800 }}>
                <div style={{ background: 'white', padding: 24, borderRadius: 12, marginBottom: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
                    <h3 style={{ marginTop: 0, marginBottom: 16 }}>Sınav Bilgileri</h3>
                    
                    <div style={{ marginBottom: 16 }}>
                        <label style={{ display: 'block', fontWeight: 500, marginBottom: 6 }}>Sınav Başlığı *</label>
                        <input
                            type="text"
                            value={exam.title}
                            onChange={(e) => setExam({ ...exam, title: e.target.value })}
                            style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #d1d5db', fontSize: 14 }}
                            placeholder="Örn: Python Temelleri Sınavı"
                            required
                        />
                    </div>

                    <div style={{ marginBottom: 16 }}>
                        <label style={{ display: 'block', fontWeight: 500, marginBottom: 6 }}>Açıklama</label>
                        <textarea
                            value={exam.description}
                            onChange={(e) => setExam({ ...exam, description: e.target.value })}
                            style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #d1d5db', fontSize: 14, minHeight: 80 }}
                            placeholder="Sınav hakkında açıklama..."
                        />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
                        <div>
                            <label style={{ display: 'block', fontWeight: 500, marginBottom: 6 }}>Kurs *</label>
                            <select
                                value={exam.courseId}
                                onChange={(e) => setExam({ ...exam, courseId: e.target.value })}
                                style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #d1d5db', fontSize: 14 }}
                                required
                            >
                                <option value="">Kurs seçin</option>
                                {courses.map(c => (
                                    <option key={c.id} value={c.id}>{c.title}</option>
                                ))}
                            </select>
                        </div>
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
                        {submitting ? <FaSpinner style={{ animation: 'spin 1s linear infinite' }} /> : 'Sınavı Oluştur'}
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

export default InstructorExamCreate;