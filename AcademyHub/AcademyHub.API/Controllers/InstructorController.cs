using AcademyHub.Application.DTOs.Instructor;
using AcademyHub.Core.Entities;
using AcademyHub.Core.Enums;
using AcademyHub.Core.Exceptions;
using AcademyHub.Core.Interfaces;
using AcademyHub.Core.Interfaces.Services;
using AcademyHub.Infrastructure.Services;
using AutoMapper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.IO;
using System.Security.Claims;
using System.Threading.Tasks;

namespace AcademyHub.API.Controllers
{
    [Route("api/v1/[controller]")]
    [ApiController]
    [Authorize(Roles = "Instructor,Admin")]
    public class InstructorController : ControllerBase
    {
        private readonly IInstructorService _instructorService;
        private readonly IUnitOfWork _unitOfWork;
        private readonly IMapper _mapper;
        private readonly ILogger<InstructorController> _logger;
        private readonly ICourseService _courseService;
        private readonly IEnrollmentService _enrollmentService;
        private readonly IStatsService _statsService;
        private readonly IPaymentService _paymentService;


        public InstructorController(
            IInstructorService instructorService,
            IUnitOfWork unitOfWork,
            IMapper mapper,
            ILogger<InstructorController> logger,
            ICourseService courseService,
            IEnrollmentService enrollmentService,
            IStatsService statsService,
             IPaymentService paymentService)
        {
            _instructorService = instructorService;
            _unitOfWork = unitOfWork;
            _mapper = mapper;
            _logger = logger;
            _courseService = courseService;
            _enrollmentService = enrollmentService;
            _statsService = statsService;
            _paymentService = paymentService;
        }

        [HttpGet("profile")]
        public async Task<IActionResult> GetProfile()
        {
            try
            {
                var userId = GetUserId();
                if (userId == 0)
                    return Unauthorized(new { success = false, message = "Geçersiz kullanıcı" });

                var instructor = await _instructorService.GetInstructorByUserIdAsync(userId);

                if (instructor == null)
                    return NotFound(new { success = false, message = "Eğitmen bulunamadı" });

                var response = _mapper.Map<InstructorResponseDto>(instructor);

                var user = await _unitOfWork.GetRepository<User>().GetByIdAsync(userId);
                if (user != null)
                {
                    response.Email = user.Email;
                    response.PhoneNumber = user.PhoneNumber;
                    response.Address = user.Address;
                }

                return Ok(new { success = true, data = response });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Profil yüklenirken hata oluştu");
                return StatusCode(500, new { success = false, message = "Profil yüklenirken bir hata oluştu" });
            }
        }

