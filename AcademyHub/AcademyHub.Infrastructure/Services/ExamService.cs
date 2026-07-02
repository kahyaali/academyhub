using AcademyHub.Core.Entities;
using AcademyHub.Core.Enums;
using AcademyHub.Core.Exceptions;
using AcademyHub.Core.Interfaces;
using AcademyHub.Core.Interfaces.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata;
using Microsoft.Extensions.Logging;
using RabbitMQ.Client;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;

namespace AcademyHub.Infrastructure.Services
{
    public class ExamService : IExamService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly ICourseService _courseService;
        private readonly IEnrollmentService _enrollmentService;
        private readonly ICertificateService _certificateService;
        private readonly ILogger<ExamService> _logger;
        private readonly IChannel _rabbitChannel;

        public ExamService(
            IUnitOfWork unitOfWork,
            ICourseService courseService,
            IEnrollmentService enrollmentService,
            ICertificateService certificateService,
            ILogger<ExamService> logger,
            IChannel rabbitChannel=null)  
        {
            _unitOfWork = unitOfWork;
            _courseService = courseService;
            _enrollmentService = enrollmentService;
            _certificateService = certificateService;
            _logger = logger;
            _rabbitChannel = rabbitChannel;  
        }

        // ============ EXAM CRUD ============
        public async Task<Exam> GetExamByIdAsync(int id)
        {
            var exam = await _unitOfWork.GetRepository<Exam>()
                .Query()
                .Include(e => e.Questions)
                    .ThenInclude(q => q.Answers)
                .FirstOrDefaultAsync(e => e.Id == id && !e.IsDeleted);

            if (exam == null)
                throw new NotFoundException($"ID {id} olan sınav bulunamadı");

            return exam;
        }

        public async Task<IEnumerable<Answer>> GetAnswersByQuestionIdAsync(int questionId)
        {
            return await _unitOfWork.GetRepository<Answer>()
                .FindAsync(a => a.QuestionId == questionId && !a.IsDeleted);
        }

        public async Task<IEnumerable<Exam>> GetExamsByCourseIdAsync(int courseId)
        {
            return await _unitOfWork.GetRepository<Exam>()
                .Query()
                .Include(e => e.Questions.Where(q => !q.IsDeleted))
                .Where(e => e.CourseId == courseId && !e.IsDeleted)
                .OrderByDescending(e => e.CreatedDate)
                .ToListAsync();
        }

        public async Task<Exam> CreateExamAsync(Exam exam)
        {
            var course = await _courseService.GetCourseByIdAsync(exam.CourseId);

            if (course.IsPublished)
                throw new BusinessRuleException("Yayınlanmış bir kursa sınav eklenemez");

            var existingExam = await _unitOfWork.GetRepository<Exam>()
                .SingleOrDefaultAsync(e => e.Title == exam.Title && e.CourseId == exam.CourseId && !e.IsDeleted);

            if (existingExam != null)
                throw new BusinessRuleException("Bu kurs için aynı başlıkta bir sınav zaten mevcut");

            exam.CreatedDate = DateTime.UtcNow;
            exam.IsPublished = false;

            await _unitOfWork.GetRepository<Exam>().AddAsync(exam);
            await _unitOfWork.SaveChangesAsync();

            return exam;
        }

        public async Task<Exam> UpdateExamAsync(Exam exam)
        {
            var existingExam = await GetExamByIdAsync(exam.Id);

            if (existingExam.IsPublished)
                throw new BusinessRuleException("Yayınlanmış bir sınav güncellenemez");

            existingExam.Title = exam.Title;
            existingExam.Description = exam.Description;
            existingExam.DurationMinutes = exam.DurationMinutes;
            existingExam.PassingScore = exam.PassingScore;
            existingExam.Order = exam.Order;
            existingExam.UpdatedDate = DateTime.UtcNow;

            _unitOfWork.GetRepository<Exam>().Update(existingExam);
            await _unitOfWork.SaveChangesAsync();

            return existingExam;
        }

