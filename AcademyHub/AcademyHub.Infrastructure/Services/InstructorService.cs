using AcademyHub.Core.DTOs;
using AcademyHub.Core.Entities;
using AcademyHub.Core.Enums;
using AcademyHub.Core.Exceptions;
using AcademyHub.Core.Interfaces;
using AcademyHub.Core.Interfaces.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace AcademyHub.Infrastructure.Services
{
    public class InstructorService : IInstructorService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly ILogger<InstructorService> _logger;

        public InstructorService(IUnitOfWork unitOfWork, ILogger<InstructorService> logger)
        {
            _unitOfWork = unitOfWork;
            _logger = logger;
        }

        private async Task UpdateInstructorStatsAsync(Instructor instructor)
        {
            // Kursları getir
            var courses = await _unitOfWork.GetRepository<Course>()
                .FindAsync(c => c.InstructorId == instructor.Id && !c.IsDeleted);

            var courseIds = courses.Select(c => c.Id).ToList();

            instructor.TotalCourses = courses.Count();
            instructor.PublishedCourses = courses.Count(c => c.IsPublished);

            if (courseIds.Any())
            {
                // Öğrenci sayısı
                var enrollments = await _unitOfWork.GetRepository<Enrollment>()
                    .FindAsync(e => courseIds.Contains(e.CourseId) && !e.IsDeleted);
                instructor.TotalStudents = enrollments.Select(e => e.StudentId).Distinct().Count();

                // Kazanç (tamamlanmış ödemelerden)
                var payments = await _unitOfWork.GetRepository<Payment>()
                    .FindAsync(p => courseIds.Contains(p.CourseId) && p.Status == PaymentStatus.Completed && !p.IsDeleted);
                instructor.TotalEarnings = payments.Sum(p => p.InstructorAmount ?? p.Amount * 0.7m);

                // Puan ve Yorum
                var reviews = await _unitOfWork.GetRepository<Review>()
                    .FindAsync(r => courseIds.Contains(r.CourseId) && r.IsApproved && !r.IsDeleted);
                instructor.AverageRating = reviews.Any() ? reviews.Average(r => r.Rating) : 0;
                instructor.TotalReviews = reviews.Count();
            }
            else
            {
                instructor.TotalStudents = 0;
                instructor.TotalEarnings = 0;
                instructor.AverageRating = 0;
                instructor.TotalReviews = 0;
            }

            instructor.UpdatedDate = DateTime.UtcNow;

            _unitOfWork.GetRepository<Instructor>().Update(instructor);
            await _unitOfWork.SaveChangesAsync();
        }

        public async Task<Instructor> GetInstructorByIdAsync(int id)
        {
            var instructor = await _unitOfWork.GetRepository<Instructor>()
                .Query()
                .Include(i => i.User)
                .FirstOrDefaultAsync(i => i.Id == id && !i.IsDeleted);

            if (instructor == null)
                throw new NotFoundException($"ID {id} olan eğitmen bulunamadı");

            await UpdateInstructorStatsAsync(instructor);
            return instructor;
        }

        public async Task<Instructor> GetInstructorByUserIdAsync(int userId)
        {
            var instructor = await _unitOfWork.GetRepository<Instructor>()
                .Query()
                .Include(i => i.User)
                .FirstOrDefaultAsync(i => i.UserId == userId && !i.IsDeleted);

            if (instructor == null)
                return null;

            await UpdateInstructorStatsAsync(instructor);
            return instructor;
        }

        public async Task<IEnumerable<Instructor>> GetAllInstructorsAsync()
        {
            return await _unitOfWork.GetRepository<Instructor>()
                .FindAsync(i => !i.IsDeleted);
        }

        public async Task<IEnumerable<Instructor>> GetActiveInstructorsAsync()
        {
            return await _unitOfWork.GetRepository<Instructor>()
                .FindAsync(i => i.IsActive && !i.IsDeleted);
        }

        public async Task<Instructor> CreateInstructorAsync(Instructor instructor)
        {
            var existing = await _unitOfWork.GetRepository<Instructor>()
                .SingleOrDefaultAsync(i => i.UserId == instructor.UserId && !i.IsDeleted);

            if (existing != null)
                throw new BusinessRuleException("Bu kullanıcı zaten eğitmen olarak kayıtlı");
            
            var user = await _unitOfWork.GetRepository<User>()
                .GetByIdAsync(instructor.UserId);

            if (user == null || user.IsDeleted)
                throw new NotFoundException("Geçerli bir kullanıcı bulunamadı");

            if (user.Role != UserRole.Instructor)
                throw new BusinessRuleException("Bu kullanıcı eğitmen rolünde değil");

            instructor.CreatedDate = DateTime.UtcNow;
            instructor.UpdatedDate = DateTime.UtcNow;
            instructor.CreatedBy = instructor.UserId; 
            instructor.UpdatedBy = instructor.UserId;
            instructor.IsActive = true;
            instructor.TotalEarnings = 0;
            instructor.TotalStudents = 0;
            instructor.TotalCourses = 0;
            instructor.AverageRating = 0;
            instructor.TotalReviews = 0;
            instructor.PublishedCourses = 0;

            await _unitOfWork.GetRepository<Instructor>().AddAsync(instructor);
            await _unitOfWork.SaveChangesAsync();

            return instructor;
        }

        public async Task<Instructor> UpdateInstructorAsync(Instructor instructor)
        {
            var existingInstructor = await GetInstructorByIdAsync(instructor.Id);

            existingInstructor.FirstName = instructor.FirstName;
            existingInstructor.LastName = instructor.LastName;
            existingInstructor.Bio = instructor.Bio;
            existingInstructor.Expertise = instructor.Expertise;
            existingInstructor.ProfileImage = instructor.ProfileImage;
            existingInstructor.IsActive = instructor.IsActive;
            existingInstructor.UpdatedDate = DateTime.UtcNow;

            _unitOfWork.GetRepository<Instructor>().Update(existingInstructor);
            await _unitOfWork.SaveChangesAsync();

            return existingInstructor;
        }

        public async Task<Instructor> UpdateProfileAsync(
        int userId,
        string firstName,
        string lastName,
        string? bio,
        string? expertise,
        string? phoneNumber,
        string? address)
        {
            var instructor = await _unitOfWork.GetRepository<Instructor>()
                .SingleOrDefaultAsync(i => i.UserId == userId && !i.IsDeleted);

            if (instructor == null)
                throw new NotFoundException($"UserId {userId} olan eğitmen bulunamadı");

            var user = await _unitOfWork.GetRepository<User>()
                .GetByIdAsync(userId);

            if (user == null)
                throw new NotFoundException("Kullanıcı bulunamadı");

            if (!string.IsNullOrEmpty(firstName))
            {
                instructor.FirstName = firstName;
                user.FirstName = firstName;
            }

            if (!string.IsNullOrEmpty(lastName))
            {
                instructor.LastName = lastName;
                user.LastName = lastName;
            }

            if (bio != null)
                instructor.Bio = bio;

            if (expertise != null)
                instructor.Expertise = expertise;

            if (phoneNumber != null)
                user.PhoneNumber = phoneNumber;

            if (address != null)
                user.Address = address;

            instructor.UpdatedDate = DateTime.UtcNow;
            instructor.UpdatedBy = userId;  

            user.UpdatedDate = DateTime.UtcNow;
            user.UpdatedBy = userId;  

            _unitOfWork.GetRepository<Instructor>().Update(instructor);
            _unitOfWork.GetRepository<User>().Update(user);
            await _unitOfWork.SaveChangesAsync();

            //  Profil güncellendikten sonra istatistikleri de güncelle
            await UpdateInstructorStatsAsync(instructor);

            return instructor;
        }

        public async Task<string> UpdateProfileImageAsync(int userId, string imageUrl)
        {
            var instructor = await _unitOfWork.GetRepository<Instructor>()
                .SingleOrDefaultAsync(i => i.UserId == userId && !i.IsDeleted);

            if (instructor == null)
                throw new NotFoundException($"UserId {userId} olan eğitmen bulunamadı");

            instructor.ProfileImage = imageUrl;
            instructor.UpdatedDate = DateTime.UtcNow;
            instructor.UpdatedBy = userId;

            _unitOfWork.GetRepository<Instructor>().Update(instructor);
            await _unitOfWork.SaveChangesAsync();

            return imageUrl;
        }

        public async Task RemoveProfileImageAsync(int userId)
        {
            var instructor = await _unitOfWork.GetRepository<Instructor>()
                .SingleOrDefaultAsync(i => i.UserId == userId && !i.IsDeleted);

            if (instructor == null)
                throw new NotFoundException($"UserId {userId} olan eğitmen bulunamadı");

            instructor.ProfileImage = null;
            instructor.UpdatedDate = DateTime.UtcNow;
            instructor.UpdatedBy = userId;

            _unitOfWork.GetRepository<Instructor>().Update(instructor);
            await _unitOfWork.SaveChangesAsync();
        }

        public async Task DeleteInstructorAsync(int id)
        {
            var instructor = await GetInstructorByIdAsync(id);

            var courses = await _unitOfWork.GetRepository<Course>()
                .FindAsync(c => c.InstructorId == id && !c.IsDeleted);

            if (courses.Any())
                throw new BusinessRuleException("Bu eğitmenin kursları bulunuyor. Önce kursları silin.");

            instructor.IsDeleted = true;
            instructor.UpdatedDate = DateTime.UtcNow;

            _unitOfWork.GetRepository<Instructor>().Update(instructor);
            await _unitOfWork.SaveChangesAsync();
        }

        public async Task<bool> InstructorExistsAsync(int id)
        {
            return await _unitOfWork.GetRepository<Instructor>()
                .AnyAsync(i => i.Id == id && !i.IsDeleted);
        }

        public async Task<bool> InstructorExistsByUserIdAsync(int userId)
        {
            return await _unitOfWork.GetRepository<Instructor>()
                .AnyAsync(i => i.UserId == userId && !i.IsDeleted);
        }

        public async Task<int> GetInstructorCountAsync()
        {
            return await _unitOfWork.GetRepository<Instructor>()
                .CountAsync(i => !i.IsDeleted && i.IsActive);
        }

        public async Task<decimal> GetTotalEarningsAsync(int instructorId)
        {
            var instructor = await _unitOfWork.GetRepository<Instructor>()
                .SingleOrDefaultAsync(i => i.Id == instructorId && !i.IsDeleted);

            if (instructor == null)
                return 0;

            await UpdateInstructorStatsAsync(instructor);
            return instructor.TotalEarnings;
        }

        public async Task<int> GetTotalStudentsAsync(int instructorId)
        {
            var instructor = await _unitOfWork.GetRepository<Instructor>()
                .SingleOrDefaultAsync(i => i.Id == instructorId && !i.IsDeleted);

            if (instructor == null)
                return 0;

            await UpdateInstructorStatsAsync(instructor);
            return instructor.TotalStudents;
        }

        public async Task<double> GetAverageRatingAsync(int instructorId)
        {
            var instructor = await _unitOfWork.GetRepository<Instructor>()
                .SingleOrDefaultAsync(i => i.Id == instructorId && !i.IsDeleted);

            if (instructor == null)
                return 0;

            await UpdateInstructorStatsAsync(instructor);
            return instructor.AverageRating;
        }

        public async Task<int> GetTotalCoursesAsync(int instructorId)
        {
            var instructor = await _unitOfWork.GetRepository<Instructor>()
                .SingleOrDefaultAsync(i => i.Id == instructorId && !i.IsDeleted);

            if (instructor == null)
                return 0;

            await UpdateInstructorStatsAsync(instructor);
            return instructor.TotalCourses;
        }

        public async Task<Instructor> GetInstructorProfileAsync(int userId)
        {
            var instructor = await _unitOfWork.GetRepository<Instructor>()
                .Query()
                .Include(i => i.User)
                .FirstOrDefaultAsync(i => i.UserId == userId && !i.IsDeleted);

            if (instructor == null)
                throw new NotFoundException("Eğitmen profili bulunamadı");

            await UpdateInstructorStatsAsync(instructor);
            return instructor;
        }

        public async Task<IEnumerable<CurrencyEarningDto>> GetEarningsByCurrencyAsync(int instructorId)
        {
            try
            {
                // 1. Eğitmenin tüm kurslarını al
                var courses = await _unitOfWork.GetRepository<Course>()
                    .Query()
                    .Include(c => c.Enrollments)
                    .Where(c => c.InstructorId == instructorId && !c.IsDeleted)
                    .ToListAsync();

                if (!courses.Any())
                {
                    _logger?.LogWarning($"⚠️ Eğitmen {instructorId} için kurs bulunamadı");
                    return new List<CurrencyEarningDto>();
                }

                // 2. Tüm enrollment'ları topla (sadece Active veya Completed)
                var allEnrollments = courses.SelectMany(c => c.Enrollments)
                    .Where(e => (e.Status == EnrollmentStatus.Active || e.Status == EnrollmentStatus.Completed) && !e.IsDeleted)
                    .ToList();

                if (!allEnrollments.Any())
                {
                    _logger?.LogWarning($"⚠️ Eğitmen {instructorId} için kayıt bulunamadı");
                    return new List<CurrencyEarningDto>();
                }

                // 3. Para birimine göre grupla
                var earnings = allEnrollments
                    .GroupBy(e => e.Course?.Currency ?? Currency.TL)
                    .Select(g => new CurrencyEarningDto
                    {
                        Currency = g.Key.ToString(),  // "USD", "EUR", "TL", "GBP"
                        Total = g.Sum(e => e.PaidAmount)
                    })
                    .OrderBy(e => e.Currency)
                    .ToList();

                _logger?.LogInformation($"💰 Eğitmen {instructorId} kazançları: {string.Join(", ", earnings.Select(e => $"{e.Currency}: {e.Total}"))}");

                return earnings;
            }
            catch (Exception ex)
            {
                _logger?.LogError(ex, $"❌ Eğitmen {instructorId} kazançları alınırken hata oluştu");
                return new List<CurrencyEarningDto>();
            }
        }

        public async Task<IEnumerable<Instructor>> GetAllInstructorsWithDetailsAsync()
        {
            try
            {
                
                var instructors = await _unitOfWork.GetRepository<Instructor>()
                    .Query() 
                    .Where(i => !i.IsDeleted)
                    .Include(i => i.User)  
                    .ToListAsync();

                return instructors;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Tüm eğitmenler alınırken hata oluştu");
                throw;
            }
        }
    }
}