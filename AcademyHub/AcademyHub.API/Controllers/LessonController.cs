using AcademyHub.Application.DTOs.Lesson;
using AcademyHub.Core.Entities;
using AcademyHub.Core.Exceptions;
using AcademyHub.Core.Interfaces;
using AcademyHub.Core.Interfaces.Services;
using AutoMapper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace AcademyHub.API.Controllers
{
    [Route("api/v1/[controller]")]
    [ApiController]
    [Authorize]
    public class LessonController : ControllerBase
    {
        private readonly ILessonService _lessonService;
        private readonly ICourseService _courseService;
        private readonly IMapper _mapper;
        private readonly ILogger<LessonController> _logger;
        private readonly IUnitOfWork _unitOfWork;

        public LessonController(
            ILessonService lessonService,
            ICourseService courseService,
            IMapper mapper,
            ILogger<LessonController> logger,
             IUnitOfWork unitOfWork)
        {
            _lessonService = lessonService;
            _courseService = courseService;
            _mapper = mapper;
            _logger = logger;
            _unitOfWork = unitOfWork;
        }

        // ============ GET: api/v1/lesson/course/{courseId} ============
        [HttpGet("course/{courseId}")]
        [AllowAnonymous]
        public async Task<ActionResult<IEnumerable<LessonResponseDto>>> GetLessonsByCourse(int courseId)
        {
            try
            {
                var course = await _courseService.GetCourseByIdAsync(courseId);

                if (!course.IsPublished)
                {
                    // Yayınlanmamış kursun derslerini sadece eğitmen ve admin görebilir
                    var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
                    var userRole = User.FindFirst(ClaimTypes.Role)?.Value;

                    if (userRole != "Admin" && userRole != "Instructor" && course.InstructorId != userId)
                        return Forbid();
                }

                var lessons = await _lessonService.GetLessonsByCourseIdAsync(courseId);
                var response = _mapper.Map<IEnumerable<LessonResponseDto>>(lessons.OrderBy(l => l.Order));

                return Ok(new { success = true, data = response });
            }
            catch (NotFoundException ex)
            {
                return NotFound(new { success = false, message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Dersler listelenirken hata oluştu - CourseId: {courseId}");
                return StatusCode(500, new { success = false, message = "Dersler listelenirken bir hata oluştu" });
            }
        }

        // ============ GET: api/v1/lesson/{id} ============
        [HttpGet("{id}")]
        [AllowAnonymous]
        public async Task<ActionResult<LessonResponseDto>> GetLesson(int id)
        {
            try
            {
                var lesson = await _lessonService.GetLessonByIdAsync(id);
                var course = await _courseService.GetCourseByIdAsync(lesson.CourseId);

                // Yayınlanmamış kursun dersini sadece eğitmen ve admin görebilir
                if (!course.IsPublished && !lesson.IsPreview)
                {
                    var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
                    var userRole = User.FindFirst(ClaimTypes.Role)?.Value;

                    if (userRole != "Admin" && userRole != "Instructor" && course.InstructorId != userId)
                        return Forbid();
                }

                var response = _mapper.Map<LessonResponseDto>(lesson);
                return Ok(new { success = true, data = response });
            }
            catch (NotFoundException ex)
            {
                return NotFound(new { success = false, message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Ders detayı alınırken hata oluştu - ID: {id}");
                return StatusCode(500, new { success = false, message = "Ders detayı alınırken bir hata oluştu" });
            }
        }

        // ============ POST: api/v1/lesson ============
        // LessonController.cs - CreateLesson
        [HttpPost]
        [Authorize(Roles = "Instructor,Admin")]
        public async Task<ActionResult<LessonResponseDto>> CreateLesson([FromBody] CreateLessonDto request)
        {
            try
            {
                var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
                var userRole = User.FindFirst(ClaimTypes.Role)?.Value;

                var course = await _courseService.GetCourseByIdAsync(request.CourseId);

              
                var instructor = await _unitOfWork.GetRepository<Instructor>()
                    .SingleOrDefaultAsync(i => i.UserId == userId && !i.IsDeleted);

                if (instructor == null)
                    return BadRequest(new { success = false, message = "Eğitmen profili bulunamadı!" });

           
                if (userRole != "Admin" && course.InstructorId != instructor.Id)
                    return Forbid();

                if (course.IsPublished)
                    return BadRequest(new { success = false, message = "Yayınlanmış bir kursa ders eklenemez" });

                var lesson = _mapper.Map<Lesson>(request);
                var createdLesson = await _lessonService.CreateLessonAsync(lesson);
                var response = _mapper.Map<LessonResponseDto>(createdLesson);

                _logger.LogInformation($"Yeni ders oluşturuldu - ID: {createdLesson.Id}");
                return CreatedAtAction(nameof(GetLesson), new { id = createdLesson.Id }, new { success = true, data = response });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Ders oluşturulurken hata oluştu");
                return StatusCode(500, new { success = false, message = "Ders oluşturulurken bir hata oluştu" });
            }
        }

        // ============ PUT: api/v1/lesson/{id} ============
        [HttpPut("{id}")]
        [Authorize(Roles = "Instructor,Admin")]
        public async Task<ActionResult<LessonResponseDto>> UpdateLesson(int id, [FromBody] UpdateLessonDto request)
        {
            try
            {
                var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
                var userRole = User.FindFirst(ClaimTypes.Role)?.Value;

          
                var instructor = await _unitOfWork.GetRepository<Instructor>()
                    .SingleOrDefaultAsync(i => i.UserId == userId && !i.IsDeleted);

                if (instructor == null && userRole != "Admin")
                {
                    return BadRequest(new { success = false, message = "Eğitmen profili bulunamadı!" });
                }

                var existingLesson = await _lessonService.GetLessonByIdAsync(id);
                var course = await _courseService.GetCourseByIdAsync(existingLesson.CourseId);

            
                if (userRole != "Admin")
                {
                    if (course.InstructorId != instructor.Id)
                    {
                        _logger.LogWarning($"⚠️ Yetkisiz ders güncelleme girişimi - UserId: {userId}, LessonId: {id}");
                        return Forbid("Bu kursa ait dersi güncelleme yetkiniz yok!");
                    }
                }

                // Yayınlanmış kursun dersi güncellenemez
                if (course.IsPublished)
                    return BadRequest(new { success = false, message = "Yayınlanmış bir kursun dersi güncellenemez" });

                var lesson = _mapper.Map(request, existingLesson);
                lesson.Id = id;
                lesson.CourseId = existingLesson.CourseId;

                var updatedLesson = await _lessonService.UpdateLessonAsync(lesson);
                var response = _mapper.Map<LessonResponseDto>(updatedLesson);

                _logger.LogInformation($"✅ Ders güncellendi - ID: {id}, Başlık: {updatedLesson.Title}");
                return Ok(new { success = true, data = response });
            }
            catch (NotFoundException ex)
            {
                return NotFound(new { success = false, message = ex.Message });
            }
            catch (BusinessRuleException ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Ders güncellenirken hata oluştu - ID: {id}");
                return StatusCode(500, new { success = false, message = "Ders güncellenirken bir hata oluştu" });
            }
        }

        // ============ DELETE: api/v1/lesson/{id} ============
        [HttpDelete("{id}")]
        [Authorize(Roles = "Instructor,Admin")]
        public async Task<IActionResult> DeleteLesson(int id)
        {
            try
            {
                var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
                var userRole = User.FindFirst(ClaimTypes.Role)?.Value;

        
                var instructor = await _unitOfWork.GetRepository<Instructor>()
                    .SingleOrDefaultAsync(i => i.UserId == userId && !i.IsDeleted);

                if (instructor == null && userRole != "Admin")
                {
                    return BadRequest(new { success = false, message = "Eğitmen profili bulunamadı!" });
                }

                var existingLesson = await _lessonService.GetLessonByIdAsync(id);
                var course = await _courseService.GetCourseByIdAsync(existingLesson.CourseId);

             
                if (userRole != "Admin")
                {
                    if (course.InstructorId != instructor.Id)
                    {
                        _logger.LogWarning($"⚠️ Yetkisiz ders silme girişimi - UserId: {userId}, LessonId: {id}");
                        return Forbid("Bu kursa ait dersi silme yetkiniz yok!");
                    }
                }

                // Yayınlanmış kursun dersi silinemez
                if (course.IsPublished)
                    return BadRequest(new { success = false, message = "Yayınlanmış bir kursun dersi silinemez!" });

                await _lessonService.DeleteLessonAsync(id);

                _logger.LogInformation($"✅ Ders silindi - ID: {id}");
                return Ok(new { success = true, message = "Ders başarıyla silindi" });
            }
            catch (NotFoundException ex)
            {
                return NotFound(new { success = false, message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Ders silinirken hata oluştu - ID: {id}");
                return StatusCode(500, new { success = false, message = "Ders silinirken bir hata oluştu" });
            }
        }

        // ============ POST: api/v1/lesson/reorder ============
        [HttpPost("reorder")]
        [Authorize(Roles = "Instructor,Admin")]
        public async Task<IActionResult> ReorderLessons([FromBody] ReorderLessonsDto request)
        {
            try
            {
                var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
                var userRole = User.FindFirst(ClaimTypes.Role)?.Value;

                var course = await _courseService.GetCourseByIdAsync(request.CourseId);

                // Yetki kontrolü
                if (userRole != "Admin" && course.InstructorId != userId)
                    return Forbid();

                // Yayınlanmış kursun ders sırası değiştirilemez
                if (course.IsPublished)
                    return BadRequest(new { success = false, message = "Yayınlanmış bir kursun ders sırası değiştirilemez" });

                await _lessonService.ReorderLessonsAsync(request.CourseId, request.LessonOrders);

                _logger.LogInformation($"Ders sıraları güncellendi - CourseId: {request.CourseId}");
                return Ok(new { success = true, message = "Ders sıraları başarıyla güncellendi" });
            }
            catch (NotFoundException ex)
            {
                return NotFound(new { success = false, message = ex.Message });
            }
            catch (BusinessRuleException ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Ders sıraları güncellenirken hata oluştu");
                return StatusCode(500, new { success = false, message = "Ders sıraları güncellenirken bir hata oluştu" });
            }
        }
    }
}