        public async Task DeleteExamAsync(int id)
        {
            var exam = await GetExamByIdAsync(id);

            if (exam.IsPublished)
                throw new BusinessRuleException("Yayınlanmış bir sınav silinemez");

            exam.IsDeleted = true;
            exam.UpdatedDate = DateTime.UtcNow;

            _unitOfWork.GetRepository<Exam>().Update(exam);
            await _unitOfWork.SaveChangesAsync();
        }

        public async Task PublishExamAsync(int id)
        {
            var exam = await GetExamByIdAsync(id);

            var questions = await _unitOfWork.GetRepository<Question>()
                .FindAsync(q => q.ExamId == id && !q.IsDeleted);

            if (!questions.Any())
                throw new BusinessRuleException("En az bir soru eklemeden sınav yayınlanamaz");

            exam.IsPublished = true;
            exam.UpdatedDate = DateTime.UtcNow;

            _unitOfWork.GetRepository<Exam>().Update(exam);
            await _unitOfWork.SaveChangesAsync();
        }

        public async Task UnpublishExamAsync(int id)
        {
            var exam = await GetExamByIdAsync(id);
            exam.IsPublished = false;
            exam.UpdatedDate = DateTime.UtcNow;

            _unitOfWork.GetRepository<Exam>().Update(exam);
            await _unitOfWork.SaveChangesAsync();
        }

        // ============ QUESTION CRUD ============
        public async Task<Question> GetQuestionByIdAsync(int id)
        {
            var question = await _unitOfWork.GetRepository<Question>()
                .SingleOrDefaultAsync(q => q.Id == id && !q.IsDeleted);

            if (question == null)
                throw new NotFoundException($"ID {id} olan soru bulunamadı");

            return question;
        }

        public async Task<IEnumerable<Question>> GetQuestionsByExamIdAsync(int examId)
        {
            return await _unitOfWork.GetRepository<Question>()
                .FindAsync(q => q.ExamId == examId && !q.IsDeleted);
        }

        public async Task<Question> AddQuestionAsync(Question question)
        {
            var exam = await GetExamByIdAsync(question.ExamId);

            if (exam.IsPublished)
                throw new BusinessRuleException("Yayınlanmış bir sınava soru eklenemez");

            question.CreatedDate = DateTime.UtcNow;

            await _unitOfWork.GetRepository<Question>().AddAsync(question);
            await _unitOfWork.SaveChangesAsync();

            return question;
        }

        public async Task<Question> UpdateQuestionAsync(Question question)
        {
            var existingQuestion = await GetQuestionByIdAsync(question.Id);
            var exam = await GetExamByIdAsync(existingQuestion.ExamId);

            if (exam.IsPublished)
                throw new BusinessRuleException("Yayınlanmış bir sınavın sorusu güncellenemez");

            existingQuestion.Text = question.Text;
            existingQuestion.Type = question.Type;
            existingQuestion.Points = question.Points;
            existingQuestion.Explanation = question.Explanation;
            existingQuestion.UpdatedDate = DateTime.UtcNow;

            _unitOfWork.GetRepository<Question>().Update(existingQuestion);
            await _unitOfWork.SaveChangesAsync();

            return existingQuestion;
        }

        public async Task DeleteQuestionAsync(int id)
        {
            var question = await GetQuestionByIdAsync(id);
            var exam = await GetExamByIdAsync(question.ExamId);

            if (exam.IsPublished)
                throw new BusinessRuleException("Yayınlanmış bir sınavın sorusu silinemez");

            var answers = await _unitOfWork.GetRepository<Answer>()
                .FindAsync(a => a.QuestionId == id && !a.IsDeleted);

            foreach (var answer in answers)
            {
                answer.IsDeleted = true;
                answer.UpdatedDate = DateTime.UtcNow;
                _unitOfWork.GetRepository<Answer>().Update(answer);
            }

            question.IsDeleted = true;
            question.UpdatedDate = DateTime.UtcNow;

            _unitOfWork.GetRepository<Question>().Update(question);
            await _unitOfWork.SaveChangesAsync();
        }

