using AcademyHub.Application.DTOs.Notification;
using AcademyHub.Core.Exceptions;
using AcademyHub.Core.Interfaces.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace AcademyHub.API.Controllers
{
    [Route("api/v1/[controller]")]
    [ApiController]
    [Authorize]
    public class NotificationController : ControllerBase
    {
        private readonly INotificationService _notificationService;
        private readonly ILogger<NotificationController> _logger;

        public NotificationController(INotificationService notificationService, ILogger<NotificationController> logger)
        {
            _notificationService = notificationService;
            _logger = logger;
        }

        // ============ GET: api/v1/notification ============
        [HttpGet]
        public async Task<IActionResult> GetMyNotifications()
        {
            try
            {
                var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
                var notifications = await _notificationService.GetUserNotificationsAsync(userId);

                return Ok(new { success = true, data = notifications });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Bildirimler listelenirken hata oluştu");
                return StatusCode(500, new { success = false, message = "Bildirimler listelenirken bir hata oluştu" });
            }
        }

        // ============ GET: api/v1/notification/unread ============
        [HttpGet("unread")]
        public async Task<IActionResult> GetUnreadNotifications()
        {
            try
            {
                var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
                var notifications = await _notificationService.GetUnreadNotificationsAsync(userId);
                var unreadCount = await _notificationService.GetUnreadCountAsync(userId);

                return Ok(new { success = true, data = notifications, unreadCount });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Okunmamış bildirimler listelenirken hata oluştu");
                return StatusCode(500, new { success = false, message = "Bildirimler listelenirken bir hata oluştu" });
            }
        }

        // ============ GET: api/v1/notification/count ============
        [HttpGet("count")]
        public async Task<IActionResult> GetUnreadCount()
        {
            try
            {
                var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
                var count = await _notificationService.GetUnreadCountAsync(userId);

                return Ok(new { success = true, data = new { unreadCount = count } });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Okunmamış bildirim sayısı alınırken hata oluştu");
                return StatusCode(500, new { success = false, message = "Bildirim sayısı alınırken bir hata oluştu" });
            }
        }

        // ============ GET: api/v1/notification/{id} ============
        [HttpGet("{id}")]
        public async Task<IActionResult> GetNotification(int id)
        {
            try
            {
                var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
                var userRole = User.FindFirst(ClaimTypes.Role)?.Value;

                var notification = await _notificationService.GetNotificationByIdAsync(id);

                if (userRole != "Admin" && notification.UserId != userId)
                    return Forbid();

                return Ok(new { success = true, data = notification });
            }
            catch (NotFoundException ex)
            {
                return NotFound(new { success = false, message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Bildirim detayı alınırken hata oluştu - ID: {id}");
                return StatusCode(500, new { success = false, message = "Bildirim detayı alınırken bir hata oluştu" });
            }
        }

        // ============ POST: api/v1/notification ============
        [HttpPost]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> CreateNotification([FromBody] CreateNotificationRequestDto request)
        {
            try
            {
                var notification = await _notificationService.CreateNotificationAsync(
                    request.UserId,
                    request.Title,
                    request.Message,
                    request.Type,
                    request.Link,
                    request.Icon);

                _logger.LogInformation($"Yeni bildirim oluşturuldu - ID: {notification.Id}, Kullanıcı: {request.UserId}");
                return Ok(new { success = true, data = notification });
            }
            catch (NotFoundException ex)
            {
                return NotFound(new { success = false, message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Bildirim oluşturulurken hata oluştu");
                return StatusCode(500, new { success = false, message = "Bildirim oluşturulurken bir hata oluştu" });
            }
        }

        // ============ POST: api/v1/notification/bulk ============
        [HttpPost("bulk")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> SendBulkNotification([FromBody] BulkNotificationRequestDto request)
        {
            try
            {
                await _notificationService.SendBulkNotificationAsync(
                    request.UserIds,
                    request.Title,
                    request.Message,
                    request.Type);

                _logger.LogInformation($"Toplu bildirim gönderildi - {request.UserIds.Count()} kullanıcıya");
                return Ok(new { success = true, message = $"Toplu bildirim {request.UserIds.Count()} kullanıcıya gönderildi" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Toplu bildirim gönderilirken hata oluştu");
                return StatusCode(500, new { success = false, message = "Toplu bildirim gönderilirken bir hata oluştu" });
            }
        }

        // ============ PUT: api/v1/notification/{id}/read ============
        [HttpPut("{id}/read")]
        public async Task<IActionResult> MarkAsRead(int id)
        {
            try
            {
                var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
                var userRole = User.FindFirst(ClaimTypes.Role)?.Value;

                var notification = await _notificationService.GetNotificationByIdAsync(id);

                if (userRole != "Admin" && notification.UserId != userId)
                    return Forbid();

                await _notificationService.MarkAsReadAsync(id);

                return Ok(new { success = true, message = "Bildirim okundu olarak işaretlendi" });
            }
            catch (NotFoundException ex)
            {
                return NotFound(new { success = false, message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Bildirim okundu işaretlenirken hata oluştu - ID: {id}");
                return StatusCode(500, new { success = false, message = "Bildirim okundu işaretlenirken bir hata oluştu" });
            }
        }

        // ============ PUT: api/v1/notification/read-all ============
        [HttpPut("read-all")]
        public async Task<IActionResult> MarkAllAsRead()
        {
            try
            {
                var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
                await _notificationService.MarkAllAsReadAsync(userId);

                return Ok(new { success = true, message = "Tüm bildirimler okundu olarak işaretlendi" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Tüm bildirimler okundu işaretlenirken hata oluştu");
                return StatusCode(500, new { success = false, message = "Bildirimler okundu işaretlenirken bir hata oluştu" });
            }
        }

        // ============ DELETE: api/v1/notification/{id} ============
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteNotification(int id)
        {
            try
            {
                var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
                var userRole = User.FindFirst(ClaimTypes.Role)?.Value;

                var notification = await _notificationService.GetNotificationByIdAsync(id);

                if (userRole != "Admin" && notification.UserId != userId)
                    return Forbid();

                await _notificationService.DeleteNotificationAsync(id);

                return Ok(new { success = true, message = "Bildirim başarıyla silindi" });
            }
            catch (NotFoundException ex)
            {
                return NotFound(new { success = false, message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Bildirim silinirken hata oluştu - ID: {id}");
                return StatusCode(500, new { success = false, message = "Bildirim silinirken bir hata oluştu" });
            }
        }

        // ============ DELETE: api/v1/notification ============
        [HttpDelete]
        public async Task<IActionResult> DeleteAllNotifications()
        {
            try
            {
                var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
                await _notificationService.DeleteAllNotificationsAsync(userId);

                return Ok(new { success = true, message = "Tüm bildirimler başarıyla silindi" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Tüm bildirimler silinirken hata oluştu");
                return StatusCode(500, new { success = false, message = "Bildirimler silinirken bir hata oluştu" });
            }
        }
    }
}
