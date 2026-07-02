using AcademyHub.Core.Entities;
using AcademyHub.Core.Enums;
using AcademyHub.Core.Exceptions;
using AcademyHub.Core.Interfaces;
using AcademyHub.Core.Interfaces.Services;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AcademyHub.Infrastructure.Services
{
    public class EnrollmentService: IEnrollmentService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly ICourseService _courseService;
        private readonly ILessonService _lessonService;

        public EnrollmentService(
            IUnitOfWork unitOfWork,
            ICourseService courseService,
            ILessonService lessonService)
        {
            _unitOfWork = unitOfWork;
            _courseService = courseService;
            _lessonService = lessonService;
        }

        public async Task<Enrollment> GetEnrollmentByIdAsync(int id)
        {
            var enrollment = await _unitOfWork.GetRepository<Enrollment>()
                .SingleOrDefaultAsync(e => e.Id == id && !e.IsDeleted);

            if (enrollment == null)
                throw new NotFoundException($"ID {id} olan kayıt bulunamadı");

            return enrollment;
        }

        public async Task<IEnumerable<Enrollment>> GetEnrollmentsByStudentAsync(int studentId)
        {
            return await _unitOfWork.GetRepository<Enrollment>()
                .Query()
                .Include(e => e.Course)
                    .ThenInclude(c => c.Instructor)
                        .ThenInclude(i => i.User)  
                .Include(e => e.Course)
                    .ThenInclude(c => c.Category)
                .Include(e => e.Student)
                    .ThenInclude(s => s.User)      
                .Where(e => e.StudentId == studentId &&
                           (e.Status == EnrollmentStatus.Active || e.Status == EnrollmentStatus.Completed) &&
                           !e.IsDeleted)
                .OrderByDescending(e => e.EnrollmentDate) 
                .ToListAsync();
        }

        public async Task<IEnumerable<Enrollment>> GetEnrollmentsByCourseAsync(int courseId)
        {
            return await _unitOfWork.GetRepository<Enrollment>()
                .FindAsync(e => e.CourseId == courseId && !e.IsDeleted);
        }

        public async Task<Enrollment> CreateEnrollmentAsync(int userId, int courseId, decimal paidAmount)
        {
            //  Önce öğrenciyi bul
            var student = await _unitOfWork.GetRepository<Student>()
                .SingleOrDefaultAsync(s => s.UserId == userId && !s.IsDeleted);

            if (student == null)
                throw new NotFoundException($"Öğrenci profili bulunamadı. UserId: {userId}");

            // Kurs kontrolü
            var course = await _courseService.GetCourseByIdAsync(courseId);

            if (!course.IsPublished)
                throw new BusinessRuleException("Bu kurs henüz yayınlanmamış");

            // Zaten kayıtlı mı kontrol et 
            var existingEnrollment = await _unitOfWork.GetRepository<Enrollment>()
                .SingleOrDefaultAsync(e => e.StudentId == student.Id && e.CourseId == courseId && !e.IsDeleted);

            if (existingEnrollment != null)
                throw new BusinessRuleException("Bu kursa zaten kayıtlısınız");

            // Ödeme kontrolü
            if (!course.IsFree && paidAmount < course.Price)
                throw new BusinessRuleException("Ödeme tutarı yetersiz");

            var enrollment = new Enrollment
            {
                StudentId = student.Id,  
                CourseId = courseId,
                PaidAmount = paidAmount,
                Status = EnrollmentStatus.Active,
                EnrollmentDate = DateTime.UtcNow,
                ProgressPercentage = 0,
                CreatedDate = DateTime.UtcNow
            };

            await _unitOfWork.GetRepository<Enrollment>().AddAsync(enrollment);
            await _unitOfWork.SaveChangesAsync();

            var enrollmentCount = await GetEnrollmentCountByCourseAsync(courseId);
            Console.WriteLine($"📊 CourseId: {courseId} için Active Enrollment Sayısı: {enrollmentCount}");

            // Kurs istatistiklerini güncelle
            course.TotalEnrollments += 1;
            course.TotalStudents = (await GetEnrollmentCountByCourseAsync(courseId));
            course.UpdatedDate = DateTime.UtcNow;

            _unitOfWork.GetRepository<Course>().Update(course);
            await _unitOfWork.SaveChangesAsync();

            return enrollment;
        }

        public async Task<Enrollment> CompleteEnrollmentAsync(int enrollmentId)
        {
            var enrollment = await GetEnrollmentByIdAsync(enrollmentId);

            if (enrollment.Status == EnrollmentStatus.Completed)
                throw new BusinessRuleException("Bu kayıt zaten tamamlanmış");

            // Tüm dersler tamamlanmış mı kontrol et
            var progress = await _unitOfWork.GetRepository<LessonProgress>()
                .FindAsync(lp => lp.EnrollmentId == enrollmentId && !lp.IsDeleted);

            var course = await _courseService.GetCourseByIdAsync(enrollment.CourseId);
            var totalLessons = course.TotalLessons;

            var completedLessons = progress.Count(lp => lp.IsCompleted);

            if (completedLessons < totalLessons)
                throw new BusinessRuleException($"Tüm dersleri tamamlamadınız ({completedLessons}/{totalLessons})");

            enrollment.Status = EnrollmentStatus.Completed;
            enrollment.CompletionDate = DateTime.UtcNow;
            enrollment.ProgressPercentage = 100;
            enrollment.UpdatedDate = DateTime.UtcNow;

            _unitOfWork.GetRepository<Enrollment>().Update(enrollment);
            await _unitOfWork.SaveChangesAsync();

            return enrollment;
        }

        public async Task CancelEnrollmentAsync(int enrollmentId)
        {
            var enrollment = await GetEnrollmentByIdAsync(enrollmentId);

            if (enrollment.Status == EnrollmentStatus.Completed)
                throw new BusinessRuleException("Tamamlanmış bir kayıt iptal edilemez");

            enrollment.Status = EnrollmentStatus.Cancelled;
            enrollment.UpdatedDate = DateTime.UtcNow;

            _unitOfWork.GetRepository<Enrollment>().Update(enrollment);
            await _unitOfWork.SaveChangesAsync();
        }

        public async Task<bool> IsStudentEnrolledAsync(int studentId, int courseId)
        {
            return await _unitOfWork.GetRepository<Enrollment>()
                .AnyAsync(e => e.StudentId == studentId &&
                              e.CourseId == courseId &&
                              (e.Status == EnrollmentStatus.Active || e.Status == EnrollmentStatus.Completed) &&
                              !e.IsDeleted);
        }

        public async Task<int> GetEnrollmentCountByCourseAsync(int courseId)
        {
            return await _unitOfWork.GetRepository<Enrollment>()
                .CountAsync(e => e.CourseId == courseId && e.Status == EnrollmentStatus.Active && !e.IsDeleted);
        }

        public async Task<int> GetEnrollmentCountByStudentAsync(int studentId)
        {
            return await _unitOfWork.GetRepository<Enrollment>()
                .CountAsync(e => e.StudentId == studentId && e.Status == EnrollmentStatus.Active && !e.IsDeleted);
        }

        public async Task UpdateProgressAsync(int enrollmentId, int lessonId, int watchTimeSeconds)
        {
            var enrollment = await GetEnrollmentByIdAsync(enrollmentId);

            if (enrollment.Status != EnrollmentStatus.Active)
                throw new BusinessRuleException("Aktif olmayan bir kaydın ilerlemesi güncellenemez");

            var lesson = await _lessonService.GetLessonByIdAsync(lessonId);

            if (lesson.CourseId != enrollment.CourseId)
                throw new BusinessRuleException("Bu ders bu kursa ait değil");

            var progress = await _unitOfWork.GetRepository<LessonProgress>()
                .SingleOrDefaultAsync(lp => lp.EnrollmentId == enrollmentId && lp.LessonId == lessonId && !lp.IsDeleted);

            if (progress == null)
            {
                progress = new LessonProgress
                {
                    EnrollmentId = enrollmentId,
                    LessonId = lessonId,
                    WatchTimeSeconds = watchTimeSeconds,
                    IsCompleted = false,
                    CreatedDate = DateTime.UtcNow
                };

                await _unitOfWork.GetRepository<LessonProgress>().AddAsync(progress);
            }
            else
            {
                progress.WatchTimeSeconds = watchTimeSeconds;
                progress.LastWatchDate = DateTime.UtcNow;
                progress.UpdatedDate = DateTime.UtcNow;

                _unitOfWork.GetRepository<LessonProgress>().Update(progress);
            }

            await _unitOfWork.SaveChangesAsync();

            // Ders tamamlanma kontrolü (video süresinin %90'ı izlenmişse tamamlandı say)
            if (!progress.IsCompleted && !string.IsNullOrEmpty(lesson.VideoDuration))
            {
                var durationParts = lesson.VideoDuration.Split(':');
                int totalSeconds = 0;

                if (durationParts.Length == 2)
                    totalSeconds = int.Parse(durationParts[0]) * 60 + int.Parse(durationParts[1]);
                else if (durationParts.Length == 3)
                    totalSeconds = int.Parse(durationParts[0]) * 3600 + int.Parse(durationParts[1]) * 60 + int.Parse(durationParts[2]);

                if (totalSeconds > 0 && watchTimeSeconds >= totalSeconds * 0.9)
                {
                    progress.IsCompleted = true;
                    progress.CompletedDate = DateTime.UtcNow;
                    progress.UpdatedDate = DateTime.UtcNow;

                    _unitOfWork.GetRepository<LessonProgress>().Update(progress);
                    await _unitOfWork.SaveChangesAsync();

                    // Genel ilerlemeyi güncelle
                    await UpdateEnrollmentProgressAsync(enrollmentId);
                }
            }
        }

        public async Task<double> GetProgressPercentageAsync(int enrollmentId)
        {
            var enrollment = await GetEnrollmentByIdAsync(enrollmentId);

            if (enrollment.Status == EnrollmentStatus.Completed)
                return 100;

            var course = await _courseService.GetCourseByIdAsync(enrollment.CourseId);

            if (course.TotalLessons == 0)
                return 0;

            var completedLessons = await _unitOfWork.GetRepository<LessonProgress>()
                .CountAsync(lp => lp.EnrollmentId == enrollmentId && lp.IsCompleted && !lp.IsDeleted);

            return Math.Round((double)completedLessons / course.TotalLessons * 100, 2);
        }

        private async Task UpdateEnrollmentProgressAsync(int enrollmentId)
        {
            var enrollment = await GetEnrollmentByIdAsync(enrollmentId);
            var progress = await GetProgressPercentageAsync(enrollmentId);

            enrollment.ProgressPercentage = progress;
            enrollment.LastActivityDate = DateTime.UtcNow;
            enrollment.UpdatedDate = DateTime.UtcNow;

            _unitOfWork.GetRepository<Enrollment>().Update(enrollment);
            await _unitOfWork.SaveChangesAsync();

            // Eğer %100 tamamlandıysa otomatik tamamla
            if (progress == 100 && enrollment.Status != EnrollmentStatus.Completed)
            {
                await CompleteEnrollmentAsync(enrollmentId);
            }
        }
    }
}
