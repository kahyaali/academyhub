using AcademyHub.Core.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AcademyHub.Core.Interfaces.Services
{
    public interface IExamService
    {
        // Exam CRUD
        Task<Exam> GetExamByIdAsync(int id);
        Task<IEnumerable<Exam>> GetExamsByCourseIdAsync(int courseId);
        Task<IEnumerable<Exam>> GetExamsByInstructorAsync(int instructorId);
        Task<Exam> CreateExamAsync(Exam exam);
        Task<Exam> UpdateExamAsync(Exam exam);
        Task DeleteExamAsync(int id);
        Task PublishExamAsync(int id);
        Task UnpublishExamAsync(int id);

        // Question CRUD
        Task<Question> GetQuestionByIdAsync(int id);
        Task<IEnumerable<Question>> GetQuestionsByExamIdAsync(int examId);
        Task<Question> AddQuestionAsync(Question question);
        Task<Question> UpdateQuestionAsync(Question question);
        Task DeleteQuestionAsync(int id);

        // Answer CRUD
        Task<Answer> GetAnswerByIdAsync(int id);
        Task<IEnumerable<Answer>> GetAnswersByQuestionIdAsync(int questionId);
        Task<Answer> AddAnswerAsync(Answer answer);
        Task<Answer> UpdateAnswerAsync(Answer answer);
        Task DeleteAnswerAsync(int id);

        // Exam Taking
        Task<ExamResult> StartExamAsync(int studentId, int examId);
        Task<ExamResult> SubmitExamAsync(int examResultId, Dictionary<int, int> answers);
        Task<ExamResult> GetExamResultAsync(int examResultId);
        Task<IEnumerable<ExamResult>> GetExamResultsByStudentAsync(int studentId);
        Task<IEnumerable<ExamResult>> GetExamResultsByExamAsync(int examId);
        Task<bool> HasStudentTakenExamAsync(int studentId, int examId);
    }
}
