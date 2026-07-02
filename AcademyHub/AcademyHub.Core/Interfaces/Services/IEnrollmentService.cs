using AcademyHub.Core.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AcademyHub.Core.Interfaces.Services
{
    public interface IEnrollmentService
    {
        Task<Enrollment> GetEnrollmentByIdAsync(int id);
        Task<IEnumerable<Enrollment>> GetEnrollmentsByStudentAsync(int studentId);
        Task<IEnumerable<Enrollment>> GetEnrollmentsByCourseAsync(int courseId);
        Task<Enrollment> CreateEnrollmentAsync(int userId, int courseId, decimal paidAmount);
        Task<Enrollment> CompleteEnrollmentAsync(int enrollmentId);
        Task CancelEnrollmentAsync(int enrollmentId);
        Task<bool> IsStudentEnrolledAsync(int studentId, int courseId);
        Task<int> GetEnrollmentCountByCourseAsync(int courseId);
        Task<int> GetEnrollmentCountByStudentAsync(int studentId);
        Task UpdateProgressAsync(int enrollmentId, int lessonId, int watchTimeSeconds);
        Task<double> GetProgressPercentageAsync(int enrollmentId);
    }
}
