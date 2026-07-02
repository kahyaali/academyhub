using AcademyHub.Application.DTOs.Enrollment;
using AcademyHub.Core.Entities;
using AcademyHub.Core.Enums;
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
    public class EnrollmentController : ControllerBase
    {
        private readonly IEnrollmentService _enrollmentService;
        private readonly ICourseService _courseService;
        private readonly ILessonService _lessonService;
        private readonly IMapper _mapper;
        private readonly ILogger<EnrollmentController> _logger;
        private readonly IUnitOfWork _unitOfWork;  

        public EnrollmentController(
            IEnrollmentService enrollmentService,
            ICourseService courseService,
            ILessonService lessonService,
            IMapper mapper,
            ILogger<EnrollmentController> logger,
            IUnitOfWork unitOfWork)  
        {
            _enrollmentService = enrollmentService;
            _courseService = courseService;
            _lessonService = lessonService;
            _mapper = mapper;
            _logger = logger;
            _unitOfWork = unitOfWork;  
        }

        // ============ GET: api/v1/enrollment/student ============
        [HttpGet("student")]
        public async Task<ActionResult<IEnumerable<EnrollmentResponseDto>>> GetMyEnrollments()
        {
            try
            {
                var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");

                // Student'ı bul 
                var student = await _unitOfWork.GetRepository<Student>()
                    .SingleOrDefaultAsync(s => s.UserId == userId && !s.IsDeleted);

                if (student == null)
                {
                    _logger.LogWarning($"Student not found for UserId: {userId}");
                    return Ok(new { success = true, data = new List<EnrollmentResponseDto>() });
                }

                var enrollments = await _enrollmentService.GetEnrollmentsByStudentAsync(student.Id);
                var response = _mapper.Map<IEnumerable<EnrollmentResponseDto>>(enrollments);

                return Ok(new { success = true, data = response });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Kayıtlar listelenirken hata oluştu");
                return StatusCode(500, new { success = false, message = "Kayıtlar listelenirken bir hata oluştu" });
            }
        }


        // ============ GET: api/v1/enrollment/check/{courseId} ============
        [HttpGet("check/{courseId}")]
        public async Task<IActionResult> CheckEnrollment(int courseId)
        {
            try
            {
                var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");

                if (userId == 0)
                    return Unauthorized(new { success = false, message = "Geçersiz kullanıcı" });

                Console.WriteLine($"🔍 CheckEnrollment - UserId: {userId}, CourseId: {courseId}");

                //  Student'ı bul
                var student = await _unitOfWork.GetRepository<Student>()
                    .FirstOrDefaultAsync(s => s.UserId == userId && !s.IsDeleted);

                if (student == null)
                {
                    Console.WriteLine($"❌ Öğrenci bulunamadı - UserId: {userId}");
             
                    return Ok(new
                    {
                        success = true,
                        data = new { isEnrolled = false }
                    });
                }

                Console.WriteLine($"✅ Öğrenci bulundu - StudentId: {student.Id}");

                //  Tüm kayıtları kontrol et (silinmemiş)
                var enrollments = await _unitOfWork.GetRepository<Enrollment>()
                    .FindAsync(e => e.StudentId == student.Id && e.CourseId == courseId && !e.IsDeleted);

                Console.WriteLine($"📝 Bulunan kayıt sayısı: {enrollments.Count()}");

                foreach (var e in enrollments)
                {
                    Console.WriteLine($"   - EnrollmentId: {e.Id}, Status: {e.Status}, StatusName: {e.Status}");
                }

                //  Sadece Active (1) veya Completed (2) kontrol et
                var isEnrolled = enrollments.Any(e => e.Status == EnrollmentStatus.Active || e.Status == EnrollmentStatus.Completed);

                Console.WriteLine($"✅ isEnrolled: {isEnrolled}");

             
                return Ok(new
                {
                    success = true,
                    data = new
                    {
                        isEnrolled = isEnrolled,
                        enrollmentId = enrollments.FirstOrDefault()?.Id,
                        status = enrollments.FirstOrDefault()?.Status
                    }
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ HATA: {ex.Message}");
                _logger.LogError(ex, $"Kayıt kontrolü yapılırken hata oluştu - CourseId: {courseId}");

    
                return Ok(new
                {
                    success = false,
                    message = "Kayıt kontrolü yapılırken bir hata oluştu",
                    data = new { isEnrolled = false }
                });
            }
        }



        // ============ GET: api/v1/enrollment/student/{studentId} ============
        [HttpGet("student/{studentId}")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<IEnumerable<EnrollmentResponseDto>>> GetEnrollmentsByStudent(int studentId)
        {
            try
            {
                var enrollments = await _enrollmentService.GetEnrollmentsByStudentAsync(studentId);
                var response = _mapper.Map<IEnumerable<EnrollmentResponseDto>>(enrollments);

                return Ok(new { success = true, data = response });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Öğrenci kayıtları listelenirken hata oluştu - StudentId: {studentId}");
                return StatusCode(500, new { success = false, message = "Kayıtlar listelenirken bir hata oluştu" });
            }
        }

        // ============ GET: api/v1/enrollment/course/{courseId} ============
        [HttpGet("course/{courseId}")]
        [Authorize(Roles = "Instructor,Admin")]
        public async Task<ActionResult<IEnumerable<EnrollmentResponseDto>>> GetEnrollmentsByCourse(int courseId)
        {
            try
            {
                var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
                var userRole = User.FindFirst(ClaimTypes.Role)?.Value;

                var course = await _courseService.GetCourseByIdAsync(courseId);

                if (userRole != "Admin" && course.InstructorId != userId)
                    return Forbid();

                var enrollments = await _enrollmentService.GetEnrollmentsByCourseAsync(courseId);
                var response = _mapper.Map<IEnumerable<EnrollmentResponseDto>>(enrollments);

                return Ok(new { success = true, data = response });
            }
            catch (NotFoundException ex)
            {
                return NotFound(new { success = false, message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Kurs kayıtları listelenirken hata oluştu - CourseId: {courseId}");
                return StatusCode(500, new { success = false, message = "Kayıtlar listelenirken bir hata oluştu" });
            }
        }

        // ============ GET: api/v1/enrollment/{id} ============
        [HttpGet("{id}")]
        public async Task<ActionResult<EnrollmentResponseDto>> GetEnrollment(int id)
        {
            try
            {
                var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
                var userRole = User.FindFirst(ClaimTypes.Role)?.Value;

                var enrollment = await _enrollmentService.GetEnrollmentByIdAsync(id);
                var course = await _courseService.GetCourseByIdAsync(enrollment.CourseId);

              
                if (userRole != "Admin")
                {
                    // Öğrenci mi kontrol et
                    var student = await _unitOfWork.GetRepository<Student>()
                        .SingleOrDefaultAsync(s => s.UserId == userId && !s.IsDeleted);

                    if (student == null || enrollment.StudentId != student.Id)
                    {
                        // Eğitmen mi kontrol et (kursun sahibi)
                        if (course.InstructorId != userId)
                            return Forbid();
                    }
                }

                var response = _mapper.Map<EnrollmentResponseDto>(enrollment);
                return Ok(new { success = true, data = response });
            }
            catch (NotFoundException ex)
            {
                return NotFound(new { success = false, message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Kayıt detayı alınırken hata oluştu - ID: {id}");
                return StatusCode(500, new { success = false, message = "Kayıt detayı alınırken bir hata oluştu" });
            }
        }

        // ============ GET: api/v1/enrollment/{id}/progress ============
        [HttpGet("{id}/progress")]
        public async Task<ActionResult<object>> GetProgress(int id)
        {
            try
            {
                var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
                var userRole = User.FindFirst(ClaimTypes.Role)?.Value;

                var enrollment = await _enrollmentService.GetEnrollmentByIdAsync(id);

           
                if (userRole != "Admin")
                {
                    var student = await _unitOfWork.GetRepository<Student>()
                        .SingleOrDefaultAsync(s => s.UserId == userId && !s.IsDeleted);

                    if (student == null || enrollment.StudentId != student.Id)
                        return Forbid();
                }

                var progress = await _enrollmentService.GetProgressPercentageAsync(id);

                return Ok(new
                {
                    success = true,
                    data = new
                    {
                        enrollmentId = id,
                        progressPercentage = progress,
                        status = enrollment.Status.ToString()
                    }
                });
            }
            catch (NotFoundException ex)
            {
                return NotFound(new { success = false, message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"İlerleme bilgisi alınırken hata oluştu - ID: {id}");
                return StatusCode(500, new { success = false, message = "İlerleme bilgisi alınırken bir hata oluştu" });
            }
        }

        // ============ POST: api/v1/enrollment ============
        [HttpPost]
        public async Task<ActionResult<EnrollmentResponseDto>> CreateEnrollment([FromBody] CreateEnrollmentDto request)
        {
            try
            {
                var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
                var userRole = User.FindFirst(ClaimTypes.Role)?.Value;

                if (userRole != "Admin" && userRole != "Student")
                    return Forbid();

                int studentId = userRole == "Admin" ? request.StudentId : userId;

                var enrollment = await _enrollmentService.CreateEnrollmentAsync(
                    studentId,
                    request.CourseId,
                    request.PaidAmount);

                var response = _mapper.Map<EnrollmentResponseDto>(enrollment);

                _logger.LogInformation($"Yeni kayıt oluşturuldu - ID: {enrollment.Id}, Öğrenci: {studentId}, Kurs: {request.CourseId}");
                return CreatedAtAction(nameof(GetEnrollment), new { id = enrollment.Id }, new { success = true, data = response });
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
                _logger.LogError(ex, "Kayıt oluşturulurken hata oluştu");
                return StatusCode(500, new { success = false, message = "Kayıt oluşturulurken bir hata oluştu" });
            }
        }

        // ============ POST: api/v1/enrollment/{id}/complete ============
        [HttpPost("{id}/complete")]
        public async Task<IActionResult> CompleteEnrollment(int id)
        {
            try
            {
                var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
                var userRole = User.FindFirst(ClaimTypes.Role)?.Value;

                var enrollment = await _enrollmentService.GetEnrollmentByIdAsync(id);

           
                if (userRole != "Admin")
                {
                    var student = await _unitOfWork.GetRepository<Student>()
                        .SingleOrDefaultAsync(s => s.UserId == userId && !s.IsDeleted);

                    if (student == null || enrollment.StudentId != student.Id)
                        return Forbid();
                }

                await _enrollmentService.CompleteEnrollmentAsync(id);

                _logger.LogInformation($"Kayıt tamamlandı - ID: {id}");
                return Ok(new { success = true, message = "Kurs başarıyla tamamlandı" });
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
                _logger.LogError(ex, $"Kayıt tamamlanırken hata oluştu - ID: {id}");
                return StatusCode(500, new { success = false, message = "Kayıt tamamlanırken bir hata oluştu" });
            }
        }

        // ============ POST: api/v1/enrollment/{id}/cancel ============
        [HttpPost("{id}/cancel")]
        public async Task<IActionResult> CancelEnrollment(int id)
        {
            try
            {
                var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
                var userRole = User.FindFirst(ClaimTypes.Role)?.Value;

                var enrollment = await _enrollmentService.GetEnrollmentByIdAsync(id);

          
                if (userRole != "Admin")
                {
                    var student = await _unitOfWork.GetRepository<Student>()
                        .SingleOrDefaultAsync(s => s.UserId == userId && !s.IsDeleted);

                    if (student == null || enrollment.StudentId != student.Id)
                        return Forbid();
                }

                await _enrollmentService.CancelEnrollmentAsync(id);

                _logger.LogInformation($"Kayıt iptal edildi - ID: {id}");
                return Ok(new { success = true, message = "Kayıt başarıyla iptal edildi" });
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
                _logger.LogError(ex, $"Kayıt iptal edilirken hata oluştu - ID: {id}");
                return StatusCode(500, new { success = false, message = "Kayıt iptal edilirken bir hata oluştu" });
            }
        }

        // ============ POST: api/v1/enrollment/progress ============
        [HttpPost("progress")]
        public async Task<IActionResult> UpdateProgress([FromBody] UpdateProgressDto request)
        {
            try
            {
                var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");

           
                var student = await _unitOfWork.GetRepository<Student>()
                    .SingleOrDefaultAsync(s => s.UserId == userId && !s.IsDeleted);

                if (student == null)
                    return Unauthorized(new { success = false, message = "Öğrenci bulunamadı" });

                var enrollment = await _enrollmentService.GetEnrollmentByIdAsync(request.EnrollmentId);

       
                if (enrollment.StudentId != student.Id)
                    return Forbid();

                await _enrollmentService.UpdateProgressAsync(
                    request.EnrollmentId,
                    request.LessonId,
                    request.WatchTimeSeconds);

                var progress = await _enrollmentService.GetProgressPercentageAsync(request.EnrollmentId);

                return Ok(new
                {
                    success = true,
                    message = "İlerleme güncellendi",
                    data = new { progressPercentage = progress }
                });
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
                _logger.LogError(ex, "İlerleme güncellenirken hata oluştu");
                return StatusCode(500, new { success = false, message = "İlerleme güncellenirken bir hata oluştu" });
            }
        }


        // EnrollmentController.cs'ye ekleyinf
        [HttpGet("my-courses")]
        public async Task<ActionResult<IEnumerable<EnrollmentResponseDto>>> GetMyCourses()
        {
            try
            {
                var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");

                // Student'ı bul
                var student = await _unitOfWork.GetRepository<Student>()
                    .SingleOrDefaultAsync(s => s.UserId == userId && !s.IsDeleted);

                if (student == null)
                    return Ok(new { success = true, data = new List<EnrollmentResponseDto>() });

                // Student.Id ile sorgula
                var enrollments = await _enrollmentService.GetEnrollmentsByStudentAsync(student.Id);
                var response = _mapper.Map<IEnumerable<EnrollmentResponseDto>>(enrollments);

                return Ok(new { success = true, data = response });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Kayıtlar listelenirken hata oluştu");
                return StatusCode(500, new { success = false, message = "Kayıtlar listelenirken bir hata oluştu" });
            }
        }
    }
}