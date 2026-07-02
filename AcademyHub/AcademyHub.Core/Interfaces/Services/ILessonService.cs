using AcademyHub.Core.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AcademyHub.Core.Interfaces.Services
{
    public interface ILessonService
    {
        Task<Lesson> GetLessonByIdAsync(int id);
        Task<IEnumerable<Lesson>> GetLessonsByCourseIdAsync(int courseId);
        Task<Lesson> CreateLessonAsync(Lesson lesson);
        Task<Lesson> UpdateLessonAsync(Lesson lesson);
        Task DeleteLessonAsync(int id);
        Task<bool> LessonExistsAsync(int id);
        Task<int> GetLessonCountByCourseIdAsync(int courseId);
        Task ReorderLessonsAsync(int courseId, Dictionary<int, int> lessonOrders);
    }
}
