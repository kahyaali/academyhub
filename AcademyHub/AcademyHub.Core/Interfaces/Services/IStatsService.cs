using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AcademyHub.Core.Interfaces.Services
{
    public interface IStatsService
    {
        Task<DashboardStats> GetDashboardStatsAsync();
        Task<InstructorStats> GetInstructorStatsAsync(int instructorId);
        Task<StudentStats> GetStudentStatsAsync(int studentId);
    }

    public class DashboardStats
    {
        public int TotalUsers { get; set; }
        public int TotalStudents { get; set; }
        public int TotalInstructors { get; set; }
        public int TotalCourses { get; set; }
        public int PublishedCourses { get; set; }
        public int TotalEnrollments { get; set; }
        public decimal TotalRevenue { get; set; }
        public int TotalCategories { get; set; }
        public int TotalLessons { get; set; }
        public double AverageRating { get; set; }
    }

    public class InstructorStats
    {
        public int TotalCourses { get; set; }
        public int PublishedCourses { get; set; }
        public int TotalStudents { get; set; }
        public int TotalEnrollments { get; set; }
        public decimal TotalRevenue { get; set; }
        public double AverageRating { get; set; }
        public int TotalReviews { get; set; }
        public List<RevenueByCurrency> RevenueByCurrency { get; set; } = new();
    }

    public class RevenueByCurrency  
    {
        public string Currency { get; set; } = string.Empty;
        public decimal Total { get; set; }
    }

    public class StudentStats
    {
        public int TotalEnrollments { get; set; }
        public int CompletedCourses { get; set; }
        public int InProgressCourses { get; set; }
        public double AverageProgress { get; set; }
        public decimal TotalSpent { get; set; }
        public int TotalCertificates { get; set; }
    }
}
