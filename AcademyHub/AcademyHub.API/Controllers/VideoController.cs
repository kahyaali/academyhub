using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace AcademyHub.API.Controllers
{
    public class VideoUploadDto
    {
        public IFormFile File { get; set; } = null!;
    }

    [Route("api/v1/[controller]")]
    [ApiController]
    [Authorize(Roles = "Instructor,Admin")]
    public class VideoController : ControllerBase
    {
        private readonly IWebHostEnvironment _env;
        private readonly ILogger<VideoController> _logger;
        private readonly IConfiguration _configuration;

        public VideoController(
            IWebHostEnvironment env,
            ILogger<VideoController> logger,
            IConfiguration configuration)
        {
            _env = env;
            _logger = logger;
            _configuration = configuration;
        }

        [HttpPost("upload")]
        [Consumes("multipart/form-data")]
        [RequestSizeLimit(1200 * 1024 * 1024)] // 1.2 GB
        [RequestFormLimits(MultipartBodyLengthLimit = 1200 * 1024 * 1024)] // 1.2 GB
        public async Task<IActionResult> UploadVideo([FromForm] VideoUploadDto request)
        {
            try
            {
                var file = request.File;

                if (file == null || file.Length == 0)
                    return BadRequest(new { success = false, message = "Dosya seçilmedi" });

                var maxSizeMB = _configuration.GetValue<int>("FileUpload:MaxVideoSizeMB", 1024); // 500 → 1024 (1 GB)
                var maxSizeBytes = maxSizeMB * 1024 * 1024;
                var allowedTypes = _configuration.GetSection("FileUpload:AllowedVideoTypes").Get<string[]>()
                    ?? new[] { "video/mp4", "video/webm", "video/ogg", "video/quicktime" };

                if (file.Length > maxSizeBytes)
                    return BadRequest(new
                    {
                        success = false,
                        message = $"Dosya boyutu {maxSizeMB}MB'dan küçük olmalı"
                    });

                if (!allowedTypes.Contains(file.ContentType))
                    return BadRequest(new
                    {
                        success = false,
                        message = "Sadece video dosyaları yüklenebilir"
                    });

                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "unknown";
                var fileExtension = Path.GetExtension(file.FileName);
                var fileName = $"{userId}_{DateTime.Now.Ticks}{fileExtension}";
                var uploadPath = Path.Combine(_env.WebRootPath, "uploads", "videos");

                if (!Directory.Exists(uploadPath))
                    Directory.CreateDirectory(uploadPath);

                var filePath = Path.Combine(uploadPath, fileName);

                using (var stream = new FileStream(filePath, FileMode.Create))
                {
                    await file.CopyToAsync(stream);
                }

                var videoUrl = $"/uploads/videos/{fileName}";

                _logger.LogInformation($"Video yüklendi: {videoUrl} - Boyut: {file.Length} bytes");

                return Ok(new
                {
                    success = true,
                    data = new
                    {
                        videoUrl,
                        fileName,
                        fileSize = file.Length,
                        contentType = file.ContentType
                    }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Video yüklenirken hata oluştu");
                return StatusCode(500, new
                {
                    success = false,
                    message = "Video yüklenirken bir hata oluştu: " + ex.Message
                });
            }
        }

        [HttpDelete("delete")]
        [Authorize(Roles = "Instructor,Admin")]
        public IActionResult DeleteVideo([FromQuery] string fileName)
        {
            try
            {
                if (string.IsNullOrEmpty(fileName))
                    return BadRequest(new { success = false, message = "Dosya adı gereklidir" });

                var uploadPath = Path.Combine(_env.WebRootPath, "uploads", "videos");
                var filePath = Path.Combine(uploadPath, fileName);

                if (!System.IO.File.Exists(filePath))
                    return NotFound(new { success = false, message = "Dosya bulunamadı" });

                System.IO.File.Delete(filePath);

                _logger.LogInformation($"Video silindi: {fileName}");

                return Ok(new { success = true, message = "Video başarıyla silindi" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Video silinirken hata oluştu");
                return StatusCode(500, new { success = false, message = "Video silinirken bir hata oluştu" });
            }
        }
    }
}