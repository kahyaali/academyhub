using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace AcademyHub.API.Controllers
{
    [Route("api/v1/[controller]")]
    [ApiController]
    [Authorize(Roles = "Instructor,Admin")]
    public class ResourceController : ControllerBase
    {
        private readonly IWebHostEnvironment _env;
        private readonly ILogger<ResourceController> _logger;
        private readonly IConfiguration _configuration;

        public ResourceController(
            IWebHostEnvironment env,
            ILogger<ResourceController> logger,
            IConfiguration configuration)
        {
            _env = env;
            _logger = logger;
            _configuration = configuration;
        }

        [HttpPost("upload")]
        [Consumes("multipart/form-data")]
        [RequestSizeLimit(50 * 1024 * 1024)] // 50 MB
        [RequestFormLimits(MultipartBodyLengthLimit = 50 * 1024 * 1024)]
        public async Task<IActionResult> UploadResource([FromForm] ResourceUploadDto request)
        {
            try
            {
                var file = request.File;

                if (file == null || file.Length == 0)
                    return BadRequest(new { success = false, message = "Dosya seçilmedi" });

                var maxSizeMB = _configuration.GetValue<int>("FileUpload:MaxResourceSizeMB", 50);
                var maxSizeBytes = maxSizeMB * 1024 * 1024;
                var allowedTypes = _configuration.GetSection("FileUpload:AllowedResourceTypes").Get<string[]>()
                    ?? new[] {
                        "application/pdf",
                        "application/msword",
                        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                        "application/vnd.ms-powerpoint",
                        "application/vnd.openxmlformats-officedocument.presentationml.presentation",
                        "application/vnd.ms-excel",
                        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                    };

                if (file.Length > maxSizeBytes)
                    return BadRequest(new { success = false, message = $"Dosya boyutu {maxSizeMB}MB'dan küçük olmalı" });

                if (!allowedTypes.Contains(file.ContentType))
                    return BadRequest(new { success = false, message = "Sadece desteklenen dosya türleri yüklenebilir" });

                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "unknown";
                var fileExtension = Path.GetExtension(file.FileName);
                var fileName = $"{userId}_{DateTime.Now.Ticks}{fileExtension}";
                var uploadPath = Path.Combine(_env.WebRootPath, "uploads", "resources");

                if (!Directory.Exists(uploadPath))
                    Directory.CreateDirectory(uploadPath);

                var filePath = Path.Combine(uploadPath, fileName);

                using (var stream = new FileStream(filePath, FileMode.Create))
                {
                    await file.CopyToAsync(stream);
                }

                var fileUrl = $"/uploads/resources/{fileName}";

                _logger.LogInformation($"Kaynak dosyası yüklendi: {fileUrl} - Boyut: {file.Length} bytes");

                return Ok(new
                {
                    success = true,
                    data = new
                    {
                        fileUrl,
                        fileName,
                        fileSize = file.Length,
                        contentType = file.ContentType
                    }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Kaynak dosyası yüklenirken hata oluştu");
                return StatusCode(500, new
                {
                    success = false,
                    message = "Kaynak dosyası yüklenirken bir hata oluştu: " + ex.Message
                });
            }
        }

        [HttpDelete("delete")]
        [Authorize(Roles = "Instructor,Admin")]
        public IActionResult DeleteResource([FromQuery] string fileName)
        {
            try
            {
                if (string.IsNullOrEmpty(fileName))
                    return BadRequest(new { success = false, message = "Dosya adı gereklidir" });

                var uploadPath = Path.Combine(_env.WebRootPath, "uploads", "resources");
                var filePath = Path.Combine(uploadPath, fileName);

                if (!System.IO.File.Exists(filePath))
                    return NotFound(new { success = false, message = "Dosya bulunamadı" });

                System.IO.File.Delete(filePath);

                _logger.LogInformation($"Kaynak dosyası silindi: {fileName}");

                return Ok(new { success = true, message = "Kaynak dosyası başarıyla silindi" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Kaynak dosyası silinirken hata oluştu");
                return StatusCode(500, new { success = false, message = "Kaynak dosyası silinirken bir hata oluştu" });
            }
        }

    
        public class ResourceUploadDto
        {
            public IFormFile File { get; set; }
        }
    }
}
