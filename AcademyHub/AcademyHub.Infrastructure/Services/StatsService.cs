using AcademyHub.Core.Entities;
using AcademyHub.Core.Enums;
using AcademyHub.Core.Interfaces;
using AcademyHub.Core.Interfaces.Services;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace AcademyHub.Infrastructure.Services
{
    public class StatsService : IStatsService
    {
        private readonly IUnitOfWork _unitOfWork;

        public StatsService(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }

        public async Task<DashboardStats> GetDashboardStatsAsync()
        {
            var userRepo = _unitOfWork.GetRepository<User>();
            var courseRepo = _unitOfWork.GetRepository<Course>();
            var enrollmentRepo = _unitOfWork.GetRepository<Enrollment>();
            var categoryRepo = _unitOfWork.GetRepository<Category>();
            var lessonRepo = _unitOfWork.GetRepository<Lesson>();
            var paymentRepo = _unitOfWork.GetRepository<Payment>();
            var reviewRepo = _unitOfWork.GetRepository<Review>();

            var totalStudents = await userRepo.CountAsync(u => u.Role == UserRole.Student && u.IsActive && !u.IsDeleted);
            var totalInstructors = await userRepo.CountAsync(u => u.Role == UserRole.Instructor && u.IsActive && !u.IsDeleted);
            var totalUsers = totalStudents + totalInstructors;

            var totalCourses = await courseRepo.CountAsync(c => !c.IsDeleted);
            var publishedCourses = await courseRepo.CountAsync(c => c.IsPublished && !c.IsDeleted);

            var totalEnrollments = await enrollmentRepo
                .CountAsync(e => (e.Status == EnrollmentStatus.Active || e.Status == EnrollmentStatus.Completed) && !e.IsDeleted);

            var totalCategories = await categoryRepo.CountAsync(c => !c.IsDeleted);
            var totalLessons = await lessonRepo.CountAsync(l => !l.IsDeleted);

            var payments = await paymentRepo
                .FindAsync(p => p.Status == PaymentStatus.Completed && !p.IsDeleted);

            var totalRevenueSum = payments.Sum(p => p.Amount);

            var averageRating = await reviewRepo
                .FindAsync(r => r.IsApproved && !r.IsDeleted);

            var avgRating = averageRating.Any() ? averageRating.Average(r => r.Rating) : 0;

            return new DashboardStats
            {
                TotalUsers = totalUsers,
                TotalStudents = totalStudents,
                TotalInstructors = totalInstructors,
                TotalCourses = totalCourses,
                PublishedCourses = publishedCourses,
                TotalEnrollments = totalEnrollments,
                TotalRevenue = totalRevenueSum,
                TotalCategories = totalCategories,
                TotalLessons = totalLessons,
                AverageRating = Math.Round(avgRating, 2)
            };
        }

        public async Task<InstructorStats> GetInstructorStatsAsync(int instructorId)
        {
            var courseRepo = _unitOfWork.GetRepository<Course>();
            var enrollmentRepo = _unitOfWork.GetRepository<Enrollment>();
            var paymentRepo = _unitOfWork.GetRepository<Payment>();
            var reviewRepo = _unitOfWork.GetRepository<Review>();

            var courses = await courseRepo
                .FindAsync(c => c.InstructorId == instructorId && !c.IsDeleted);

            var publishedCourses = courses.Count(c => c.IsPublished);
            var totalCourses = courses.Count();

            var courseIds = courses.Select(c => c.Id).ToList();

            var enrollments = await enrollmentRepo
                .FindAsync(e => courseIds.Contains(e.CourseId) &&
                               (e.Status == EnrollmentStatus.Active || e.Status == EnrollmentStatus.Completed) &&
                               !e.IsDeleted);

            var totalEnrollments = enrollments.Count();
            var totalStudents = enrollments.Select(e => e.StudentId).Distinct().Count();

            var payments = await paymentRepo
                .FindAsync(p => courseIds.Contains(p.CourseId) && p.Status == PaymentStatus.Completed && !p.IsDeleted);

            // 🔥 VERİTABANINDAKİ DEĞERLERİ KONTROL ET
            Console.WriteLine($"💰 Toplam ödeme sayısı: {payments.Count()}");
            foreach (var payment in payments)
            {
                Console.WriteLine($"💳 Ödeme ID: {payment.Id}, Currency: {payment.Currency}, Değer: {(int)payment.Currency}, Amount: {payment.Amount}");
            }

            // 🔥 DÜZELTİLDİ: Currency enum'ını string'e dönüştür
            var revenueByCurrency = payments
                .GroupBy(p => p.Currency)
                .Select(g => new RevenueByCurrency
                {
                    // 🔥 Enum değerini string'e çevir
                    Currency = GetCurrencyString(g.Key),
                    Total = g.Sum(p => p.InstructorAmount ?? p.Amount * 0.7m)
                })
                .ToList();

            // 🔥 Eğer hiç gelir yoksa veya boşsa, varsayılan olarak TL ekle
            if (!revenueByCurrency.Any() && payments.Any())
            {
                // Eğer payments var ama currency gruplanamıyorsa, tümünü TL olarak göster
                revenueByCurrency.Add(new RevenueByCurrency
                {
                    Currency = "TL",
                    Total = payments.Sum(p => p.InstructorAmount ?? p.Amount * 0.7m)
                });
            }

            var totalRevenue = payments.Sum(p => p.InstructorAmount ?? p.Amount * 0.7m);

            var reviews = await reviewRepo
                .FindAsync(r => courseIds.Contains(r.CourseId) && r.IsApproved && !r.IsDeleted);

            var avgRating = reviews.Any() ? reviews.Average(r => r.Rating) : 0;

            var result = new InstructorStats
            {
                TotalCourses = totalCourses,
                PublishedCourses = publishedCourses,
                TotalStudents = totalStudents,
                TotalEnrollments = totalEnrollments,
                TotalRevenue = totalRevenue,
                AverageRating = Math.Round(avgRating, 2),
                TotalReviews = reviews.Count(),
                RevenueByCurrency = revenueByCurrency
            };

            Console.WriteLine($"📊 Sonuç: {System.Text.Json.JsonSerializer.Serialize(result)}");
            return result;
        }

     
        private string GetCurrencyString(Currency currency)
        {
            return currency switch
            {
                Currency.TL => "TL",
                Currency.USD => "USD",
                Currency.EUR => "EUR",
                Currency.GBP => "GBP",
                _ => "TL" 
            };
        }

        public async Task<StudentStats> GetStudentStatsAsync(int studentId)
        {
            var enrollmentRepo = _unitOfWork.GetRepository<Enrollment>();
            var paymentRepo = _unitOfWork.GetRepository<Payment>();

            var enrollments = await enrollmentRepo
                .FindAsync(e => e.StudentId == studentId && !e.IsDeleted);

            var totalEnrollments = enrollments.Count();

            var completedCourses = enrollments.Count(e =>
                e.Status == EnrollmentStatus.Completed || e.ProgressPercentage >= 100);

            var inProgressCourses = enrollments.Count(e =>
                e.Status == EnrollmentStatus.Active && e.ProgressPercentage < 100);

            var averageProgress = enrollments.Any() ? enrollments.Average(e => e.ProgressPercentage) : 0;

            var student = await _unitOfWork.GetRepository<Student>()
                .FirstOrDefaultAsync(s => s.Id == studentId && !s.IsDeleted);

            decimal totalSpent = 0;
            int totalCertificates = 0;

            if (student != null)
            {
                var payments = await paymentRepo
                    .FindAsync(p => p.UserId == student.UserId && p.Status == PaymentStatus.Completed && !p.IsDeleted);
                totalSpent = payments.Sum(p => p.Amount);
                totalCertificates = enrollments.Count(e => !string.IsNullOrEmpty(e.CertificateUrl));
            }

            return new StudentStats
            {
                TotalEnrollments = totalEnrollments,
                CompletedCourses = completedCourses,
                InProgressCourses = inProgressCourses,
                AverageProgress = Math.Round(averageProgress, 2),
                TotalSpent = totalSpent,
                TotalCertificates = totalCertificates
            };
        }
    }
}