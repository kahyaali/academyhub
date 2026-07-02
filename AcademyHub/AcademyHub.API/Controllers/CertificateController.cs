using AcademyHub.Application.DTOs.Certificate;
using AcademyHub.Core.Entities;
using AcademyHub.Core.Exceptions;
using AcademyHub.Core.Interfaces;
using AcademyHub.Core.Interfaces.Services;
using AutoMapper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace AcademyHub.API.Controllers
{
    [Route("api/v1/[controller]")]
    [ApiController]
    [Authorize]
    public class CertificateController : ControllerBase
    {
        private readonly ICertificateService _certificateService;
        private readonly IMapper _mapper;
        private readonly ILogger<CertificateController> _logger;
        private readonly IEnrollmentService _enrollmentService;
        private readonly ICourseService _courseService;
        private readonly IUnitOfWork _unitOfWork;  

        public CertificateController(
            ICertificateService certificateService,
            IMapper mapper,
            ILogger<CertificateController> logger,
            IEnrollmentService enrollmentService,
            ICourseService courseService,
            IUnitOfWork unitOfWork)  
        {
            _certificateService = certificateService;
            _mapper = mapper;
            _logger = logger;
            _enrollmentService = enrollmentService;
            _courseService = courseService;
            _unitOfWork = unitOfWork;  
        }

        // ============ GET: api/v1/certificate/me ============
        [HttpGet("me")]
        public async Task<IActionResult> GetMyCertificates()
        {
            try
            {
                var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");

                //  Önce Student'ı bul
                var student = await _unitOfWork.GetRepository<Student>()
                    .SingleOrDefaultAsync(s => s.UserId == userId && !s.IsDeleted);

                if (student == null)
                {
                    _logger.LogWarning($"Student not found for UserId: {userId}");
                    return Ok(new { success = true, data = new List<CertificateResponseDto>() });
                }

                //  Student.Id ile sertifikaları getir 
                var certificates = await _certificateService.GetCertificatesByStudentAsync(student.Id);
                var response = _mapper.Map<IEnumerable<CertificateResponseDto>>(certificates);

                return Ok(new { success = true, data = response });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Sertifikalar listelenirken hata oluştu");
                return StatusCode(500, new { success = false, message = "Sertifikalar listelenirken bir hata oluştu" });
            }
        }

        // ============ GET: api/v1/certificate/instructor ============
        [HttpGet("instructor")]
        [Authorize(Roles = "Instructor,Admin")]
        public async Task<IActionResult> GetInstructorCertificates()
        {
            try
            {
                var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
                var userRole = User.FindFirst(ClaimTypes.Role)?.Value;

                // Eğitmeni bul
                var instructor = await _unitOfWork.GetRepository<Instructor>()
                    .SingleOrDefaultAsync(i => i.UserId == userId && !i.IsDeleted);

                if (instructor == null && userRole != "Admin")
                    return Unauthorized(new { success = false, message = "Eğitmen bulunamadı" });

                // Eğitmenin kurslarını bul
                var courseIds = new List<int>();

                if (userRole == "Admin")
                {
                    var allCourses = await _courseService.GetAllCoursesAsync();
                    courseIds = allCourses.Select(c => c.Id).ToList();
                }
                else
                {
                    var courses = await _courseService.GetCoursesByInstructorAsync(instructor.Id);
                    courseIds = courses.Select(c => c.Id).ToList();
                }

                // Bu kurslara ait sertifikaları bul
                var certificates = new List<Certificate>();
                foreach (var courseId in courseIds)
                {
                    var courseCerts = await _certificateService.GetCertificatesByCourseAsync(courseId);
                    certificates.AddRange(courseCerts);
                }

                var response = _mapper.Map<IEnumerable<CertificateResponseDto>>(certificates);

                return Ok(new { success = true, data = response });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Eğitmen sertifikaları listelenirken hata oluştu");
                return StatusCode(500, new { success = false, message = "Sertifikalar listelenirken bir hata oluştu" });
            }
        }

        // ============ GET: api/v1/certificate/student/{studentId} ============
        [HttpGet("student/{studentId}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetCertificatesByStudent(int studentId)
        {
            try
            {
                var certificates = await _certificateService.GetCertificatesByStudentAsync(studentId);
                var response = _mapper.Map<IEnumerable<CertificateResponseDto>>(certificates);

                return Ok(new { success = true, data = response });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Öğrenci sertifikaları listelenirken hata oluştu - StudentId: {studentId}");
                return StatusCode(500, new { success = false, message = "Sertifikalar listelenirken bir hata oluştu" });
            }
        }

        // ============ GET: api/v1/certificate/course/{courseId} ============
        [HttpGet("course/{courseId}")]
        public async Task<IActionResult> GetCertificatesByCourse(int courseId)
        {
            try
            {
                var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
                var userRole = User.FindFirst(ClaimTypes.Role)?.Value;

                //  Öğrenci kendi sertifikasını görsün
                if (userRole != "Admin" && userRole != "Instructor")
                {
                    var certificate = await _certificateService.GetCertificateByCourseAndStudentAsync(courseId, userId);

                    if (certificate == null)
                        return NotFound(new { success = false, message = "Bu kurs için sertifika bulunamadı" });

                    var certificateResponse = _mapper.Map<CertificateResponseDto>(certificate);  
                    return Ok(new { success = true, data = certificateResponse });
                }

                // Admin ve Eğitmen tüm sertifikaları görebilir
                if (userRole == "Instructor")
                {
                    var course = await _courseService.GetCourseByIdAsync(courseId);
                    if (course.InstructorId != userId)
                        return Forbid();
                }

                var certificates = await _certificateService.GetCertificatesByCourseAsync(courseId);
                var response = _mapper.Map<IEnumerable<CertificateResponseDto>>(certificates); 
                return Ok(new { success = true, data = response });
            }
            catch (NotFoundException ex)
            {
                return NotFound(new { success = false, message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Sertifika alınırken hata oluştu - CourseId: {courseId}");
                return StatusCode(500, new { success = false, message = "Sertifika alınırken bir hata oluştu" });
            }
        }

        // ============ GET: api/v1/certificate/{id} ============
        [HttpGet("{id}")]
        public async Task<IActionResult> GetCertificate(int id)
        {
            try
            {
                var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
                var userRole = User.FindFirst(ClaimTypes.Role)?.Value;

                var certificate = await _certificateService.GetCertificateByIdAsync(id);

             
                if (userRole != "Admin" && userRole != "Instructor")
                {
                    // Önce Student'ı bul
                    var student = await _unitOfWork.GetRepository<Student>()
                        .SingleOrDefaultAsync(s => s.UserId == userId && !s.IsDeleted);

                    if (student == null || certificate.StudentId != student.Id)
                        return Forbid();
                }

                var response = _mapper.Map<CertificateResponseDto>(certificate);

                return Ok(new { success = true, data = response });
            }
            catch (NotFoundException ex)
            {
                return NotFound(new { success = false, message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Sertifika detayı alınırken hata oluştu - ID: {id}");
                return StatusCode(500, new { success = false, message = "Sertifika detayı alınırken bir hata oluştu" });
            }
        }

        // ============ GET: api/v1/certificate/by-enrollment/{enrollmentId} ============
        [HttpGet("by-enrollment/{enrollmentId}")]
        public async Task<IActionResult> GetCertificateByEnrollment(int enrollmentId)
        {
            try
            {
                var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
                var userRole = User.FindFirst(ClaimTypes.Role)?.Value;

                var certificate = await _certificateService.GetCertificateByEnrollmentIdAsync(enrollmentId);

                if (userRole != "Admin" && userRole != "Instructor" && certificate.StudentId != userId)
                    return Forbid();

                var response = _mapper.Map<CertificateResponseDto>(certificate);

                return Ok(new { success = true, data = response });
            }
            catch (NotFoundException ex)
            {
                return NotFound(new { success = false, message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Sertifika detayı alınırken hata oluştu - EnrollmentId: {enrollmentId}");
                return StatusCode(500, new { success = false, message = "Sertifika detayı alınırken bir hata oluştu" });
            }
        }

        // ============ POST: api/v1/certificate/generate/{enrollmentId} ============
        [HttpPost("generate/{enrollmentId}")]
        [Authorize(Roles = "Instructor,Admin")]
        public async Task<IActionResult> GenerateCertificate(int enrollmentId)
        {
            try
            {
                var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
                var userRole = User.FindFirst(ClaimTypes.Role)?.Value;

                var enrollment = await _enrollmentService.GetEnrollmentByIdAsync(enrollmentId);
                var course = await _courseService.GetCourseByIdAsync(enrollment.CourseId);

                if (userRole != "Admin" && course.InstructorId != userId)
                    return Forbid();

                var certificate = await _certificateService.GenerateCertificateAsync(enrollmentId);
                var response = _mapper.Map<CertificateResponseDto>(certificate);

                _logger.LogInformation($"Sertifika oluşturuldu - ID: {certificate.Id}, Öğrenci: {enrollment.StudentId}, Kurs: {course.Id}");
                return Ok(new { success = true, data = response, message = "Sertifika başarıyla oluşturuldu" });
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
                _logger.LogError(ex, $"Sertifika oluşturulurken hata oluştu - EnrollmentId: {enrollmentId}");
                return StatusCode(500, new { success = false, message = "Sertifika oluşturulurken bir hata oluştu" });
            }
        }

        // ============ POST: api/v1/certificate/generate-pdf/{certificateId} ============
        [HttpPost("generate-pdf/{certificateId}")]
        [Authorize(Roles = "Instructor,Admin")]
        public async Task<IActionResult> GenerateCertificatePdf(int certificateId)
        {
            try
            {
                var pdfUrl = await _certificateService.GenerateCertificatePdfAsync(certificateId);

                return Ok(new { success = true, data = new { pdfUrl }, message = "PDF başarıyla oluşturuldu" });
            }
            catch (NotFoundException ex)
            {
                return NotFound(new { success = false, message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"PDF oluşturulurken hata oluştu - CertificateId: {certificateId}");
                return StatusCode(500, new { success = false, message = "PDF oluşturulurken bir hata oluştu" });
            }
        }

        // ============ POST: api/v1/certificate/verify ============
        [HttpPost("verify")]
        [AllowAnonymous]
        public async Task<IActionResult> VerifyCertificate([FromBody] VerifyCertificateDto request)
        {
            try
            {
                var result = await _certificateService.VerifyCertificateAsync(request.CertificateNumber);

                if (result)
                {
                    return Ok(new { success = true, message = "Sertifika geçerli", data = new { isValid = true } });
                }
                else
                {
                    return Ok(new { success = true, message = "Sertifika geçersiz veya bulunamadı", data = new { isValid = false } });
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Sertifika doğrulanırken hata oluştu - CertificateNumber: {request.CertificateNumber}");
                return StatusCode(500, new { success = false, message = "Sertifika doğrulanırken bir hata oluştu" });
            }
        }

        // ============ DELETE: api/v1/certificate/{id} ============
        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeleteCertificate(int id)
        {
            try
            {
                await _certificateService.DeleteCertificateAsync(id);

                _logger.LogInformation($"Sertifika silindi - ID: {id}");
                return Ok(new { success = true, message = "Sertifika başarıyla silindi" });
            }
            catch (NotFoundException ex)
            {
                return NotFound(new { success = false, message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Sertifika silinirken hata oluştu - ID: {id}");
                return StatusCode(500, new { success = false, message = "Sertifika silinirken bir hata oluştu" });
            }
        }

        [HttpGet("{id}/download")]
        public async Task<IActionResult> DownloadCertificatePdf(int id)
        {
            try
            {
                var pdfBytes = await _certificateService.GenerateCertificatePdfBytesAsync(id);
                var certificate = await _certificateService.GetCertificateByIdAsync(id);
                string fileName = $"Sertifika_{certificate.CertificateNumber}.pdf";
                return File(pdfBytes, "application/pdf", fileName);
            }
            catch (NotFoundException ex)
            {
                return NotFound(new { success = false, message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"PDF indirilirken hata oluştu - CertificateId: {id}");
                return StatusCode(500, new { success = false, message = "PDF indirilirken bir hata oluştu" });
            }
        }
    }
}