        // ============ ANSWER CRUD ============
        public async Task<Answer> GetAnswerByIdAsync(int id)
        {
            var answer = await _unitOfWork.GetRepository<Answer>()
                .SingleOrDefaultAsync(a => a.Id == id && !a.IsDeleted);

            if (answer == null)
                throw new NotFoundException($"ID {id} olan cevap bulunamadı");

            return answer;
        }

        public async Task<Answer> AddAnswerAsync(Answer answer)
        {
            var question = await GetQuestionByIdAsync(answer.QuestionId);
            var exam = await GetExamByIdAsync(question.ExamId);

            if (exam.IsPublished)
                throw new BusinessRuleException("Yayınlanmış bir sınava cevap eklenemez");

            if (question.Type == QuestionType.MultipleChoice)
            {
                var existingAnswers = await _unitOfWork.GetRepository<Answer>()
                    .CountAsync(a => a.QuestionId == question.Id && !a.IsDeleted);

                if (existingAnswers >= 4)
                    throw new BusinessRuleException("Çoktan seçmeli soruda en fazla 4 cevap olabilir");

                if (existingAnswers < 1 && !answer.IsCorrect)
                    throw new BusinessRuleException("İlk cevap doğru cevap olmalıdır");
            }

            answer.CreatedDate = DateTime.UtcNow;

            await _unitOfWork.GetRepository<Answer>().AddAsync(answer);
            await _unitOfWork.SaveChangesAsync();

            return answer;
        }

        public async Task<Answer> UpdateAnswerAsync(Answer answer)
        {
            var existingAnswer = await GetAnswerByIdAsync(answer.Id);
            var question = await GetQuestionByIdAsync(existingAnswer.QuestionId);
            var exam = await GetExamByIdAsync(question.ExamId);

            if (exam.IsPublished)
                throw new BusinessRuleException("Yayınlanmış bir sınavın cevabı güncellenemez");

            existingAnswer.Text = answer.Text;
            existingAnswer.IsCorrect = answer.IsCorrect;
            existingAnswer.UpdatedDate = DateTime.UtcNow;

            _unitOfWork.GetRepository<Answer>().Update(existingAnswer);
            await _unitOfWork.SaveChangesAsync();

            return existingAnswer;
        }

        public async Task DeleteAnswerAsync(int id)
        {
            var answer = await GetAnswerByIdAsync(id);
            var question = await GetQuestionByIdAsync(answer.QuestionId);
            var exam = await GetExamByIdAsync(question.ExamId);

            if (exam.IsPublished)
                throw new BusinessRuleException("Yayınlanmış bir sınavın cevabı silinemez");

            answer.IsDeleted = true;
            answer.UpdatedDate = DateTime.UtcNow;

            _unitOfWork.GetRepository<Answer>().Update(answer);
            await _unitOfWork.SaveChangesAsync();
        }

        // ============ EXAM TAKING ============
        public async Task<ExamResult> StartExamAsync(int userId, int examId)
        {
            var exam = await GetExamByIdAsync(examId);
            if (!exam.IsPublished)
                throw new BusinessRuleException("Bu sınav henüz yayınlanmamış");

            var student = await _unitOfWork.GetRepository<Student>()
                .SingleOrDefaultAsync(s => s.UserId == userId && !s.IsDeleted);

            if (student == null)
                throw new NotFoundException("Öğrenci profili bulunamadı");

            var isEnrolled = await _enrollmentService.IsStudentEnrolledAsync(student.Id, exam.CourseId);
            if (!isEnrolled)
                throw new BusinessRuleException("Bu sınava girebilmek için önce kursa kayıt olmalısınız");

            var enrollment = await _unitOfWork.GetRepository<Enrollment>()
                .SingleOrDefaultAsync(e => e.StudentId == student.Id && e.CourseId == exam.CourseId && !e.IsDeleted);

            if (enrollment == null || enrollment.ProgressPercentage < 100)
                throw new BusinessRuleException("Sınava girebilmek için önce tüm dersleri tamamlamalısınız");

            var existingResult = await _unitOfWork.GetRepository<ExamResult>()
                .SingleOrDefaultAsync(r => r.StudentId == student.Id && r.ExamId == examId && !r.IsDeleted);

            if (existingResult != null)
                throw new BusinessRuleException("Bu sınava zaten girmişsiniz");

            var questions = await _unitOfWork.GetRepository<Question>()
                .FindAsync(q => q.ExamId == examId && !q.IsDeleted);

            if (!questions.Any())
                throw new BusinessRuleException("Bu sınavda henüz soru bulunmuyor");

            var examResult = new ExamResult
            {
                StudentId = student.Id,
                ExamId = examId,
                StartTime = DateTime.UtcNow,
                EndTime = DateTime.UtcNow.AddMinutes(exam.DurationMinutes),
                TotalQuestions = questions.Count(),
                TotalPoints = questions.Sum(q => q.Points),
                IsPassed = false,
                CreatedDate = DateTime.UtcNow
            };

            await _unitOfWork.GetRepository<ExamResult>().AddAsync(examResult);
            await _unitOfWork.SaveChangesAsync();

            return examResult;
        }

