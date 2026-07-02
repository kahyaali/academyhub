using AcademyHub.Application.DTOs.Instructor;
using AcademyHub.Application.DTOs.User;
using AcademyHub.Core.Entities;
using AcademyHub.Core.Enums;
using AcademyHub.Core.Interfaces;
using AcademyHub.Core.Interfaces.Services;
using AutoMapper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AcademyHub.API.Controllers
{
    [Route("api/v1/[controller]")]
    [ApiController]
    [Authorize(Roles = "Admin")]
    public class UserController : ControllerBase
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IAuthService _authService;
        private readonly IMapper _mapper;
        private readonly ILogger<UserController> _logger;

        public UserController(
            IUnitOfWork unitOfWork,
            IAuthService authService,
            IMapper mapper,
            ILogger<UserController> logger)
        {
            _unitOfWork = unitOfWork;
            _authService = authService;
            _mapper = mapper;
            _logger = logger;
        }

        // ============ GET: api/v1/user ============
        [HttpGet]
        public async Task<IActionResult> GetAllUsers()
        {
            try
            {
                var users = await _unitOfWork.GetRepository<User>()
                    .Query()
                    .Where(u => !u.IsDeleted)
                    .OrderBy(u => u.FirstName)
                    .ToListAsync();

                var response = _mapper.Map<IEnumerable<UserResponseDto>>(users);

                return Ok(new { success = true, data = response });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Kullanıcılar listelenirken hata oluştu");
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        // ============ GET: api/v1/user/{id} ============
        [HttpGet("{id}")]
        public async Task<IActionResult> GetUserById(int id)
        {
            try
            {
                var user = await _unitOfWork.GetRepository<User>()
                    .Query()
                    .Include(u => u.Instructor)
                    .Include(u => u.Student)
                    .FirstOrDefaultAsync(u => u.Id == id && !u.IsDeleted);

                if (user == null)
                    return NotFound(new { success = false, message = "Kullanıcı bulunamadı" });

                var response = _mapper.Map<UserResponseDto>(user);

                return Ok(new { success = true, data = response });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Kullanıcı detayı alınırken hata oluştu - ID: {id}");
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        // ============ GET: api/v1/user/instructors ============
        [HttpGet("instructors")]
        public async Task<IActionResult> GetInstructors()
        {
            try
            {
                var instructors = await _unitOfWork.GetRepository<Instructor>()
                    .Query()
                    .Include(i => i.User)
                    .Where(i => !i.IsDeleted && i.IsActive)
                    .Select(i => new
                    {
                        i.Id,
                        i.FirstName,
                        i.LastName,
                        i.User.Email,
                        i.User.ProfileImage,
                        i.TotalCourses,
                        i.TotalStudents,
                        i.AverageRating,
                        i.TotalReviews,
                        i.User.PhoneNumber,
                        i.Expertise,
                        i.Bio,
                        i.UserId
                    })
                    .OrderBy(i => i.FirstName)
                    .ToListAsync();

                return Ok(new { success = true, data = instructors });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Eğitmenler listelenirken hata oluştu");
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        // ============ GET: api/v1/user/students ============
        [HttpGet("students")]
        public async Task<IActionResult> GetStudents()
        {
            try
            {
                var students = await _unitOfWork.GetRepository<Student>()
                    .Query()
                    .Include(s => s.User)
                    .Where(s => !s.IsDeleted && s.IsActive)
                    .Select(s => new
                    {
                        s.Id,
                        s.FirstName,
                        s.LastName,
                        s.User.Email,
                        s.User.ProfileImage,
                        s.TotalEnrollments,
                        s.CompletedCourses,
                        s.AverageProgress,
                        s.User.PhoneNumber,
                        IsActive = s.User.IsActive,  
                        s.User.Address,
                        s.BirthDate
                    })
                    .OrderBy(s => s.FirstName)
                    .ToListAsync();

                return Ok(new { success = true, data = students });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Öğrenciler listelenirken hata oluştu");
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        // ============ PUT: api/v1/user/{id} ============
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateUser(int id, [FromBody] UpdateUserDto request)
        {
            try
            {
                var user = await _unitOfWork.GetRepository<User>()
                    .FirstOrDefaultAsync(u => u.Id == id && !u.IsDeleted);

                if (user == null)
                    return NotFound(new { success = false, message = "Kullanıcı bulunamadı" });

                //  SADECE SİSTEM ADMINİ GÜNCELLENEMEZ 🔥🔥🔥
                // IsSystemAdmin = true olanlar (seed admin) güncellenemez
                // Diğer adminler (IsSystemAdmin = false) güncellenebilir
                if (user.IsSystemAdmin)
                {
                    return BadRequest(new
                    {
                        success = false,
                        message = "Sistem admini bilgileri güncellenemez!"
                    });
                }

                if (!string.IsNullOrEmpty(request.FirstName))
                    user.FirstName = request.FirstName;

                if (!string.IsNullOrEmpty(request.LastName))
                    user.LastName = request.LastName;

                if (!string.IsNullOrEmpty(request.PhoneNumber))
                    user.PhoneNumber = request.PhoneNumber;

                if (!string.IsNullOrEmpty(request.ProfileImage))
                    user.ProfileImage = request.ProfileImage;

                if (!string.IsNullOrEmpty(request.Address))
                    user.Address = request.Address;

                user.IsActive = request.IsActive;
                user.UpdatedDate = DateTime.UtcNow;

                _unitOfWork.GetRepository<User>().Update(user);
                await _unitOfWork.SaveChangesAsync();

                _logger.LogInformation($"Kullanıcı güncellendi - ID: {id}");

                return Ok(new { success = true, message = "Kullanıcı başarıyla güncellendi" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Kullanıcı güncellenirken hata oluştu - ID: {id}");
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        // ============ PUT: api/v1/user/{id}/role ============
        [HttpPut("{id}/role")]
        public async Task<IActionResult> ChangeUserRole(int id, [FromBody] ChangeRoleDto request)
        {
            try
            {
                var user = await _unitOfWork.GetRepository<User>()
                    .FirstOrDefaultAsync(u => u.Id == id && !u.IsDeleted);

                if (user == null)
                    return NotFound(new { success = false, message = "Kullanıcı bulunamadı" });

                //  Sistem admini rolü değiştirilemez
                if (user.IsSystemAdmin)
                    return BadRequest(new { success = false, message = "Sistem admini rolü değiştirilemez" });

                user.Role = request.NewRole;
                user.UpdatedDate = DateTime.UtcNow;

                _unitOfWork.GetRepository<User>().Update(user);
                await _unitOfWork.SaveChangesAsync();

                _logger.LogInformation($"Kullanıcı rolü değiştirildi - ID: {id}, Yeni Rol: {request.NewRole}");

                return Ok(new { success = true, message = "Kullanıcı rolü başarıyla güncellendi" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Kullanıcı rolü değiştirilirken hata oluştu - ID: {id}");
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        // ============ PUT: api/v1/user/{id}/status ============
        [HttpPut("{id}/status")]
        public async Task<IActionResult> UpdateUserStatus(int id, [FromBody] UpdateStatusRequest request)
        {
            try
            {
                var user = await _unitOfWork.GetRepository<User>()
                    .FirstOrDefaultAsync(u => u.Id == id && !u.IsDeleted);

                if (user == null)
                    return NotFound(new { success = false, message = "Kullanıcı bulunamadı" });

                //  Sistem admini pasifleştirilemez
                if (user.IsSystemAdmin && !request.IsActive)
                    return BadRequest(new { success = false, message = "Sistem admini pasifleştirilemez" });

                user.IsActive = request.IsActive;
                user.UpdatedDate = DateTime.UtcNow;

                _unitOfWork.GetRepository<User>().Update(user);
                await _unitOfWork.SaveChangesAsync();

                _logger.LogInformation($"Kullanıcı durumu güncellendi - ID: {id}, Aktif: {request.IsActive}");

                return Ok(new { success = true, message = "Kullanıcı durumu başarıyla güncellendi" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Kullanıcı durumu güncellenirken hata oluştu - ID: {id}");
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        // ============ DELETE: api/v1/user/{id} ============
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteUser(int id)
        {
            try
            {
                var user = await _unitOfWork.GetRepository<User>()
                    .FirstOrDefaultAsync(u => u.Id == id && !u.IsDeleted);

                if (user == null)
                    return NotFound(new { success = false, message = "Kullanıcı bulunamadı" });

                //  Sistem admini silinemez
                if (user.IsSystemAdmin)
                    return BadRequest(new { success = false, message = "Sistem admini silinemez" });

                //  1. ADIM: User'ı soft-delete yap
                user.IsDeleted = true;
                user.UpdatedDate = DateTime.UtcNow;
                _unitOfWork.GetRepository<User>().Update(user);

                //  2. ADIM: Eğer Instructor ise, Instructor tablosunu da soft-delete yap
                if (user.Role == UserRole.Instructor)
                {
                    var instructor = await _unitOfWork.GetRepository<Instructor>()
                        .FirstOrDefaultAsync(i => i.UserId == id && !i.IsDeleted);

                    if (instructor != null)
                    {
                        instructor.IsDeleted = true;
                        instructor.UpdatedDate = DateTime.UtcNow;
                        _unitOfWork.GetRepository<Instructor>().Update(instructor);
                        _logger.LogInformation($"Instructor soft-delete edildi - InstructorId: {instructor.Id}, UserId: {id}");
                    }
                }

                //  3. ADIM: Eğer Student ise, Student tablosunu da soft-delete yap
                if (user.Role == UserRole.Student)
                {
                    var student = await _unitOfWork.GetRepository<Student>()
                        .FirstOrDefaultAsync(s => s.UserId == id && !s.IsDeleted);

                    if (student != null)
                    {
                        student.IsDeleted = true;
                        student.UpdatedDate = DateTime.UtcNow;
                        _unitOfWork.GetRepository<Student>().Update(student);
                        _logger.LogInformation($"Student soft-delete edildi - StudentId: {student.Id}, UserId: {id}");
                    }
                }

                await _unitOfWork.SaveChangesAsync();

                _logger.LogInformation($"Kullanıcı ve ilişkili kayıtlar soft-delete edildi - ID: {id}");

                return Ok(new { success = true, message = "Kullanıcı başarıyla silindi" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Kullanıcı silinirken hata oluştu - ID: {id}");
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        // ============ PUT: api/v1/user/instructor-update/{id} ============
        [HttpPut("instructor-update/{id}")]
        public async Task<IActionResult> AdminUpdateInstructor(int id, [FromBody] AdminUpdateInstructorDto request)
        {
            try
            {
                var instructor = await _unitOfWork.GetRepository<Instructor>()
                    .Query()
                    .Include(i => i.User)
                    .FirstOrDefaultAsync(i => i.Id == id && !i.IsDeleted);

                if (instructor == null)
                    return NotFound(new { success = false, message = "Eğitmen bulunamadı" });

                // Instructor bilgilerini güncelle (BIO dahil)
                if (!string.IsNullOrEmpty(request.FirstName))
                    instructor.FirstName = request.FirstName;

                if (!string.IsNullOrEmpty(request.LastName))
                    instructor.LastName = request.LastName;

                if (request.Bio != null)  
                    instructor.Bio = request.Bio;

                if (!string.IsNullOrEmpty(request.Expertise))
                    instructor.Expertise = request.Expertise;

                instructor.UpdatedDate = DateTime.UtcNow;

                // User bilgilerini güncelle (Telefon dahil)
                if (instructor.User != null)
                {
                    if (!string.IsNullOrEmpty(request.FirstName))
                        instructor.User.FirstName = request.FirstName;

                    if (!string.IsNullOrEmpty(request.LastName))
                        instructor.User.LastName = request.LastName;

                    if (request.PhoneNumber != null) 
                        instructor.User.PhoneNumber = request.PhoneNumber;

                    instructor.User.IsActive = request.IsActive;
                    instructor.User.UpdatedDate = DateTime.UtcNow;
                }

                await _unitOfWork.SaveChangesAsync();

                return Ok(new { success = true, message = "Eğitmen başarıyla güncellendi" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Eğitmen güncellenirken hata oluştu");
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }
    }

    // ============ Request DTO'ları (Controller içinde) ============
    public class UpdateStatusRequest
    {
        public bool IsActive { get; set; }
    }
}