using AcademyHub.Core.Entities;
using AcademyHub.Core.Exceptions;
using AcademyHub.Core.Interfaces;
using AcademyHub.Core.Interfaces.Services;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AcademyHub.Infrastructure.Services
{
    public class LessonService: ILessonService
    {
        private readonly IUnitOfWork _unitOfWork;

        public LessonService(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }

        public async Task<Lesson> GetLessonByIdAsync(int id)
        {
            var lesson = await _unitOfWork.GetRepository<Lesson>()
                .SingleOrDefaultAsync(l => l.Id == id && !l.IsDeleted);

            if (lesson == null)
                throw new NotFoundException($"ID {id} olan ders bulunamadı");

            return lesson;
        }

        public async Task<IEnumerable<Lesson>> GetLessonsByCourseIdAsync(int courseId)
        {
            return await _unitOfWork.GetRepository<Lesson>()
                .FindAsync(l => l.CourseId == courseId && !l.IsDeleted);
        }

        public async Task<Lesson> CreateLessonAsync(Lesson lesson)
        {
            // Kurs kontrolü
            var course = await _unitOfWork.GetRepository<Course>()
                .GetByIdAsync(lesson.CourseId);

            if (course == null || course.IsDeleted)
                throw new NotFoundException("Geçerli bir kurs bulunamadı");

            // Aynı kurs içinde aynı sırada ders var mı kontrol et
            var existingLesson = await _unitOfWork.GetRepository<Lesson>()
                .SingleOrDefaultAsync(l => l.CourseId == lesson.CourseId && l.Order == lesson.Order && !l.IsDeleted);

            if (existingLesson != null)
                throw new BusinessRuleException($"Bu sırada ({lesson.Order}) bir ders zaten mevcut");

            lesson.CreatedDate = DateTime.UtcNow;

            await _unitOfWork.GetRepository<Lesson>().AddAsync(lesson);
            await _unitOfWork.SaveChangesAsync();

            // Kursun toplam ders sayısını ve süresini güncelle
            await UpdateCourseStats(lesson.CourseId);

            return lesson;
        }

        public async Task<Lesson> UpdateLessonAsync(Lesson lesson)
        {
            var existingLesson = await GetLessonByIdAsync(lesson.Id);

            // Sıra değişikliği varsa kontrol et
            if (existingLesson.Order != lesson.Order)
            {
                var conflictLesson = await _unitOfWork.GetRepository<Lesson>()
                    .SingleOrDefaultAsync(l => l.CourseId == lesson.CourseId && l.Order == lesson.Order && l.Id != lesson.Id && !l.IsDeleted);

                if (conflictLesson != null)
                    throw new BusinessRuleException($"Bu sırada ({lesson.Order}) bir ders zaten mevcut");
            }

            existingLesson.Title = lesson.Title;
            existingLesson.Description = lesson.Description;
            existingLesson.VideoUrl = lesson.VideoUrl;
            existingLesson.VideoDuration = lesson.VideoDuration;
            existingLesson.Order = lesson.Order;
            existingLesson.IsPreview = lesson.IsPreview;
            existingLesson.ResourceUrl = lesson.ResourceUrl;
            existingLesson.ResourceFileName = lesson.ResourceFileName;
            existingLesson.UpdatedDate = DateTime.UtcNow;

            _unitOfWork.GetRepository<Lesson>().Update(existingLesson);
            await _unitOfWork.SaveChangesAsync();

            // Kursun toplam ders sayısını ve süresini güncelle
            await UpdateCourseStats(lesson.CourseId);

            return existingLesson;
        }

        public async Task DeleteLessonAsync(int id)
        {
            var lesson = await GetLessonByIdAsync(id);
            var courseId = lesson.CourseId;

            lesson.IsDeleted = true;
            lesson.UpdatedDate = DateTime.UtcNow;

            _unitOfWork.GetRepository<Lesson>().Update(lesson);
            await _unitOfWork.SaveChangesAsync();

            // Kursun toplam ders sayısını ve süresini güncelle
            await UpdateCourseStats(courseId);
        }

        public async Task<bool> LessonExistsAsync(int id)
        {
            return await _unitOfWork.GetRepository<Lesson>()
                .AnyAsync(l => l.Id == id && !l.IsDeleted);
        }

        public async Task<int> GetLessonCountByCourseIdAsync(int courseId)
        {
            return await _unitOfWork.GetRepository<Lesson>()
                .CountAsync(l => l.CourseId == courseId && !l.IsDeleted);
        }

        public async Task ReorderLessonsAsync(int courseId, Dictionary<int, int> lessonOrders)
        {
            var course = await _unitOfWork.GetRepository<Course>()
                .GetByIdAsync(courseId);

            if (course == null || course.IsDeleted)
                throw new NotFoundException("Geçerli bir kurs bulunamadı");

            foreach (var lessonOrder in lessonOrders)
            {
                var lesson = await GetLessonByIdAsync(lessonOrder.Key);

                if (lesson.CourseId != courseId)
                    throw new BusinessRuleException($"Ders ({lessonOrder.Key}) bu kursa ait değil");

                lesson.Order = lessonOrder.Value;
                lesson.UpdatedDate = DateTime.UtcNow;

                _unitOfWork.GetRepository<Lesson>().Update(lesson);
            }

            await _unitOfWork.SaveChangesAsync();
        }

        private async Task UpdateCourseStats(int courseId)
        {
            var course = await _unitOfWork.GetRepository<Course>()
                .GetByIdAsync(courseId);

            if (course == null || course.IsDeleted)
                return;

            var lessons = await _unitOfWork.GetRepository<Lesson>()
                .FindAsync(l => l.CourseId == courseId && !l.IsDeleted);

            course.TotalLessons = lessons.Count();

            // Toplam süreyi hesapla (VideoDuration "HH:MM:SS" veya "MM:SS" formatında)
            int totalMinutes = 0;
            foreach (var lesson in lessons)
            {
                if (!string.IsNullOrEmpty(lesson.VideoDuration))
                {
                    var durationParts = lesson.VideoDuration.Split(':');
                    if (durationParts.Length == 2)
                    {
                        totalMinutes += int.Parse(durationParts[0]) * 60 + int.Parse(durationParts[1]);
                    }
                    else if (durationParts.Length == 3)
                    {
                        totalMinutes += int.Parse(durationParts[0]) * 3600 + int.Parse(durationParts[1]) * 60 + int.Parse(durationParts[2]);
                    }
                }
            }

            course.TotalDurationInMinutes = totalMinutes;
            course.UpdatedDate = DateTime.UtcNow;

            _unitOfWork.GetRepository<Course>().Update(course);
            await _unitOfWork.SaveChangesAsync();
        }
    }
}
