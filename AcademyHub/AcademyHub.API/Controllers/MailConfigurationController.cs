using AcademyHub.Application.DTOs.MailConfiguration;
using AcademyHub.Core.Entities;
using AcademyHub.Core.Exceptions;
using AcademyHub.Core.Interfaces.Services;
using AutoMapper;
using MailKit.Security;
using MailKit.Net.Smtp;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MimeKit;

namespace AcademyHub.API.Controllers
{
    [Route("api/v1/[controller]")]
    [ApiController]
    [Authorize(Roles = "Admin")] 
    public class MailConfigurationController : ControllerBase
    {
        private readonly IMailConfigurationService _mailConfigurationService;
        private readonly IEmailService _emailService;
        private readonly IMapper _mapper;
        private readonly ILogger<MailConfigurationController> _logger;

        public MailConfigurationController(
            IMailConfigurationService mailConfigurationService,
            IEmailService emailService,
            IMapper mapper,
            ILogger<MailConfigurationController> logger)
        {
            _mailConfigurationService = mailConfigurationService;
            _emailService = emailService;
            _mapper = mapper;
            _logger = logger;
        }

        // ============ GET: api/v1/mailconfiguration ============
        [HttpGet]
        public async Task<IActionResult> GetConfiguration()
        {
            try
            {
                var config = await _mailConfigurationService.GetConfigurationAsync();
                var response = _mapper.Map<MailConfigurationDto>(config);
                response.Password = "********";  // Şifreyi gizle

                return Ok(new { success = true, data = response });
            }
            catch (NotFoundException ex)
            {
                return Ok(new { success = true, data = (MailConfigurationDto?)null, message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Mail konfigürasyonu alınırken hata oluştu");
                return StatusCode(500, new { success = false, message = "Mail konfigürasyonu alınırken bir hata oluştu" });
            }
        }

        // ============ GET: api/v1/mailconfiguration/active ============
        [HttpGet("active")]
        public async Task<IActionResult> GetActiveConfiguration()
        {
            try
            {
                var config = await _mailConfigurationService.GetActiveConfigurationAsync();
                var response = _mapper.Map<MailConfigurationDto>(config);
                response.Password = "********";

                return Ok(new { success = true, data = response });
            }
            catch (NotFoundException ex)
            {
                return NotFound(new { success = false, message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Aktif mail konfigürasyonu alınırken hata oluştu");
                return StatusCode(500, new { success = false, message = "Aktif mail konfigürasyonu alınırken bir hata oluştu" });
            }
        }

        // ============ POST: api/v1/mailconfiguration ============
        [HttpPost]
        public async Task<IActionResult> CreateConfiguration([FromBody] MailConfigurationDto request)
        {
            try
            {
                var config = _mapper.Map<MailConfiguration>(request);
                var createdConfig = await _mailConfigurationService.CreateConfigurationAsync(config);
                var response = _mapper.Map<MailConfigurationDto>(createdConfig);
                response.Password = "********";

                _logger.LogInformation($"✅ Yeni mail konfigürasyonu oluşturuldu - ID: {createdConfig.Id}");
                return Ok(new { success = true, data = response, message = "Mail konfigürasyonu başarıyla oluşturuldu" });
            }
            catch (BusinessRuleException ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Mail konfigürasyonu oluşturulurken hata oluştu");
                return StatusCode(500, new { success = false, message = "Mail konfigürasyonu oluşturulurken bir hata oluştu" });
            }
        }

        // ============ PUT: api/v1/mailconfiguration ============
        [HttpPut]
        public async Task<IActionResult> UpdateConfiguration([FromBody] MailConfigurationDto request)
        {
            try
            {
                var config = _mapper.Map<MailConfiguration>(request);
                var updatedConfig = await _mailConfigurationService.UpdateConfigurationAsync(config);
                var response = _mapper.Map<MailConfigurationDto>(updatedConfig);
                response.Password = "********";

                _logger.LogInformation($"✅ Mail konfigürasyonu güncellendi - ID: {updatedConfig.Id}");
                return Ok(new { success = true, data = response, message = "Mail konfigürasyonu başarıyla güncellendi" });
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
                _logger.LogError(ex, "Mail konfigürasyonu güncellenirken hata oluştu");
                return StatusCode(500, new { success = false, message = "Mail konfigürasyonu güncellenirken bir hata oluştu" });
            }
        }

        // ============ POST: api/v1/mailconfiguration/test ============
        [HttpPost("test")]
        public async Task<IActionResult> TestConfiguration([FromBody] TestMailRequestDto request)
        {
            try
            {
                //  1. Request'i kontrol et
                if (request == null || string.IsNullOrEmpty(request.TestEmail))
                {
                    return BadRequest(new { success = false, message = "E-posta adresi gerekli!" });
                }

                //  2. Config'i al
                var config = await _mailConfigurationService.GetActiveConfigurationAsync();
                if (config == null)
                {
                    return NotFound(new { success = false, message = "Mail konfigürasyonu bulunamadı!" });
                }

                //  3. Test mailini GÖNDER 
                var message = new MimeMessage();
                message.From.Add(new MailboxAddress(config.SenderName, config.SenderEmail));
                message.To.Add(MailboxAddress.Parse(request.TestEmail));
                message.Subject = "Test Maili - AcademyHub";
                message.Body = new TextPart("html")
                {
                    Text = $"<h1>✅ Test Başarılı!</h1><p>SMTP: {config.SmtpServer}</p><p>Tarih: {DateTime.Now}</p>"
                };

                using var client = new SmtpClient();
                await client.ConnectAsync(config.SmtpServer, config.SmtpPort, SecureSocketOptions.StartTls);
                await client.AuthenticateAsync(config.Username, config.Password);
                await client.SendAsync(message);
                await client.DisconnectAsync(true);

                //  4. Test sonucunu kaydet
                config.LastTestDate = DateTime.UtcNow;
                config.LastTestSuccess = true;
                config.LastTestError = null;
                await _mailConfigurationService.UpdateConfigurationAsync(config);

                return Ok(new { success = true, message = $"✅ Test maili gönderildi: {request.TestEmail}" });
            }
            catch (Exception ex)
            {
                //  5. Hata detayını DÖNDÜR
                return BadRequest(new
                {
                    success = false,
                    message = ex.Message,
                    detail = ex.InnerException?.Message
                });
            }
        }




        // ============ POST: api/v1/mailconfiguration/validate ============
        [HttpPost("validate")]
        public async Task<IActionResult> ValidateConfiguration([FromBody] MailConfigurationDto request)
        {
            try
            {
                var config = _mapper.Map<MailConfiguration>(request);
                var result = await _emailService.ValidateConfigurationAsync(config);

                if (result)
                {
                    return Ok(new { success = true, message = "Mail konfigürasyonu geçerli" });
                }
                else
                {
                    return BadRequest(new
                    {
                        success = false,
                        message = "Mail konfigürasyonu geçersiz. Lütfen ayarları kontrol edin."
                    });
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Mail konfigürasyonu doğrulanırken hata oluştu");
                return StatusCode(500, new
                {
                    success = false,
                    message = $"Mail konfigürasyonu doğrulanırken bir hata oluştu: {ex.Message}"
                });
            }
        }
    }
}