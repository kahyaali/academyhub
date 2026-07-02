using AcademyHub.Core.Entities;
using AcademyHub.Core.Interfaces;
using AcademyHub.Core.Interfaces.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace AcademyHub.API.Controllers
{
    [Route("api/v1/[controller]")]
    [ApiController]
    [Authorize]
    public class StatsController : ControllerBase
    {
        private readonly IStatsService _statsService;
        private readonly ILogger<StatsController> _logger;
        private readonly IUnitOfWork _unitOfWork;

        public StatsController(IStatsService statsService, ILogger<StatsController> logger, IUnitOfWork unitOfWork)
        {
            _statsService = statsService;
            _logger = logger;
            _unitOfWork = unitOfWork;
        }

        // ============ GET: api/v1/stats ============
        [HttpGet]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetDashboardStats()
        {
            try
            {
                var stats = await _statsService.GetDashboardStatsAsync();
                return Ok(new { success = true, data = stats });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Dashboard istatistikleri alınırken hata oluştu");
                return StatusCode(500, new { success = false, message = "İstatistikler alınırken bir hata oluştu" });
            }
        }

        // ============ GET: api/v1/stats/instructor ============
        [HttpGet("instructor")]
        [Authorize(Roles = "Instructor,Admin")]
        public async Task<IActionResult> GetInstructorStats()
        {
            try
            {
                var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");

         
                var instructor = await _unitOfWork.GetRepository<Instructor>()
                    .SingleOrDefaultAsync(i => i.UserId == userId && !i.IsDeleted);

                if (instructor == null)
                {
                    _logger.LogWarning($"Instructor not found for UserId: {userId}");
                    return Ok(new
                    {
                        success = true,
                        data = new InstructorStats
                        {
                            TotalCourses = 0,
                            PublishedCourses = 0,
                            TotalStudents = 0,
                            TotalEnrollments = 0,
                            TotalRevenue = 0,
                            AverageRating = 0,
                            TotalReviews = 0
                        }
                    });
                }

             
                var stats = await _statsService.GetInstructorStatsAsync(instructor.Id);

                return Ok(new { success = true, data = stats });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Eğitmen istatistikleri alınırken hata oluştu");
                return StatusCode(500, new { success = false, message = "İstatistikler alınırken bir hata oluştu" });
            }
        }

        // ============ GET: api/v1/stats/student ============
        [HttpGet("student")]
        [Authorize]
        public async Task<IActionResult> GetStudentStats()
        {
            try
            {
                var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");

                if (userId == 0)
                    return Unauthorized(new { success = false, message = "Geçersiz kullanıcı" });

                var student = await _unitOfWork.GetRepository<Student>()
                    .SingleOrDefaultAsync(s => s.UserId == userId && !s.IsDeleted);

                if (student == null)
                {
                    return Ok(new
                    {
                        success = true,
                        data = new StudentStats
                        {
                            TotalEnrollments = 0,
                            CompletedCourses = 0,
                            InProgressCourses = 0,
                            AverageProgress = 0,
                            TotalSpent = 0,
                            TotalCertificates = 0
                        }
                    });
                }

              
                var stats = await _statsService.GetStudentStatsAsync(student.Id);
                return Ok(new { success = true, data = stats });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Öğrenci istatistikleri alınırken hata oluştu");
                return StatusCode(500, new { success = false, message = "İstatistikler alınırken bir hata oluştu" });
            }
        }
    }
}