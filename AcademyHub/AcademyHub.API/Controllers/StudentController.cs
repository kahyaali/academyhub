using AcademyHub.Application.DTOs.Student;
using AcademyHub.Core.Entities;
using AcademyHub.Core.Exceptions;
using AcademyHub.Core.Interfaces;
using AutoMapper;
using Microsoft.AspNetCore.Authorization;
using AcademyHub.Core.Interfaces.Services;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace AcademyHub.API.Controllers
{
    [Route("api/v1/[controller]")]
    [ApiController]
    [Authorize]
    public class StudentController : ControllerBase
    {

        private readonly IStudentService _studentService;
        private readonly IUnitOfWork _unitOfWork;
        private readonly IMapper _mapper;
        private readonly ILogger<StudentController> _logger;

        public StudentController(
            IStudentService studentService,
            IUnitOfWork unitOfWork,
            IMapper mapper,
            ILogger<StudentController> logger)
        {
            _studentService = studentService;
            _unitOfWork = unitOfWork;
            _mapper = mapper;
            _logger = logger;
        }

        // ============ GET: api/v1/student/profile ============
        [HttpGet("profile")]
        public async Task<IActionResult> GetProfile()
        {
            try
            {
                var userId = GetUserId();
                if (userId == 0)
                    return Unauthorized(new { success = false, message = "Geçersiz kullanıcı" });

                var student = await _studentService.GetStudentByUserIdAsync(userId);

                if (student == null)
                    return NotFound(new { success = false, message = "Öğrenci profili bulunamadı" });

                var response = _mapper.Map<StudentResponseDto>(student);

                var user = await _unitOfWork.GetRepository<User>().GetByIdAsync(userId);
                if (user != null)
                {
                    response.Email = user.Email;
                    response.PhoneNumber = user.PhoneNumber;  
                    response.Address = user.Address;          
                    response.Bio = user.Bio;                  
                }

                return Ok(new { success = true, data = response });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Profil yüklenirken hata oluştu");
                return StatusCode(500, new { success = false, message = "Profil yüklenirken bir hata oluştu" });
            }
        }

        // ============ PUT: api/v1/student/profile ============
        [HttpPut("profile")]
        public async Task<IActionResult> UpdateProfile([FromBody] UpdateStudentDto request)
        {
            try
            {
                var userId = GetUserId();
                if (userId == 0)
                    return Unauthorized(new { success = false, message = "Geçersiz kullanıcı" });

                var student = await _studentService.UpdateProfileAsync(
                    userId,
                    request.FirstName ?? "",
                    request.LastName ?? "",
                    request.PhoneNumber,
                    request.Address,
                    request.Bio ?? ""
                );

                var response = _mapper.Map<StudentResponseDto>(student);

          
                var user = await _unitOfWork.GetRepository<User>().GetByIdAsync(userId);
                if (user != null)
                {
                    response.Email = user.Email;
                    response.PhoneNumber = user.PhoneNumber;
                    response.Address = user.Address;
                    response.Bio = user.Bio;
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

        // ============ GET: api/v1/student/{id} ============
        [HttpGet("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetStudentById(int id)
        {
            try
            {
                var student = await _studentService.GetStudentByIdAsync(id);
                if (student == null)
                    return NotFound(new { success = false, message = "Öğrenci bulunamadı" });

                var response = _mapper.Map<StudentResponseDto>(student);

                var user = await _unitOfWork.GetRepository<User>().GetByIdAsync(student.UserId);
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
                _logger.LogError(ex, "Öğrenci bilgisi alınırken hata oluştu");
                return StatusCode(500, new { success = false, message = "Öğrenci bilgisi alınırken bir hata oluştu" });
            }
        }

        // ============ GET: api/v1/student/by-user/{userId} ============
        [HttpGet("by-user/{userId}")]
        public async Task<IActionResult> GetStudentByUserId(int userId)
        {
            try
            {
                var currentUserId = GetUserId();
                if (currentUserId == 0)
                    return Unauthorized(new { success = false, message = "Geçersiz kullanıcı" });

                // Admin değilse sadece kendi bilgisini alabilir
                if (!User.IsInRole("Admin") && currentUserId != userId)
                    return Forbid();

                var student = await _studentService.GetStudentByUserIdAsync(userId);
                if (student == null)
                    return NotFound(new { success = false, message = "Öğrenci bulunamadı" });

                var response = _mapper.Map<StudentResponseDto>(student);

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
                _logger.LogError(ex, "Öğrenci bilgisi alınırken hata oluştu");
                return StatusCode(500, new { success = false, message = "Öğrenci bilgisi alınırken bir hata oluştu" });
            }
        }

        private int GetUserId()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return int.TryParse(userIdClaim, out int userId) ? userId : 0;
        }
    }
}
