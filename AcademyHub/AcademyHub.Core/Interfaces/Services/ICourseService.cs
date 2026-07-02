using AcademyHub.Core.Entities;
using AcademyHub.Core.Enums;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AcademyHub.Core.Interfaces.Services
{
    public interface ICourseService
    {
        Task<Course> GetCourseByIdAsync(int id);
        Task<IEnumerable<Course>> GetAllCoursesAsync();
        Task<IEnumerable<Course>> GetCoursesByInstructorAsync(int instructorId);
        Task<IEnumerable<Course>> GetCoursesByCategoryAsync(int categoryId);
        Task<IEnumerable<Course>> GetPublishedCoursesAsync();
        Task<Course> CreateCourseAsync(Course course);
        Task<Course> UpdateCourseAsync(Course course);
        Task DeleteCourseAsync(int id);
        Task PublishCourseAsync(int id);
        Task UnpublishCourseAsync(int id);
        Task<bool> CourseExistsAsync(int id);
        Task<int> GetCourseCountAsync();
        Task<IEnumerable<Instructor>> GetAllInstructorsAsync();
        Task<Instructor> GetInstructorByUserIdAsync(int userId);
        Task<Instructor> GetInstructorByIdAsync(int id);
        Task<IEnumerable<Course>> SearchCoursesAsync(string searchTerm, int? categoryId, CourseLevel? level, decimal? minPrice, decimal? maxPrice);
    }
}