        [HttpPut("profile")]
        public async Task<IActionResult> UpdateProfile([FromBody] UpdateInstructorDto request)
        {
            try
            {
                var userId = GetUserId();
                if (userId == 0)
                    return Unauthorized(new { success = false, message = "Geçersiz kullanıcı" });

                var instructor = await _instructorService.UpdateProfileAsync(
                    userId,
                    request.FirstName ?? "",
                    request.LastName ?? "",
                    request.Bio,
                    request.Expertise,
                    request.PhoneNumber,
                    request.Address
                );

                var response = _mapper.Map<InstructorResponseDto>(instructor);

                var user = await _unitOfWork.GetRepository<User>().GetByIdAsync(userId);
                if (user != null)
                {
                    response.Email = user.Email;
                    response.PhoneNumber = user.PhoneNumber;
                    response.Address = user.Address;
                }

                return Ok(new
                {
                    success = true,
                    data = response,
                    message = "Profil başarıyla güncellendi"
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
                _logger.LogError(ex, "Profil güncellenirken hata oluştu");
                return StatusCode(500, new { success = false, message = "Profil güncellenirken bir hata oluştu" });
            }
        }

        // ============ PROFİL RESMİ YÜKLE ============
        [HttpPost("profile-image")]
        [Consumes("multipart/form-data")]
        public async Task<IActionResult> UploadProfileImage([FromForm] ProfileImageUploadDto request)
        {
            try
            {
                var userId = GetUserId();
                if (userId == 0)
                    return Unauthorized(new { success = false, message = "Geçersiz kullanıcı" });

                var file = request.File;

                if (file == null || file.Length == 0)
                    return BadRequest(new { success = false, message = "Dosya seçilmedi" });

                if (file.Length > 5 * 1024 * 1024)
                    return BadRequest(new { success = false, message = "Dosya boyutu 5MB'dan küçük olmalı" });

                var allowedTypes = new[] { "image/jpeg", "image/png", "image/jpg", "image/gif", "image/webp" };
                if (!allowedTypes.Contains(file.ContentType))
                    return BadRequest(new { success = false, message = "Sadece resim dosyaları yüklenebilir" });

                var uploadPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads", "instructors");
                if (!Directory.Exists(uploadPath))
                    Directory.CreateDirectory(uploadPath);

                var extension = Path.GetExtension(file.FileName);
                var fileName = $"{userId}_{DateTime.Now.Ticks}{extension}";
                var filePath = Path.Combine(uploadPath, fileName);

                using (var stream = new FileStream(filePath, FileMode.Create))
                {
                    await file.CopyToAsync(stream);
                }

                var imageUrl = $"/uploads/instructors/{fileName}";

                await _instructorService.UpdateProfileImageAsync(userId, imageUrl);

                return Ok(new
                {
                    success = true,
                    data = new { profileImage = imageUrl },
                    message = "Profil resmi güncellendi"
                });
            }
            catch (NotFoundException ex)
            {
                return NotFound(new { success = false, message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Profil resmi yüklenirken hata oluştu");
                return StatusCode(500, new { success = false, message = "Profil resmi yüklenirken bir hata oluştu" });
            }
        }



        [HttpDelete("profile-image")]
        public async Task<IActionResult> RemoveProfileImage()
        {
            try
            {
                var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");

                var instructor = await _instructorService.GetInstructorByUserIdAsync(userId);
                if (instructor == null)
                    return NotFound(new { success = false, message = "Eğitmen bulunamadı" });

                //  wwwroot'dan resmi sil
                if (!string.IsNullOrEmpty(instructor.ProfileImage))
                {
                    var filePath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", instructor.ProfileImage.TrimStart('/'));
                    if (System.IO.File.Exists(filePath))
                    {
                        System.IO.File.Delete(filePath);
                        Console.WriteLine($"📸 Resim silindi: {filePath}");
                    }
                }

                // Veritabanından resim URL'sini kaldır
                await _instructorService.RemoveProfileImageAsync(userId);

                return Ok(new { success = true, message = "Profil resmi kaldırıldı" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Profil resmi kaldırılırken hata oluştu");
                return StatusCode(500, new { success = false, message = "Resim kaldırılırken bir hata oluştu" });
            }
        }

        [HttpGet("stats")]
        public async Task<IActionResult> GetStats()
        {
            try
            {
                var userId = GetUserId();
                if (userId == 0)
                    return Unauthorized(new { success = false, message = "Geçersiz kullanıcı" });

                var instructor = await _instructorService.GetInstructorByUserIdAsync(userId);

                if (instructor == null)
                    return NotFound(new { success = false, message = "Eğitmen bulunamadı" });

              
                var stats = await _statsService.GetInstructorStatsAsync(instructor.Id);

         
                Console.WriteLine($"📊 Stats - TotalCourses: {stats.TotalCourses}, TotalRevenue: {stats.TotalRevenue}, RevenueByCurrency Count: {stats.RevenueByCurrency?.Count ?? 0}");

                return Ok(new { success = true, data = stats });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "İstatistikler alınırken hata oluştu");
                return StatusCode(500, new { success = false, message = "İstatistikler alınırken bir hata oluştu" });
            }
        }

        private int GetUserId()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return int.TryParse(userIdClaim, out int userId) ? userId : 0;
        }


        // ============ GET: api/v1/instructor/students ============
        [HttpGet("students")]
        [Authorize(Roles = "Instructor,Admin")]
        public async Task<IActionResult> GetInstructorStudents()
        {
            try
            {
                var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
                Console.WriteLine($"🔍 Öğrenci listesi isteği - UserId: {userId}");

                var instructor = await _instructorService.GetInstructorByUserIdAsync(userId);
                if (instructor == null)
                {
                    Console.WriteLine($"❌ Eğitmen bulunamadı - UserId: {userId}");
                    return NotFound(new { success = false, message = "Eğitmen bulunamadı" });
                }

                Console.WriteLine($"✅ Eğitmen bulundu - InstructorId: {instructor.Id}");

                // Eğitmenin kurslarını al
                var courses = await _courseService.GetCoursesByInstructorAsync(instructor.Id);
                var courseIds = courses.Select(c => c.Id).ToList();

                Console.WriteLine($"📚 Eğitmenin kursları: {courseIds.Count} adet");

                if (!courseIds.Any())
                    return Ok(new { success = true, data = new List<object>() });

                //  Bu kurslara kayıtlı öğrencileri al (tek tek)
                var enrollments = new List<Enrollment>();
                foreach (var courseId in courseIds)
                {
                    var courseEnrollments = await _enrollmentService.GetEnrollmentsByCourseAsync(courseId);
                    enrollments.AddRange(courseEnrollments);
                }

                Console.WriteLine($"📊 Toplam enrollment: {enrollments.Count}");

                // Öğrenci bilgilerini doldur
                var studentList = new List<object>();
                foreach (var enrollment in enrollments)
                {
                    var student = await _unitOfWork.GetRepository<Student>()
                        .SingleOrDefaultAsync(s => s.Id == enrollment.StudentId && !s.IsDeleted);

                    if (student != null)
                    {
                        var user = await _unitOfWork.GetRepository<User>()
                            .SingleOrDefaultAsync(u => u.Id == student.UserId && !u.IsDeleted);

                        var course = courses.FirstOrDefault(c => c.Id == enrollment.CourseId);

                        studentList.Add(new
                        {
                            id = student.Id,
                            firstName = student.FirstName,
                            lastName = student.LastName,
                            email = user?.Email,
                            courseTitle = course?.Title,
                            progressPercentage = enrollment.ProgressPercentage,
                            isCompleted = enrollment.Status == EnrollmentStatus.Completed
                        });
                    }
                }

                Console.WriteLine($"✅ {studentList.Count} öğrenci bulundu");

                return Ok(new { success = true, data = studentList });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ Hata: {ex.Message}");
                _logger.LogError(ex, "Öğrenci listesi alınırken hata oluştu");
                return StatusCode(500, new { success = false, message = "Öğrenciler listelenirken bir hata oluştu" });
            }
        }

        // ============ GET: api/v1/instructor/earnings/by-currency ============
        [HttpGet("earnings/by-currency")]
        public async Task<IActionResult> GetEarningsByCurrency()
        {
            try
            {
                var userId = GetUserId();
                if (userId == 0)
                    return Unauthorized(new { success = false, message = "Geçersiz kullanıcı" });

                var instructor = await _instructorService.GetInstructorByUserIdAsync(userId);
                if (instructor == null)
                    return NotFound(new { success = false, message = "Eğitmen bulunamadı" });

                //  PaymentService'ten para birimi bazında kazançları al
                var earnings = await _paymentService.GetInstructorEarningsByCurrencyAsync(instructor.Id);

                Console.WriteLine($"💰 Para birimi bazında kazançlar: {System.Text.Json.JsonSerializer.Serialize(earnings)}");

                return Ok(new { success = true, data = earnings });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Para birimi bazında kazançlar alınırken hata oluştu");
                return StatusCode(500, new { success = false, message = "Kazançlar alınırken bir hata oluştu" });
            }
        }

    }


    public class ProfileImageUploadDto
    {
        public IFormFile File { get; set; } = null!;
    }
}