using AcademyHub.Core.Entities;
using AcademyHub.Core.Enums;
using AcademyHub.Core.Exceptions;
using AcademyHub.Core.Interfaces;
using AcademyHub.Core.Interfaces.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace AcademyHub.Infrastructure.Services
{
    public class ReviewService : IReviewService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly ICourseService _courseService;
        private readonly INotificationService _notificationService;
        private readonly ILogger<ReviewService> _logger;

        public ReviewService(
            IUnitOfWork unitOfWork,
            ICourseService courseService,
            INotificationService notificationService,
            ILogger<ReviewService> logger)
        {
            _unitOfWork = unitOfWork;
            _courseService = courseService;
            _notificationService = notificationService;
            _logger = logger;
        }

        public async Task<Review> GetReviewByIdAsync(int id)
        {
            var review = await _unitOfWork.GetRepository<Review>()
                .SingleOrDefaultAsync(r => r.Id == id && !r.IsDeleted);

            if (review == null)
                throw new NotFoundException($"ID {id} olan yorum bulunamadı");

            return review;
        }

        public async Task<IEnumerable<Review>> GetReviewsByCourseIdAsync(int courseId)
        {
            return await _unitOfWork.GetRepository<Review>()
                .FindAsync(r => r.CourseId == courseId && r.IsApproved && !r.IsDeleted);
        }

        public async Task<IEnumerable<Review>> GetReviewsByUserIdAsync(int userId)
        {
            return await _unitOfWork.GetRepository<Review>()
                .FindAsync(r => r.UserId == userId && !r.IsDeleted);
        }

        public async Task<IEnumerable<Review>> GetPendingReviewsAsync()
        {
            return await _unitOfWork.GetRepository<Review>()
                .Query()
                .Include(r => r.User)
                .Include(r => r.Course)
                .Where(r => !r.IsApproved && !r.IsDeleted)
                .OrderBy(r => r.CreatedDate)
                .ToListAsync();
        }

        public async Task<Review> CreateReviewAsync(int userId, int courseId, int rating, string? comment)
        {
            try
            {
                Console.WriteLine($"=========================================");
                Console.WriteLine($"📝 Yorum oluşturma başladı");
                Console.WriteLine($"👤 UserId: {userId}");
                Console.WriteLine($"📚 CourseId: {courseId}");
                Console.WriteLine($"⭐ Rating: {rating}");
                Console.WriteLine($"💬 Comment: {comment}");
                Console.WriteLine($"=========================================");

                // Kurs kontrolü
                var course = await _courseService.GetCourseByIdAsync(courseId);

                if (!course.IsPublished)
                    throw new BusinessRuleException("Yayınlanmamış bir kursa yorum yapılamaz");

                Console.WriteLine($"✅ Kurs bulundu - CourseId: {course.Id}");

                // Student'ı bul
                var student = await _unitOfWork.GetRepository<Student>()
                    .SingleOrDefaultAsync(s => s.UserId == userId && !s.IsDeleted);

                if (student == null)
                {
                    Console.WriteLine($"❌ Öğrenci bulunamadı - UserId: {userId}");
                    throw new BusinessRuleException("Öğrenci profili bulunamadı!");
                }

                Console.WriteLine($"✅ Öğrenci bulundu - StudentId: {student.Id}");

                // Enrollment kontrol et
                var isEnrolled = await _unitOfWork.GetRepository<Enrollment>()
                    .AnyAsync(e => e.StudentId == student.Id &&
                                   e.CourseId == courseId &&
                                   (e.Status == EnrollmentStatus.Active || e.Status == EnrollmentStatus.Completed) &&
                                   !e.IsDeleted);

                if (!isEnrolled)
                    throw new BusinessRuleException("Bu kursa yorum yapabilmek için önce kayıt olmalısınız");

                //  Silinmiş kaydı bul
                var deletedReview = await _unitOfWork.GetRepository<Review>()
                    .FirstOrDefaultAsync(r => r.UserId == userId && r.CourseId == courseId && r.IsDeleted);

                if (deletedReview != null)
                {
                    Console.WriteLine($"🔄 Silinmiş yorum bulundu - ReviewId: {deletedReview.Id}");

                    deletedReview.IsDeleted = false;
                    deletedReview.Rating = rating;
                    deletedReview.Comment = comment;
                    deletedReview.IsApproved = false;
                    deletedReview.UpdatedDate = DateTime.UtcNow;
                    deletedReview.ApprovedDate = null;
                    deletedReview.ApprovedBy = null;

                    _unitOfWork.GetRepository<Review>().Update(deletedReview);
                    await _unitOfWork.SaveChangesAsync();

                    Console.WriteLine($"✅ Yorum reactivate edildi - ReviewId: {deletedReview.Id}");
                    Console.WriteLine($"=========================================");

                    return deletedReview;
                }

                // Aktif kayıt kontrolü
                var existingReview = await _unitOfWork.GetRepository<Review>()
                    .FirstOrDefaultAsync(r => r.UserId == userId && r.CourseId == courseId && !r.IsDeleted);

                if (existingReview != null)
                {
                    Console.WriteLine($"❌ Zaten aktif yorum var - ReviewId: {existingReview.Id}");
                    throw new BusinessRuleException("Bu kursa zaten yorum yapmışsınız");
                }

                // Yeni kayıt oluştur
                var review = new Review
                {
                    UserId = userId,
                    CourseId = courseId,
                    Rating = rating,
                    Comment = comment,
                    IsApproved = false,
                    CreatedDate = DateTime.UtcNow
                };

                await _unitOfWork.GetRepository<Review>().AddAsync(review);
                await _unitOfWork.SaveChangesAsync();

                Console.WriteLine($"✅ Yeni yorum oluşturuldu - ReviewId: {review.Id}");
                Console.WriteLine($"=========================================");

                return review;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ HATA: {ex.Message}");
                Console.WriteLine($"❌ STACK: {ex.StackTrace}");
                throw;
            }
        }

        public async Task<Review> UpdateReviewAsync(int id, int rating, string? comment)
        {
            var review = await GetReviewByIdAsync(id);

            if (review.IsApproved)
                throw new BusinessRuleException("Onaylanmış bir yorum güncellenemez");

            if (rating < 1 || rating > 5)
                throw new BusinessRuleException("Puan 1 ile 5 arasında olmalıdır");

            review.Rating = rating;
            review.Comment = comment;
            review.UpdatedDate = DateTime.UtcNow;

            _unitOfWork.GetRepository<Review>().Update(review);
            await _unitOfWork.SaveChangesAsync();

            return review;
        }

        public async Task DeleteReviewAsync(int id)
        {
            var review = await GetReviewByIdAsync(id);

            review.IsDeleted = true;
            review.UpdatedDate = DateTime.UtcNow;

            _unitOfWork.GetRepository<Review>().Update(review);
            await _unitOfWork.SaveChangesAsync();

            // Kursun ortalama puanını güncelle
            await UpdateCourseAverageRating(review.CourseId);

            //  Eğitmen istatistiklerini güncelle
            await UpdateInstructorStatsByCourseId(review.CourseId);
        }

        public async Task<Review> ApproveReviewAsync(int id)
        {
            var review = await GetReviewByIdAsync(id);

            if (review.IsApproved)
                throw new BusinessRuleException("Bu yorum zaten onaylanmış");

            review.IsApproved = true;
            review.ApprovedDate = DateTime.UtcNow;
            review.UpdatedDate = DateTime.UtcNow;

            _unitOfWork.GetRepository<Review>().Update(review);
            await _unitOfWork.SaveChangesAsync();

            // ============================================================
            // 🔥🔥🔥 BİLDİRİM GÖNDER 🔥🔥🔥
            // ============================================================
            try
            {
                var user = await _unitOfWork.GetRepository<User>()
                    .GetByIdAsync(review.UserId);

                if (user != null)
                {
                    var course = await _courseService.GetCourseByIdAsync(review.CourseId);

                    await _notificationService.CreateNotificationAsync(
                        user.Id,
                        "✅ Yorumunuz Onaylandı!",
                        $"'{course.Title}' kursuna yaptığınız yorum admin tarafından onaylandı. 🎉",
                        "Success",
                        $"/courses/{course.Id}",
                        "fa-comment"
                    );

                    _logger.LogInformation($"✅ Yorum onay bildirimi gönderildi - UserId: {review.UserId}");
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Bildirim gönderilemedi");
            }
            // ============================================================

            // Kursun ortalama puanını güncelle
            await UpdateCourseAverageRating(review.CourseId);

            // 🔥 Eğitmen istatistiklerini güncelle
            await UpdateInstructorStatsByCourseId(review.CourseId);

            return review;
        }

        public async Task<Review> RejectReviewAsync(int id)
        {
            var review = await GetReviewByIdAsync(id);

            if (review.IsApproved)
                throw new BusinessRuleException("Onaylanmış bir yorum reddedilemez");

            review.IsDeleted = true;
            review.UpdatedDate = DateTime.UtcNow;

            _unitOfWork.GetRepository<Review>().Update(review);
            await _unitOfWork.SaveChangesAsync();

            // ============================================================
            //  BİLDİRİM GÖNDER 
            // ============================================================
            try
            {
                var user = await _unitOfWork.GetRepository<User>()
                    .GetByIdAsync(review.UserId);

                if (user != null)
                {
                    var course = await _courseService.GetCourseByIdAsync(review.CourseId);

                    await _notificationService.CreateNotificationAsync(
                        user.Id,
                        "❌ Yorumunuz Reddedildi",
                        $"'{course.Title}' kursuna yaptığınız yorum admin tarafından reddedildi.",
                        "Error",
                        $"/courses/{course.Id}",
                        "fa-comment-slash"
                    );

                    _logger.LogInformation($"✅ Yorum red bildirimi gönderildi - UserId: {review.UserId}");
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Bildirim gönderilemedi");
            }
            // ============================================================

            //  Eğitmen istatistiklerini güncelle
            await UpdateInstructorStatsByCourseId(review.CourseId);

            return review;
        }

        public async Task<double> GetAverageRatingByCourseIdAsync(int courseId)
        {
            var reviews = await _unitOfWork.GetRepository<Review>()
                .FindAsync(r => r.CourseId == courseId && r.IsApproved && !r.IsDeleted);

            return reviews.Any() ? Math.Round(reviews.Average(r => r.Rating), 2) : 0;
        }

        public async Task<int> GetReviewCountByCourseIdAsync(int courseId)
        {
            return await _unitOfWork.GetRepository<Review>()
                .CountAsync(r => r.CourseId == courseId && r.IsApproved && !r.IsDeleted);
        }

        public async Task<bool> HasUserReviewedAsync(int userId, int courseId)
        {
            return await _unitOfWork.GetRepository<Review>()
                .AnyAsync(r => r.UserId == userId && r.CourseId == courseId && !r.IsDeleted);
        }

    

        private async Task UpdateCourseAverageRating(int courseId)
        {
            var course = await _courseService.GetCourseByIdAsync(courseId);

            var avgRating = await GetAverageRatingByCourseIdAsync(courseId);
            var totalReviews = await GetReviewCountByCourseIdAsync(courseId);

            course.AverageRating = avgRating;
            course.TotalReviews = totalReviews;
            course.UpdatedDate = DateTime.UtcNow;

            _unitOfWork.GetRepository<Course>().Update(course);
            await _unitOfWork.SaveChangesAsync();
        }

        /// <summary>
        ///  Kurs ID'sine göre eğitmen istatistiklerini günceller
        /// </summary>
        private async Task UpdateInstructorStatsByCourseId(int courseId)
        {
            try
            {
                var course = await _courseService.GetCourseByIdAsync(courseId);
                if (course == null || course.InstructorId <= 0)
                {
                    _logger.LogWarning($"⚠️ Kurs veya eğitmen bulunamadı - CourseId: {courseId}");
                    return;
                }

                await UpdateInstructorStatsAsync(course.InstructorId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"❌ Eğitmen istatistikleri güncellenirken hata oluştu - CourseId: {courseId}");
            }
        }

        /// <summary>
        ///  Eğitmen istatistiklerini günceller (TotalReviews ve AverageRating)
        /// </summary>
        private async Task UpdateInstructorStatsAsync(int instructorId)
        {
            try
            {
                var instructor = await _unitOfWork.GetRepository<Instructor>()
                    .Query()
                    .Include(i => i.Courses)
                    .ThenInclude(c => c.Reviews)
                    .FirstOrDefaultAsync(i => i.Id == instructorId && !i.IsDeleted);

                if (instructor == null)
                {
                    _logger.LogWarning($"⚠️ Eğitmen bulunamadı - InstructorId: {instructorId}");
                    return;
                }

                // Tüm kursların onaylı ve silinmemiş yorumlarını al
                var allReviews = instructor.Courses
                    .SelectMany(c => c.Reviews)
                    .Where(r => r.IsApproved && !r.IsDeleted)
                    .ToList();

                // Toplam yorum sayısı
                instructor.TotalReviews = allReviews.Count;

                // Ortalama puan
                instructor.AverageRating = allReviews.Any()
                    ? Math.Round(allReviews.Average(r => r.Rating), 2)
                    : 0;

                instructor.UpdatedDate = DateTime.UtcNow;

                _unitOfWork.GetRepository<Instructor>().Update(instructor);
                await _unitOfWork.SaveChangesAsync();

                _logger.LogInformation($"✅ Eğitmen istatistikleri güncellendi - InstructorId: {instructorId}, " +
                                       $"TotalReviews: {instructor.TotalReviews}, AverageRating: {instructor.AverageRating}");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"❌ Eğitmen istatistikleri güncellenirken hata oluştu - InstructorId: {instructorId}");
                throw;
            }
        }
    }
}