using AcademyHub.API.Helpers;
using AcademyHub.Application.DTOs.Auth;
using AcademyHub.Core.Exceptions;
using AcademyHub.Core.Interfaces.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using System;
using System.Security.Claims;
using System.Threading.Tasks;

namespace AcademyHub.API.Controllers
{
    [Route("api/v1/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _authService;
        private readonly JwtHelper _jwtHelper;
        private readonly ILogger<AuthController> _logger;
        private readonly IEmailService _emailService;
        private readonly IConfiguration _configuration;

        public AuthController(
            IAuthService authService,
            JwtHelper jwtHelper,
            ILogger<AuthController> logger,
            IEmailService emailService,
            IConfiguration configuration)
        {
            _authService = authService;
            _jwtHelper = jwtHelper;
            _logger = logger;
            _emailService = emailService;
            _configuration = configuration;
        }

        // ============ POST: api/v1/auth/register ============
        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterDto request)
        {
            try
            {
                var user = await _authService.RegisterAsync(
                    request.FirstName,
                    request.LastName,
                    request.Email,
                    request.Password,
                    request.Role,
                    request.PhoneNumber,
                    request.ProfileImage,
                    request.Bio,
                    request.Expertise,
                    request.Address,
                    request.BirthDate
                );

                var token = _jwtHelper.GenerateJwtToken(user);
                var refreshToken = _jwtHelper.GenerateRefreshToken();
                var refreshTokenExpiry = DateTime.UtcNow.AddDays(7);

                await _authService.UpdateUserRefreshTokenAsync(user.Id, refreshToken, refreshTokenExpiry);

                var response = new LoginResponseDto
                {
                    Id = user.Id,
                    FirstName = user.FirstName,
                    LastName = user.LastName,
                    Email = user.Email,
                    Role = user.Role,
                    IsSystemAdmin = user.IsSystemAdmin,
                    Token = token,
                    RefreshToken = refreshToken,
                    TokenExpiryDate = DateTime.UtcNow.AddMinutes(60)
                };

                return Ok(new { success = true, data = response });
            }
            catch (BusinessRuleException ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Kayıt olma hatası");
                return StatusCode(500, new { success = false, message = "Bir hata oluştu" });
            }
        }

        // ============ POST: api/v1/auth/login ============
        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginDto request)
        {
            try
            {
                var user = await _authService.LoginAsync(request.Email, request.Password);

                var token = _jwtHelper.GenerateJwtToken(user);
                var refreshToken = _jwtHelper.GenerateRefreshToken();
                var refreshTokenExpiry = DateTime.UtcNow.AddDays(7);

                await _authService.UpdateUserRefreshTokenAsync(user.Id, refreshToken, refreshTokenExpiry);

                var response = new LoginResponseDto
                {
                    Id = user.Id,
                    FirstName = user.FirstName,
                    LastName = user.LastName,
                    Email = user.Email,
                    Role = user.Role,
                    IsSystemAdmin = user.IsSystemAdmin,
                    Token = token,
                    RefreshToken = refreshToken,
                    TokenExpiryDate = DateTime.UtcNow.AddMinutes(60)
                };

                return Ok(new { success = true, data = response });
            }
            catch (UnauthorizedException ex)
            {
                return Unauthorized(new { success = false, message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Giriş yapma hatası");
                return StatusCode(500, new { success = false, message = "Bir hata oluştu" });
            }
        }

        // ============ GET: api/v1/auth/me ============
        [HttpGet("me")]
        [Authorize]
        public async Task<IActionResult> GetCurrentUser()
        {
            try
            {
                var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
                var user = await _authService.GetUserByIdAsync(userId);

                return Ok(new
                {
                    success = true,
                    data = new
                    {
                        id = user.Id,
                        firstName = user.FirstName,
                        lastName = user.LastName,
                        email = user.Email,
                        role = user.Role.ToString(),
                        profileImage = user.ProfileImage
                    }
                });
            }
            catch
            {
                return Unauthorized(new { success = false, message = "Oturum geçersiz" });
            }
        }

        // ============ POST: api/v1/auth/refresh-token ============
        [HttpPost("refresh-token")]
        public async Task<IActionResult> RefreshToken([FromBody] RefreshTokenDto request)
        {
            try
            {
                var principal = _jwtHelper.GetPrincipalFromExpiredToken(request.Token);
                var userId = int.Parse(principal.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");

                if (userId == 0)
                    return Unauthorized(new { success = false, message = "Geçersiz token" });

                var isValid = await _authService.ValidateRefreshTokenAsync(userId, request.RefreshToken);
                if (!isValid)
                    return Unauthorized(new { success = false, message = "Geçersiz refresh token" });

                var user = await _authService.GetUserByIdAsync(userId);
                var newToken = _jwtHelper.GenerateJwtToken(user);
                var newRefreshToken = _jwtHelper.GenerateRefreshToken();
                var refreshTokenExpiry = DateTime.UtcNow.AddDays(7);

                await _authService.UpdateUserRefreshTokenAsync(userId, newRefreshToken, refreshTokenExpiry);

                return Ok(new
                {
                    success = true,
                    data = new
                    {
                        token = newToken,
                        refreshToken = newRefreshToken,
                        tokenExpiryDate = DateTime.UtcNow.AddMinutes(60)
                    }
                });
            }
            catch (Exception)
            {
                return Unauthorized(new { success = false, message = "Geçersiz token" });
            }
        }

        // ============  POST: api/v1/auth/forgot-password ============
        [HttpPost("forgot-password")]
        public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordDto request)
        {
            try
            {
                Console.WriteLine($"📧 Şifre sıfırlama isteği - Email: {request.Email}");

                var user = await _authService.GetUserByEmailAsync(request.Email);

                if (user == null)
                {
                    return Ok(new
                    {
                        success = true,
                        message = "Şifre sıfırlama linki e-posta adresinize gönderildi."
                    });
                }

                var token = await _authService.GeneratePasswordResetTokenAsync(user.Id);

                var frontendUrl = _configuration["FrontendUrl"] ?? "http://localhost:5173";
                var resetLink = $"{frontendUrl}/reset-password?token={Uri.EscapeDataString(token)}&email={Uri.EscapeDataString(request.Email)}";

                Console.WriteLine($"🔗 Reset Link: {resetLink}");

                var subject = "🔑 Şifre Sıfırlama - AcademyHub";
                var body = $@"
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <style>
                            body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                            .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                            .header {{ background: linear-gradient(135deg, #6C63FF, #3F3D9E); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
                            .content {{ background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }}
                            .button {{ display: inline-block; padding: 12px 30px; background: #6C63FF; color: white; text-decoration: none; border-radius: 8px; font-weight: bold; }}
                            .footer {{ margin-top: 30px; text-align: center; color: #999; font-size: 12px; }}
                        </style>
                    </head>
                    <body>
                        <div class='container'>
                            <div class='header'>
                                <h1>🔑 Şifre Sıfırlama</h1>
                            </div>
                            <div class='content'>
                                <p>Merhaba <strong>{user.FirstName} {user.LastName}</strong>,</p>
                                <p>Şifrenizi sıfırlamak için aşağıdaki butona tıklayın:</p>
                                <div style='text-align: center; margin: 30px 0;'>
                                    <a href='{resetLink}' class='button'>Şifremi Sıfırla</a>
                                </div>
                                <p>Bu link <strong>1 saat</strong> geçerlidir.</p>
                                <p style='color: #666; font-size: 13px;'>
                                    AcademyHub - Eğitim Platformu
                                </p>
                            </div>
                            <div class='footer'>
                                <p>© 2024 AcademyHub. Tüm hakları saklıdır.</p>
                            </div>
                        </div>
                    </body>
                    </html>
                ";

                await _emailService.SendEmailAsync(request.Email, subject, body, true);

                Console.WriteLine($"✅ Email gönderildi: {request.Email}");

                return Ok(new
                {
                    success = true,
                    message = "Şifre sıfırlama linki e-posta adresinize gönderildi."
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ HATA: {ex.Message}");
                Console.WriteLine($"❌ STACK: {ex.StackTrace}");
                return StatusCode(500, new
                {
                    success = false,
                    message = "Bir hata oluştu",
                    error = ex.Message
                });
            }
        }

        // ============  POST: api/v1/auth/reset-password  ============
        [HttpPost("reset-password")]
        public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordDto request)
        {
            try
            {
                _logger.LogInformation($"🔑 Şifre sıfırlama işlemi - Email: {request.Email}");

                if (string.IsNullOrEmpty(request.Email) || string.IsNullOrEmpty(request.Token) || string.IsNullOrEmpty(request.NewPassword))
                {
                    return BadRequest(new { success = false, message = "Tüm alanlar gereklidir!" });
                }

                if (request.NewPassword.Length < 8)
                {
                    return BadRequest(new { success = false, message = "Şifre en az 8 karakter olmalıdır!" });
                }

                var result = await _authService.ResetPasswordAsync(
                    request.Email,
                    request.Token,
                    request.NewPassword);

                if (result)
                {
                    _logger.LogInformation($"✅ Şifre sıfırlandı - Email: {request.Email}");
                    return Ok(new
                    {
                        success = true,
                        message = "Şifreniz başarıyla güncellendi."
                    });
                }

                return BadRequest(new { success = false, message = "Şifre sıfırlama işlemi başarısız." });
            }
            catch (BusinessRuleException ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Şifre sıfırlama hatası");
                return StatusCode(500, new { success = false, message = "Bir hata oluştu" });
            }
        }

        // ============ POST: api/v1/auth/change-password ============
        [HttpPost("change-password")]
        [Authorize]
        public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequestDto request)
        {
            try
            {
                _logger.LogInformation($"Şifre değiştirme isteği - UserId: {User.FindFirst(ClaimTypes.NameIdentifier)?.Value}");

                if (!ModelState.IsValid)
                {
                    var errors = ModelState.Values
                        .SelectMany(v => v.Errors)
                        .Select(e => e.ErrorMessage)
                        .ToList();

                    return BadRequest(new
                    {
                        success = false,
                        message = "Validasyon hatası!",
                        errors = errors
                    });
                }

                if (request == null)
                {
                    return BadRequest(new { success = false, message = "Geçersiz istek!" });
                }

                if (string.IsNullOrEmpty(request.CurrentPassword))
                {
                    return BadRequest(new { success = false, message = "Mevcut şifre gereklidir!" });
                }

                if (string.IsNullOrEmpty(request.NewPassword))
                {
                    return BadRequest(new { success = false, message = "Yeni şifre gereklidir!" });
                }

                if (request.NewPassword.Length < 8)
                {
                    return BadRequest(new { success = false, message = "Şifre en az 8 karakter olmalıdır!" });
                }

                var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
                if (userId == 0)
                    return Unauthorized(new { success = false, message = "Geçersiz kullanıcı" });

                var result = await _authService.ChangePasswordAsync(
                    userId,
                    request.CurrentPassword,
                    request.NewPassword);

                if (!result)
                    return BadRequest(new { success = false, message = "Mevcut şifre yanlış!" });

                _logger.LogInformation($"✅ Şifre değiştirildi - UserId: {userId}");

                return Ok(new
                {
                    success = true,
                    message = "Şifreniz başarıyla değiştirildi"
                });
            }
            catch (NotFoundException ex)
            {
                return NotFound(new { success = false, message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Şifre değiştirilirken hata oluştu");
                return StatusCode(500, new
                {
                    success = false,
                    message = "Şifre değiştirilirken bir hata oluştu"
                });
            }
        }

        // ============ POST: api/v1/auth/logout ============
        [HttpPost("logout")]
        [Authorize]
        public async Task<IActionResult> Logout()
        {
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
            await _authService.UpdateUserRefreshTokenAsync(userId, null, DateTime.UtcNow);
            return Ok(new { success = true, message = "Çıkış yapıldı" });
        }
    }
}