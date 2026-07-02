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
    public class CourseService : ICourseService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly ILogger<CourseService> _logger;
        private readonly INotificationService _notificationService;

        public CourseService(IUnitOfWork unitOfWork, ILogger<CourseService> logger, INotificationService notificationService)
        {
            _unitOfWork = unitOfWork;
            _logger = logger;
            _notificationService = notificationService;
        }

        public async Task<Course> GetCourseByIdAsync(int id)
        {
            var course = await _unitOfWork.GetRepository<Course>()
                .Query()
                .Include(c => c.Instructor)
                    .ThenInclude(i => i.User)
                .Include(c => c.Category)
                .Include(c => c.Lessons)
                .Include(c => c.Enrollments)
                .Include(c => c.Reviews)
                .FirstOrDefaultAsync(c => c.Id == id && !c.IsDeleted);

            if (course == null)
                throw new NotFoundException($"ID {id} olan kurs bulunamadı");

            return course;
        }

        public async Task<IEnumerable<Course>> GetAllCoursesAsync()
        {
            var courses = await _unitOfWork.GetRepository<Course>()
                .Query()
                .Include(c => c.Instructor)
                    .ThenInclude(i => i.User)
                .Include(c => c.Category)
                .Include(c => c.Enrollments)
                .Include(c => c.Lessons)
                .Include(c => c.Reviews)
                .Where(c => !c.IsDeleted)
                .ToListAsync();

            return courses;
        }

        public async Task<IEnumerable<Course>> GetCoursesByInstructorAsync(int instructorId)
        {
            return await _unitOfWork.GetRepository<Course>()
                .Query()
                .Include(c => c.Instructor)
                    .ThenInclude(i => i.User)
                .Include(c => c.Category)
                .Include(c => c.Enrollments)
                .Include(c => c.Lessons)
                .Include(c => c.Reviews)
                .Where(c => c.InstructorId == instructorId && !c.IsDeleted)
                .ToListAsync();
        }

        public async Task<IEnumerable<Course>> GetCoursesByCategoryAsync(int categoryId)
        {
            return await _unitOfWork.GetRepository<Course>()
                .Query()
                .Include(c => c.Instructor)
                    .ThenInclude(i => i.User)
                .Include(c => c.Category)
                .Include(c => c.Enrollments)
                .Include(c => c.Lessons)
                .Include(c => c.Reviews)
                .Where(c => c.CategoryId == categoryId && !c.IsDeleted)
                .ToListAsync();
        }

        public async Task<IEnumerable<Course>> GetPublishedCoursesAsync()
        {
            return await _unitOfWork.GetRepository<Course>()
                .Query()
                .Include(c => c.Instructor)
                    .ThenInclude(i => i.User)
                .Include(c => c.Category)
                .Include(c => c.Enrollments)
                .Include(c => c.Lessons)
                .Include(c => c.Reviews)
                .Where(c => c.IsPublished && !c.IsDeleted)
                .ToListAsync();
        }

        public async Task<IEnumerable<Course>> SearchCoursesAsync(
            string searchTerm,
            int? categoryId,
            CourseLevel? level,
            decimal? minPrice,
            decimal? maxPrice)
        {
            var query = await _unitOfWork.GetRepository<Course>()
                .Query()
                .Include(c => c.Instructor)
                    .ThenInclude(i => i.User)
                .Include(c => c.Category)
                .Include(c => c.Enrollments)
                .Include(c => c.Lessons)
                .Include(c => c.Reviews)
                .Where(c => !c.IsDeleted && c.IsPublished)
                .ToListAsync();

            var result = query.AsQueryable();

            if (!string.IsNullOrEmpty(searchTerm))
            {
                result = result.Where(c =>
                    c.Title.Contains(searchTerm, StringComparison.OrdinalIgnoreCase) ||
                    (c.Description != null && c.Description.Contains(searchTerm, StringComparison.OrdinalIgnoreCase)) ||
                    (c.ShortDescription != null && c.ShortDescription.Contains(searchTerm, StringComparison.OrdinalIgnoreCase)));
            }

            if (categoryId.HasValue && categoryId.Value > 0)
            {
                result = result.Where(c => c.CategoryId == categoryId.Value);
            }

            if (level.HasValue)
            {
                result = result.Where(c => c.Level == level.Value);
            }

            if (minPrice.HasValue)
            {
                result = result.Where(c => c.Price >= minPrice.Value);
            }

            if (maxPrice.HasValue)
            {
                result = result.Where(c => c.Price <= maxPrice.Value);
            }

            return result.ToList();
        }

        public async Task<Instructor> GetInstructorByUserIdAsync(int userId)
        {
            try
            {
                var instructor = await _unitOfWork.GetRepository<Instructor>()
                    .FirstOrDefaultAsync(i => i.UserId == userId && !i.IsDeleted);

                return instructor;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"GetInstructorByUserIdAsync Hata: {ex.Message}");
                return null;
            }
        }

        public async Task<Instructor> GetInstructorByIdAsync(int id)
        {
            var instructor = await _unitOfWork.GetRepository<Instructor>()
                .Query()
                .Include(i => i.User)
                .FirstOrDefaultAsync(i => i.Id == id && !i.IsDeleted);

            if (instructor == null)
                throw new NotFoundException($"ID {id} olan eğitmen bulunamadı");

            return instructor;
        }

        // ============================================================
        // KURS OLUŞTUR - BİLDİRİM 
        // ============================================================
        public async Task<Course> CreateCourseAsync(Course course)
        {
            // Kurs başlığı kontrolü
            var existingCourse = await _unitOfWork.GetRepository<Course>()
                .SingleOrDefaultAsync(c => c.Title == course.Title && !c.IsDeleted);

            if (existingCourse != null)
                throw new BusinessRuleException("Bu başlıkta bir kurs zaten mevcut");

            // Instructor kontrolü
            var instructor = await _unitOfWork.GetRepository<Instructor>()
                .SingleOrDefaultAsync(i => i.Id == course.InstructorId && !i.IsDeleted);

            if (instructor == null)
                throw new NotFoundException("Geçerli bir eğitmen bulunamadı");

            // Category kontrolü
            var category = await _unitOfWork.GetRepository<Category>()
                .GetByIdAsync(course.CategoryId);

            if (category == null || category.IsDeleted)
                throw new NotFoundException("Geçerli bir kategori bulunamadı");

            course.CreatedDate = DateTime.UtcNow;
            course.UpdatedDate = DateTime.UtcNow;

          
            if (course.IsPublished)
            {
                course.PublishedDate = DateTime.UtcNow;
            }

            course.AverageRating = 0;
            course.TotalEnrollments = 0;
            course.TotalReviews = 0;
            course.TotalStudents = 0;
            course.TotalLessons = 0;
            course.TotalDurationInMinutes = 0;

            if (!course.CreatedBy.HasValue)
            {
                course.CreatedBy = instructor.UserId;
            }

            if (!course.UpdatedBy.HasValue)
            {
                course.UpdatedBy = course.CreatedBy;
            }

            await _unitOfWork.GetRepository<Course>().AddAsync(course);
            await _unitOfWork.SaveChangesAsync();

          
            try
            {
                var notificationMessage = course.IsPublished
                    ? $"🎉 '{course.Title}' kursu başarıyla yayınlandı!"
                    : $"📝 '{course.Title}' kursu taslak olarak oluşturuldu.";

                await _notificationService.CreateNotificationAsync(
                    instructor.UserId,
                    course.IsPublished ? "🎉 Kurs Yayınlandı!" : "📝 Kurs Taslağı Oluşturuldu!",
                    notificationMessage,
                    course.IsPublished ? "Success" : "Info",
                    $"/instructor/courses",
                    course.IsPublished ? "fa-check-circle" : "fa-plus-circle"
                );
                Console.WriteLine($"✅ Kurs oluşturma bildirimi gönderildi - InstructorId: {instructor.Id}");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ Kurs oluşturma bildirimi gönderilemedi: {ex.Message}");
            }

            return course;
        }


        // ============================================================
        //  KURS GÜNCELLE - BİLDİRİM EKLENDİ (ÖĞRENCİLERE DE) 
        // ============================================================
        public async Task<Course> UpdateCourseAsync(Course course)
        {
            var existingCourse = await GetCourseByIdAsync(course.Id);

            Console.WriteLine($"🔍 KURS GÜNCELLENİYOR - ID: {existingCourse.Id}, Başlık: {existingCourse.Title}");

            //  1. KONTROL: Para birimi değişiyor mu?
            if (existingCourse.Currency != course.Currency)
            {
                var hasSales = await _unitOfWork.GetRepository<Payment>()
                    .AnyAsync(p => p.CourseId == course.Id &&
                                  p.Status == PaymentStatus.Completed &&
                                  !p.IsDeleted);

                if (hasSales)
                {
                    throw new BusinessRuleException(
                        "❌ Bu kursun satışı bulunmaktadır. Para birimi değiştirilemez!"
                    );
                }

                if (existingCourse.IsPublished)
                {
                    throw new BusinessRuleException(
                        "⚠️ Kurs yayınlanmış durumda. Para birimi değiştirmek için önce kursu yayından kaldırın."
                    );
                }
            }

            //  2. KONTROL: Fiyat değişiyor mu?
            if (existingCourse.Price != course.Price && existingCourse.IsPublished)
            {
                var hasSales = await _unitOfWork.GetRepository<Payment>()
                    .AnyAsync(p => p.CourseId == course.Id &&
                                  p.Status == PaymentStatus.Completed &&
                                  !p.IsDeleted);

                if (hasSales)
                {
                    _logger.LogWarning($"⚠️ Satışı olan kursun fiyatı değiştiriliyor: {existingCourse.Price} → {course.Price}");
                }
            }

            // Kursu güncelle
            existingCourse.Title = course.Title;
            existingCourse.Description = course.Description;
            existingCourse.ShortDescription = course.ShortDescription;
            existingCourse.CoverImage = course.CoverImage;
            existingCourse.PreviewVideoUrl = course.PreviewVideoUrl;
            existingCourse.Price = course.Price;
            existingCourse.Currency = course.Currency;
            existingCourse.IsFree = course.IsFree;
            existingCourse.CategoryId = course.CategoryId;
            existingCourse.Level = course.Level;
            existingCourse.WhatYouWillLearn = course.WhatYouWillLearn;
            existingCourse.Requirements = course.Requirements;
            existingCourse.TargetAudience = course.TargetAudience;
            existingCourse.UpdatedDate = DateTime.UtcNow;

            if (course.UpdatedBy.HasValue)
            {
                existingCourse.UpdatedBy = course.UpdatedBy.Value;
            }

            _unitOfWork.GetRepository<Course>().Update(existingCourse);
            await _unitOfWork.SaveChangesAsync();

            Console.WriteLine($"✅ Kurs güncellendi - ID: {existingCourse.Id}");

            // ============================================================
            //  BİLDİRİM GÖNDER - EĞİTMENE VE ÖĞRENCİLERE 
            // ============================================================
            try
            {
                var instructor = await _unitOfWork.GetRepository<Instructor>()
                    .SingleOrDefaultAsync(i => i.Id == existingCourse.InstructorId && !i.IsDeleted);

                // 1️⃣ Eğitmene bildirim
                if (instructor != null)
                {
                    await _notificationService.CreateNotificationAsync(
                        instructor.UserId,
                        "✏️ Kurs Güncellendi!",
                        $"'{existingCourse.Title}' kursu başarıyla güncellendi.",
                        "Info",
                        $"/instructor/courses",
                        "fa-edit"
                    );
                    Console.WriteLine($"✅ Eğitmene bildirim gönderildi - InstructorId: {instructor.Id}");
                }

                //  KAYITLI ÖĞRENCİLERE BİLDİRİM 
                Console.WriteLine($"🔍 ÖĞRENCİ BİLDİRİMİ KONTROLÜ - CourseId: {existingCourse.Id}, IsPublished: {existingCourse.IsPublished}");

                if (existingCourse.IsPublished)
                {
                    Console.WriteLine("🔍 Kurs yayında, öğrenci kayıtları aranıyor...");

                    // Kursa kayıtlı öğrencileri getir
                    var enrollments = await _unitOfWork.GetRepository<Enrollment>()
                        .Query()
                        .Include(e => e.Student)
                        .Where(e => e.CourseId == existingCourse.Id &&
                                   (e.Status == EnrollmentStatus.Active || e.Status == EnrollmentStatus.Completed) &&
                                   !e.IsDeleted)
                        .ToListAsync();

                    Console.WriteLine($"📊 Bulunan enrollment sayısı: {enrollments.Count}");

                    if (enrollments.Any())
                    {
                        foreach (var e in enrollments)
                        {
                            Console.WriteLine($"   - EnrollmentId: {e.Id}, StudentId: {e.StudentId}, Status: {e.Status}, StudentUserId: {e.Student?.UserId}");
                        }

                        var studentIds = enrollments
                            .Where(e => e.Student != null)
                            .Select(e => e.Student.UserId)
                            .Distinct()
                            .ToList();

                        Console.WriteLine($"📊 Öğrenci ID'leri: {string.Join(", ", studentIds)}");

                        if (studentIds.Any())
                        {
                            await _notificationService.SendBulkNotificationAsync(
                                studentIds,
                                "📝 Kurs Güncellendi!",
                                $"'{existingCourse.Title}' kursu güncellendi. Yeni içerikleri kontrol edin!",
                                "Info"
                            );
                            Console.WriteLine($"✅ {studentIds.Count} öğrenciye kurs güncelleme bildirimi gönderildi");
                        }
                        else
                        {
                            Console.WriteLine("⚠️ Öğrenci ID'leri boş (Student null)");
                        }
                    }
                    else
                    {
                        Console.WriteLine($"⚠️ Bu kursa kayıtlı öğrenci bulunamadı. CourseId: {existingCourse.Id}");
                    }
                }
                else
                {
                    Console.WriteLine($"⚠️ Kurs yayında değil, öğrencilere bildirim gönderilmedi. IsPublished: {existingCourse.IsPublished}");
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ Bildirim gönderilemedi: {ex.Message}");
                Console.WriteLine($"❌ StackTrace: {ex.StackTrace}");
            }
            // ============================================================

            return existingCourse;
        }

        public async Task DeleteCourseAsync(int id)
        {
            var course = await GetCourseByIdAsync(id);
            course.IsDeleted = true;
            course.UpdatedDate = DateTime.UtcNow;

            _unitOfWork.GetRepository<Course>().Update(course);
            await _unitOfWork.SaveChangesAsync();
        }

        // ============================================================
        //  KURS YAYINLA - BİLDİRİM EKLENDİ (Zaten vardı) 
        // ============================================================
        public async Task PublishCourseAsync(int id)
        {
            var course = await GetCourseByIdAsync(id);

            if (course.TotalLessons == 0)
                throw new BusinessRuleException("En az bir ders eklemeden kurs yayınlanamaz");

            course.IsPublished = true;
            course.PublishedDate = DateTime.UtcNow;
            course.UpdatedDate = DateTime.UtcNow;

            _unitOfWork.GetRepository<Course>().Update(course);
            await _unitOfWork.SaveChangesAsync();

            // ============================================================
            //  BİLDİRİM GÖNDER - TÜM ÖĞRENCİLERE 
            // ============================================================
            try
            {
                // Tüm aktif öğrencileri getir
                var students = await _unitOfWork.GetRepository<Student>()
                    .FindAsync(s => s.IsActive && !s.IsDeleted);

                var studentIds = students.Select(s => s.UserId).ToList();

                if (studentIds.Any())
                {
                    await _notificationService.SendBulkNotificationAsync(
                        studentIds,
                        "📢 Yeni Kurs Yayınlandı!",
                        $"'{course.Title}' kursu yayınlandı. Hemen keşfedin!",
                        "Info"
                    );
                    Console.WriteLine($"✅ Kurs yayın bildirimi gönderildi - {studentIds.Count} öğrenciye");
                }
                else
                {
                    Console.WriteLine("⚠️ Bildirim gönderilecek öğrenci bulunamadı.");
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ Bildirim gönderilemedi: {ex.Message}");
            }
            // ============================================================

            Console.WriteLine($"📢 Kurs yayınlandı - ID: {id}, Başlık: {course.Title}");
        }

        public async Task UnpublishCourseAsync(int id)
        {
            var course = await GetCourseByIdAsync(id);
            course.IsPublished = false;
            course.UpdatedDate = DateTime.UtcNow;

            _unitOfWork.GetRepository<Course>().Update(course);
            await _unitOfWork.SaveChangesAsync();
        }

        public async Task<bool> CourseExistsAsync(int id)
        {
            return await _unitOfWork.GetRepository<Course>()
                .AnyAsync(c => c.Id == id && !c.IsDeleted);
        }

        public async Task<int> GetCourseCountAsync()
        {
            return await _unitOfWork.GetRepository<Course>()
                .CountAsync(c => !c.IsDeleted && c.IsPublished);
        }

        public async Task<IEnumerable<Instructor>> GetAllInstructorsAsync()
        {
            return await _unitOfWork.GetRepository<Instructor>()
                .FindAsync(i => !i.IsDeleted);
        }
    }
}