


using AcademyHub.Application.DTOs.Common;
using AcademyHub.Application.DTOs.Course;
using AcademyHub.Core.Entities;
using AcademyHub.Core.Enums;
using AcademyHub.Core.Exceptions;
using AcademyHub.Core.Interfaces;
using AcademyHub.Core.Interfaces.Services;
using AcademyHub.Infrastructure.Services;
using AutoMapper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace AcademyHub.API.Controllers
{
    [Route("api/v1/[controller]")]
    [ApiController]
    [Authorize]
    public class CourseController : ControllerBase
    {
        private readonly ICourseService _courseService;
        private readonly IMapper _mapper;
        private readonly ILogger<CourseController> _logger;
        private readonly IUnitOfWork _unitOfWork; 
        private readonly INotificationService _notificationService;

        public CourseController(ICourseService courseService, IMapper mapper, ILogger<CourseController> logger, IUnitOfWork unitOfWork,INotificationService notificationService)
        {
            _courseService = courseService;
            _mapper = mapper;
            _logger = logger;
            _unitOfWork = unitOfWork;  
            _notificationService = notificationService;
        }

        // ============ GET: api/v1/course/instructor ============
        [HttpGet("instructor")]
        [Authorize(Roles = "Instructor,Admin")]
        public async Task<IActionResult> GetInstructorCourses()
        {
            try
            {
                var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
                var userRole = User.FindFirst(ClaimTypes.Role)?.Value;

                if (userRole == "Admin")
                {
                    var allCourses = await _courseService.GetAllCoursesAsync();
                    var response = _mapper.Map<IEnumerable<CourseResponseDto>>(allCourses);

             
                    foreach (var item in response)
                    {
                        item.CurrencySymbol = GetCurrencySymbol(item.Currency);
                        item.FormattedPrice = FormatPrice(item.Price, item.Currency);
                        item.CurrencyCode = item.Currency.ToString();
                    }

                    return Ok(new { success = true, data = response });
                }

                var instructor = await _courseService.GetInstructorByUserIdAsync(userId);

                if (instructor == null)
                {
                    return BadRequest(new
                    {
                        success = false,
                        message = "Eğitmen profili bulunamadı. Lütfen önce eğitmen olarak kaydolun."
                    });
                }

                var courses = await _courseService.GetCoursesByInstructorAsync(instructor.Id);
                var courseDtos = _mapper.Map<IEnumerable<CourseResponseDto>>(courses);

              
                foreach (var item in courseDtos)
                {
                    item.CurrencySymbol = GetCurrencySymbol(item.Currency);
                    item.FormattedPrice = FormatPrice(item.Price, item.Currency);
                    item.CurrencyCode = item.Currency.ToString();
                }

                return Ok(new
                {
                    success = true,
                    data = courseDtos ?? new List<CourseResponseDto>()
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Eğitmen kursları listelenirken hata oluştu");
                return StatusCode(500, new
                {
                    success = false,
                    message = "Kurslar listelenirken bir hata oluştu"
                });
            }
        }

        // ============ GET: api/v1/course/instructor/me ============
        [HttpGet("instructor/me")]
        [Authorize(Roles = "Instructor")]
        public async Task<IActionResult> GetMyCourses()
        {
            try
            {
                var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");

                if (userId == 0)
                {
                    return Unauthorized(new { success = false, message = "Geçersiz kullanıcı" });
                }

                var instructor = await _courseService.GetInstructorByUserIdAsync(userId);

                if (instructor == null)
                {
                    return BadRequest(new
                    {
                        success = false,
                        message = "Eğitmen profili bulunamadı. Lütfen önce eğitmen olarak kaydolun."
                    });
                }

                var courses = await _courseService.GetCoursesByInstructorAsync(instructor.Id);
                var courseDtos = _mapper.Map<IEnumerable<CourseResponseDto>>(courses);

             
                foreach (var item in courseDtos)
                {
                    item.CurrencySymbol = GetCurrencySymbol(item.Currency);
                    item.FormattedPrice = FormatPrice(item.Price, item.Currency);
                    item.CurrencyCode = item.Currency.ToString();
                }

                return Ok(new
                {
                    success = true,
                    data = courseDtos ?? new List<CourseResponseDto>(),
                    count = courseDtos?.Count() ?? 0
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Eğitmen kendi kurslarını listelerken hata oluştu");
                return StatusCode(500, new
                {
                    success = false,
                    message = "Kurslar listelenirken bir hata oluştu",
                    error = ex.Message
                });
            }
        }

        // ============ GET: api/v1/course ============
        [HttpGet]
        [AllowAnonymous]
        public async Task<IActionResult> GetCourses()
        {
            try
            {
                var courses = await _courseService.GetAllCoursesAsync();
                var courseDtos = _mapper.Map<IEnumerable<CourseResponseDto>>(courses);

                
                foreach (var item in courseDtos)
                {
                    item.CurrencySymbol = GetCurrencySymbol(item.Currency);
                    item.FormattedPrice = FormatPrice(item.Price, item.Currency);
                    item.CurrencyCode = item.Currency.ToString();
                }

                return Ok(new { success = true, data = courseDtos });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    success = false,
                    message = ex.Message,
                    stackTrace = ex.StackTrace,
                    innerException = ex.InnerException?.Message
                });
            }
        }

        // ============ GET: api/v1/course/{id} ============
        [HttpGet("{id}")]
        [AllowAnonymous]
        public async Task<ActionResult<CourseResponseDto>> GetCourse(int id)
        {
            try
            {
                var course = await _courseService.GetCourseByIdAsync(id);
                var response = _mapper.Map<CourseResponseDto>(course);

              
                response.CurrencySymbol = GetCurrencySymbol(response.Currency);
                response.FormattedPrice = FormatPrice(response.Price, response.Currency);
                response.CurrencyCode = response.Currency.ToString();

                return Ok(new { success = true, data = response });
            }
            catch (NotFoundException ex)
            {
                return NotFound(new { success = false, message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Kurs detayı alınırken hata oluştu - ID: {id}");
                return StatusCode(500, new { success = false, message = "Kurs detayı alınırken bir hata oluştu" });
            }
        }

        // ============ GET: api/v1/course/instructor/{instructorId} ============
        [HttpGet("instructor/{instructorId}")]
        [Authorize(Roles = "Instructor,Admin")]
        public async Task<ActionResult<IEnumerable<CourseResponseDto>>> GetCoursesByInstructor(int instructorId)
        {
            try
            {
                var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
                var userRole = User.FindFirst(ClaimTypes.Role)?.Value;

                if (userRole != "Admin")
                {
                    var instructor = await _courseService.GetInstructorByUserIdAsync(userId);
                    if (instructor == null || instructor.Id != instructorId)
                        return Forbid();
                }

                var courses = await _courseService.GetCoursesByInstructorAsync(instructorId);
                var response = _mapper.Map<IEnumerable<CourseResponseDto>>(courses);

               
                foreach (var item in response)
                {
                    item.CurrencySymbol = GetCurrencySymbol(item.Currency);
                    item.FormattedPrice = FormatPrice(item.Price, item.Currency);
                    item.CurrencyCode = item.Currency.ToString();
                }

                return Ok(new { success = true, data = response });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Eğitmen kursları listelenirken hata oluştu - InstructorId: {instructorId}");
                return StatusCode(500, new { success = false, message = "Kurslar listelenirken bir hata oluştu" });
            }
        }

        // ============ POST: api/v1/course ============
        [HttpPost]
        [Authorize(Roles = "Instructor,Admin")]
        public async Task<ActionResult<CourseResponseDto>> CreateCourse([FromBody] CreateCourseDto request)
        {
            try
            {

                Console.WriteLine($"🔍 GELEN REQUEST - Title: {request.Title}, IsPublished: {request.IsPublished}");
                var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
                var userRole = User.FindFirst(ClaimTypes.Role)?.Value;

                int instructorId;

                if (userRole == "Admin" && request.InstructorId.HasValue && request.InstructorId.Value > 0)
                {
                    instructorId = request.InstructorId.Value;

                    var instructor = await _courseService.GetInstructorByIdAsync(instructorId);
                    if (instructor == null)
                    {
                        return BadRequest(new
                        {
                            success = false,
                            message = "Seçilen eğitmen bulunamadı. Lütfen geçerli bir eğitmen seçin."
                        });
                    }
                }
                else
                {
                    var instructor = await _courseService.GetInstructorByUserIdAsync(userId);
                    if (instructor == null)
                    {
                        return BadRequest(new
                        {
                            success = false,
                            message = "Eğitmen profiliniz bulunamadı. Lütfen önce eğitmen olarak kaydolun."
                        });
                    }
                    instructorId = instructor.Id;
                }

                var course = _mapper.Map<Course>(request);
                course.InstructorId = instructorId;

                // Currency kontrolü - Eğer 0 ise TL yap
                if (request.Currency == 0)
                {
                    course.Currency = Currency.TL;
                }

                // IsFree kontrolü
                if (request.Price <= 0)
                {
                    course.IsFree = true;
                    course.Price = 0;
                }

                // ============================================================
                //  YAYINLA KONTROLÜ 
                // ============================================================
                if (request.IsPublished)
                {
                    course.IsPublished = true;
                    course.PublishedDate = DateTime.UtcNow;
                    Console.WriteLine($"✅ Kurs yayınlanacak - IsPublished: {request.IsPublished}");
                }
                else
                {
                    course.IsPublished = false;
                    Console.WriteLine($"⚠️ Kurs taslak olarak kaydedilecek - IsPublished: {request.IsPublished}");
                }
                // ============================================================

                var createdCourse = await _courseService.CreateCourseAsync(course);
                var response = _mapper.Map<CourseResponseDto>(createdCourse);

         
                response.CurrencySymbol = GetCurrencySymbol(response.Currency);
                response.FormattedPrice = FormatPrice(response.Price, response.Currency);
                response.CurrencyCode = response.Currency.ToString();

                // ============================================================
                //  YAYINLANDIYSA ÖĞRENCİLERE BİLDİRİM GÖNDER 
                // ============================================================
                if (request.IsPublished)
                {
                    try
                    {
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
                    }
                    catch (Exception ex)
                    {
                        Console.WriteLine($"❌ Bildirim gönderilemedi: {ex.Message}");
                    }
                }
                // ============================================================

                return CreatedAtAction(nameof(GetCourse), new { id = createdCourse.Id }, new { success = true, data = response });
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
                _logger.LogError(ex, "Kurs oluşturulurken hata oluştu");
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        // ============ PUT: api/v1/course/{id} ============
        [HttpPut("{id}")]
        [Authorize(Roles = "Instructor,Admin")]
        public async Task<ActionResult<CourseResponseDto>> UpdateCourse(int id, [FromBody] UpdateCourseDto request)
        {
            try
            {
                var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
                var userRole = User.FindFirst(ClaimTypes.Role)?.Value;

                var existingCourse = await _courseService.GetCourseByIdAsync(id);

                if (userRole != "Admin")
                {
                    var instructor = await _courseService.GetInstructorByUserIdAsync(userId);

                    if (instructor == null)
                    {
                        return BadRequest(new
                        {
                            success = false,
                            message = "Eğitmen profiliniz bulunamadı."
                        });
                    }

                    if (existingCourse.InstructorId != instructor.Id)
                    {
                        return Forbid("Bu kursu düzenleme yetkiniz yok.");
                    }
                }

       
                var course = _mapper.Map(request, existingCourse);
                course.Id = id;
                course.UpdatedDate = DateTime.UtcNow;

             
                if (request.Currency == 0)
                {
                    course.Currency = Currency.TL;
                }

            
                if (request.Price <= 0)
                {
                    course.IsFree = true;
                    course.Price = 0;
                }
                else
                {
                    course.IsFree = false;
                }

                var updatedCourse = await _courseService.UpdateCourseAsync(course);
                var response = _mapper.Map<CourseResponseDto>(updatedCourse);

              
                response.CurrencySymbol = GetCurrencySymbol(response.Currency);
                response.FormattedPrice = FormatPrice(response.Price, response.Currency);
                response.CurrencyCode = response.Currency.ToString();

                _logger.LogInformation($"Kurs güncellendi - ID: {id}, Başlık: {updatedCourse.Title}");
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
                _logger.LogError(ex, $"Kurs güncellenirken hata oluştu - ID: {id}");
                return StatusCode(500, new { success = false, message = "Kurs güncellenirken bir hata oluştu" });
            }
        }

        // ============ DELETE: api/v1/course/{id} ============
        [HttpDelete("{id}")]
        [Authorize(Roles = "Instructor,Admin")]
        public async Task<IActionResult> DeleteCourse(int id)
        {
            try
            {
                var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
                var userRole = User.FindFirst(ClaimTypes.Role)?.Value;

                var existingCourse = await _courseService.GetCourseByIdAsync(id);

                if (userRole != "Admin")
                {
                    var instructor = await _courseService.GetInstructorByUserIdAsync(userId);

                    if (instructor == null)
                    {
                        return BadRequest(new
                        {
                            success = false,
                            message = "Eğitmen profiliniz bulunamadı."
                        });
                    }

                    if (existingCourse.InstructorId != instructor.Id)
                    {
                        return Forbid("Bu kursu silme yetkiniz yok.");
                    }
                }

                await _courseService.DeleteCourseAsync(id);

                _logger.LogInformation($"Kurs silindi - ID: {id}");
                return Ok(new { success = true, message = "Kurs başarıyla silindi" });
            }
            catch (NotFoundException ex)
            {
                return NotFound(new { success = false, message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Kurs silinirken hata oluştu - ID: {id}");
                return StatusCode(500, new { success = false, message = "Kurs silinirken bir hata oluştu" });
            }
        }

        // ============ POST: api/v1/course/{id}/publish ============
        [HttpPost("{id}/publish")]
        [Authorize(Roles = "Instructor,Admin")]
        public async Task<IActionResult> PublishCourse(int id)
        {
            try
            {
                var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
                var userRole = User.FindFirst(ClaimTypes.Role)?.Value;

                var existingCourse = await _courseService.GetCourseByIdAsync(id);

                if (userRole != "Admin")
                {
                    var instructor = await _courseService.GetInstructorByUserIdAsync(userId);

                    if (instructor == null)
                    {
                        return BadRequest(new
                        {
                            success = false,
                            message = "Eğitmen profiliniz bulunamadı."
                        });
                    }

                    if (existingCourse.InstructorId != instructor.Id)
                    {
                        return Forbid("Bu kursu yayınlama yetkiniz yok.");
                    }
                }

                await _courseService.PublishCourseAsync(id);

                _logger.LogInformation($"Kurs yayınlandı - ID: {id}");
                return Ok(new { success = true, message = "Kurs başarıyla yayınlandı" });
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
                _logger.LogError(ex, $"Kurs yayınlanırken hata oluştu - ID: {id}");
                return StatusCode(500, new { success = false, message = "Kurs yayınlanırken bir hata oluştu" });
            }
        }

        // ============ POST: api/v1/course/{id}/unpublish ============
        [HttpPost("{id}/unpublish")]
        [Authorize(Roles = "Instructor,Admin")]
        public async Task<IActionResult> UnpublishCourse(int id)
        {
            try
            {
                var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
                var userRole = User.FindFirst(ClaimTypes.Role)?.Value;

                var existingCourse = await _courseService.GetCourseByIdAsync(id);

                if (userRole != "Admin")
                {
                    var instructor = await _courseService.GetInstructorByUserIdAsync(userId);

                    if (instructor == null)
                    {
                        return BadRequest(new
                        {
                            success = false,
                            message = "Eğitmen profiliniz bulunamadı."
                        });
                    }

                    if (existingCourse.InstructorId != instructor.Id)
                    {
                        return Forbid("Bu kursu yayından kaldırma yetkiniz yok.");
                    }
                }

                await _courseService.UnpublishCourseAsync(id);

                _logger.LogInformation($"Kurs yayından kaldırıldı - ID: {id}");
                return Ok(new { success = true, message = "Kurs başarıyla yayından kaldırıldı" });
            }
            catch (NotFoundException ex)
            {
                return NotFound(new { success = false, message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Kurs yayından kaldırılırken hata oluştu - ID: {id}");
                return StatusCode(500, new { success = false, message = "Kurs yayından kaldırılırken bir hata oluştu" });
            }
        }

        // ============ YARDIMCI METODLAR ============
        private string GetCurrencySymbol(Currency currency)
        {
            return currency switch
            {
                Currency.TL => "₺",
                Currency.USD => "$",
                Currency.EUR => "€",
                Currency.GBP => "£",
                _ => "₺"
            };
        }

        private string FormatPrice(decimal price, Currency currency)
        {
            var symbol = GetCurrencySymbol(currency);
            return $"{symbol}{price:F2}";
        }
    }
}