        //  SUBMIT EXAM - RABBITMQ İLE
        public async Task<ExamResult> SubmitExamAsync(int examResultId, Dictionary<int, int> answers)
        {
            var examResult = await GetExamResultAsync(examResultId);

            if (examResult.IsPassed)
                throw new BusinessRuleException("Bu sınav zaten tamamlanmış");

            if (DateTime.UtcNow > examResult.EndTime)
                throw new BusinessRuleException("Sınav süresi dolmuş");

            var exam = await GetExamByIdAsync(examResult.ExamId);
            var questions = await _unitOfWork.GetRepository<Question>()
                .FindAsync(q => q.ExamId == exam.Id && !q.IsDeleted);

            int correctCount = 0;
            int totalPoints = 0;
            var studentAnswers = new Dictionary<int, int>();

            foreach (var question in questions)
            {
                var correctAnswers = await _unitOfWork.GetRepository<Answer>()
                    .FindAsync(a => a.QuestionId == question.Id && a.IsCorrect && !a.IsDeleted);

                if (answers.TryGetValue(question.Id, out int selectedAnswerId))
                {
                    studentAnswers[question.Id] = selectedAnswerId;

                    var isCorrect = correctAnswers.Any(a => a.Id == selectedAnswerId);
                    if (isCorrect)
                    {
                        correctCount++;
                        totalPoints += question.Points;
                    }
                }
            }

            examResult.CorrectAnswers = correctCount;
            examResult.WrongAnswers = questions.Count() - correctCount;
            examResult.Score = totalPoints;
            examResult.IsPassed = totalPoints >= exam.PassingScore;
            examResult.EndTime = DateTime.UtcNow;
            examResult.StudentAnswers = JsonSerializer.Serialize(studentAnswers);
            examResult.UpdatedDate = DateTime.UtcNow;

            _unitOfWork.GetRepository<ExamResult>().Update(examResult);
            await _unitOfWork.SaveChangesAsync();

            //  BAŞARILIYSA RABBITMQ'YA SERTİFİKA İSTEĞİ GÖNDER 
            if (examResult.IsPassed)
            {
                try
                {
                    var enrollment = await _unitOfWork.GetRepository<Enrollment>()
                        .SingleOrDefaultAsync(e => e.StudentId == examResult.StudentId &&
                                                   e.CourseId == exam.CourseId &&
                                                   !e.IsDeleted);

                    if (enrollment != null)
                    {
                        //  RabbitMQ'ya sertifika oluşturma mesajı gönder
                        await SendCertificateRequestToQueueAsync(enrollment.Id, examResult.StudentId, exam.CourseId);

                        _logger.LogInformation($"📤 Sertifika isteği kuyruğa gönderildi - EnrollmentId: {enrollment.Id}");
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, $"❌ Sertifika isteği gönderilemedi - StudentId: {examResult.StudentId}, CourseId: {exam.CourseId}");               
                }
            }

            return examResult;
        }


        
        private async Task SendCertificateRequestToQueueAsync(int enrollmentId, int studentId, int courseId)
        {
            try
            {
                //  RabbitMQ bağlantısı yoksa direkt sertifika oluştur
                if (_rabbitChannel == null)
                {
                    _logger.LogWarning("⚠️ RabbitMQ bağlantısı yok, sertifika direkt oluşturuluyor...");
                    await _certificateService.GenerateCertificateAsync(enrollmentId);
                    return;
                }

                // Öğrenci ve kurs bilgilerini al
                var student = await _unitOfWork.GetRepository<Student>()
                    .SingleOrDefaultAsync(s => s.Id == studentId && !s.IsDeleted);

                var course = await _unitOfWork.GetRepository<Course>()
                    .SingleOrDefaultAsync(c => c.Id == courseId && !c.IsDeleted);

                if (student == null || course == null)
                {
                    _logger.LogWarning($"⚠️ Öğrenci veya kurs bulunamadı - StudentId: {studentId}, CourseId: {courseId}");
                    return;
                }

                // Sertifika verilerini hazırla
                var certData = new
                {
                    EnrollmentId = enrollmentId,
                    StudentId = student.Id,
                    StudentName = $"{student.FirstName} {student.LastName}",
                    StudentEmail = student.User?.Email ?? "",
                    CourseName = course.Title,
                    CompletionDate = DateTime.UtcNow
                };

                var message = JsonSerializer.Serialize(certData);
                var body = Encoding.UTF8.GetBytes(message);

                //  RabbitMQ'ya mesajı gönder
                await _rabbitChannel.BasicPublishAsync(
                    exchange: "",
                    routingKey: "certificate_queue",
                    mandatory: false,
                    body: body);

                _logger.LogInformation($"📤 Sertifika isteği gönderildi - EnrollmentId: {enrollmentId}");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"❌ RabbitMQ mesaj gönderilemedi, direkt sertifika oluşturuluyor...");
                try
                {
                    await _certificateService.GenerateCertificateAsync(enrollmentId);
                    _logger.LogInformation($"✅ Sertifika direkt oluşturuldu - EnrollmentId: {enrollmentId}");
                }
                catch (Exception certEx)
                {
                    _logger.LogError(certEx, $"❌ Sertifika direkt oluşturulamadı - EnrollmentId: {enrollmentId}");
                }
            }
        }

        public async Task<ExamResult> GetExamResultAsync(int examResultId)
        {
            var result = await _unitOfWork.GetRepository<ExamResult>()
                .SingleOrDefaultAsync(r => r.Id == examResultId && !r.IsDeleted);

            if (result == null)
                throw new NotFoundException($"ID {examResultId} olan sınav sonucu bulunamadı");

            return result;
        }

        public async Task<IEnumerable<ExamResult>> GetExamResultsByStudentAsync(int studentId)
        {
            return await _unitOfWork.GetRepository<ExamResult>()
                .FindAsync(r => r.StudentId == studentId && !r.IsDeleted);
        }

        public async Task<IEnumerable<ExamResult>> GetExamResultsByExamAsync(int examId)
        {
            return await _unitOfWork.GetRepository<ExamResult>()
                .FindAsync(r => r.ExamId == examId && !r.IsDeleted);
        }

        public async Task<bool> HasStudentTakenExamAsync(int studentId, int examId)
        {
            return await _unitOfWork.GetRepository<ExamResult>()
                .AnyAsync(r => r.StudentId == studentId && r.ExamId == examId && !r.IsDeleted);
        }

        public async Task<IEnumerable<Exam>> GetExamsByInstructorAsync(int instructorId)
        {
            var courses = await _unitOfWork.GetRepository<Course>()
                .FindAsync(c => c.InstructorId == instructorId && !c.IsDeleted);

            var courseIds = courses.Select(c => c.Id).ToList();

            if (!courseIds.Any())
                return new List<Exam>();

            var exams = await _unitOfWork.GetRepository<Exam>()
                .Query()
                .Include(e => e.Course)
                .Include(e => e.Questions.Where(q => !q.IsDeleted))
                .Where(e => courseIds.Contains(e.CourseId) && !e.IsDeleted)
                .OrderByDescending(e => e.CreatedDate)
                .ToListAsync();

            return exams;
        }
    }
}