using AcademyHub.Application.DTOs.Payment;
using AcademyHub.Core.Entities;
using AcademyHub.Core.Enums;
using AcademyHub.Core.Exceptions;
using AcademyHub.Core.Interfaces;
using AcademyHub.Core.Interfaces.Services;
using AcademyHub.Infrastructure.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace AcademyHub.API.Controllers
{
    [Route("api/v1/[controller]")]
    [ApiController]
    [Authorize]
    public class PaymentController : ControllerBase
    {
        private readonly IPaymentService _paymentService;
        private readonly IUnitOfWork _unitOfWork;
        private readonly ILogger<PaymentController> _logger;

        public PaymentController(
            IPaymentService paymentService,
            IUnitOfWork unitOfWork,
            ILogger<PaymentController> logger)
        {
            _paymentService = paymentService;
            _unitOfWork = unitOfWork;
            _logger = logger;
        }

        // ============ GET: api/v1/payment ============
        [HttpGet]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetAllPayments(
            [FromQuery] PaymentStatus? status = null,
            [FromQuery] int pageNumber = 1,
            [FromQuery] int pageSize = 10)
        {
            try
            {
                IEnumerable<Core.Entities.Payment> payments;

                if (status.HasValue)
                    payments = await _paymentService.GetPaymentsByStatusAsync(status.Value);
                else
                    payments = await _unitOfWork.GetRepository<Core.Entities.Payment>().FindAsync(p => !p.IsDeleted);

                var totalCount = payments.Count();
                var pagedItems = payments
                    .Skip((pageNumber - 1) * pageSize)
                    .Take(pageSize)
                    .ToList();

                return Ok(new
                {
                    success = true,
                    data = new
                    {
                        items = pagedItems,
                        totalCount,
                        pageNumber,
                        pageSize
                    }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Ödemeler listelenirken hata oluştu");
                return StatusCode(500, new { success = false, message = "Ödemeler listelenirken bir hata oluştu" });
            }
        }

        // ============ GET: api/v1/payment/me ============
        [HttpGet("me")]
        public async Task<IActionResult> GetMyPayments()
        {
            try
            {
                var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
                var payments = await _paymentService.GetPaymentsByUserAsync(userId);

                //  DEBUG - Konsola yaz
                foreach (var payment in payments)
                {
                    Console.WriteLine($"💳 Ödeme ID: {payment.Id}, Kurs: {payment.Course?.Title ?? "NULL"}, Tutar: {payment.Amount}");
                }

                return Ok(new { success = true, data = payments });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Kendi ödemelerim listelenirken hata oluştu");
                return StatusCode(500, new { success = false, message = "Ödemeler listelenirken bir hata oluştu" });
            }
        }

        // ============ GET: api/v1/payment/{id} ============
        [HttpGet("{id}")]
        public async Task<IActionResult> GetPayment(int id)
        {
            try
            {
                var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
                var userRole = User.FindFirst(ClaimTypes.Role)?.Value;

                var payment = await _paymentService.GetPaymentByIdAsync(id);

                // Yetki kontrolü
                if (userRole != "Admin" && payment.UserId != userId)
                    return Forbid();

                return Ok(new { success = true, data = payment });
            }
            catch (NotFoundException ex)
            {
                return NotFound(new { success = false, message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Ödeme detayı alınırken hata oluştu - ID: {id}");
                return StatusCode(500, new { success = false, message = "Ödeme detayı alınırken bir hata oluştu" });
            }
        }

        // ============ POST: api/v1/payment ============
        [HttpPost]
        public async Task<IActionResult> CreatePayment([FromBody] CreatePaymentRequestDto request)
        {
            try
            {
                var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");

                var payment = await _paymentService.CreatePaymentAsync(
                    userId,
                    request.CourseId,
                    request.Amount,
                    request.PaymentMethod,
                    request.PaymentDetails);

                _logger.LogInformation($"Yeni ödeme oluşturuldu - ID: {payment.Id}, Kullanıcı: {userId}, Tutar: {request.Amount}");

                // Gerçek ödeme entegrasyonu burada yapılacak
                // Şimdilik otomatik tamamlıyoruz (Test ortamı için)
                if (request.AutoComplete ?? true)
                {
                    var completedPayment = await _paymentService.CompletePaymentAsync(
                        payment.Id,
                        $"TEST-TXN-{DateTime.UtcNow.Ticks}");

                    return Ok(new
                    {
                        success = true,
                        data = completedPayment,
                        message = "Ödeme başarıyla tamamlandı"
                    });
                }

                return Ok(new
                {
                    success = true,
                    data = payment,
                    message = "Ödeme oluşturuldu, onay bekleniyor"
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
                _logger.LogError(ex, "Ödeme oluşturulurken hata oluştu");
                return StatusCode(500, new { success = false, message = "Ödeme oluşturulurken bir hata oluştu" });
            }
        }

        // ============ POST: api/v1/payment/{id}/complete ============
        [HttpPost("{id}/complete")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> CompletePayment(int id, [FromBody] CompletePaymentRequestDto request)
        {
            try
            {
                var payment = await _paymentService.CompletePaymentAsync(id, request.TransactionId);

                _logger.LogInformation($"Ödeme tamamlandı - ID: {id}, TransactionId: {request.TransactionId}");
                return Ok(new { success = true, data = payment, message = "Ödeme başarıyla tamamlandı" });
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
                _logger.LogError(ex, $"Ödeme tamamlanırken hata oluştu - ID: {id}");
                return StatusCode(500, new { success = false, message = "Ödeme tamamlanırken bir hata oluştu" });
            }
        }

        // ============ POST: api/v1/payment/{id}/fail ============
        [HttpPost("{id}/fail")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> FailPayment(int id, [FromBody] FailPaymentRequestDto request)
        {
            try
            {
                var payment = await _paymentService.FailPaymentAsync(id, request.ErrorMessage);

                _logger.LogInformation($"Ödeme başarısız - ID: {id}, Hata: {request.ErrorMessage}");
                return Ok(new { success = true, data = payment, message = "Ödeme başarısız olarak işaretlendi" });
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
                _logger.LogError(ex, $"Ödeme başarısız olarak işaretlenirken hata oluştu - ID: {id}");
                return StatusCode(500, new { success = false, message = "Ödeme işlemi sırasında bir hata oluştu" });
            }
        }

        // ============ POST: api/v1/payment/{id}/refund ============
        [HttpPost("{id}/refund")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> RefundPayment(int id, [FromBody] RefundPaymentRequestDto request)
        {
            try
            {
                var payment = await _paymentService.RefundPaymentAsync(id, request.RefundReason);

                _logger.LogInformation($"Ödeme iade edildi - ID: {id}, Sebep: {request.RefundReason}");
                return Ok(new { success = true, data = payment, message = "Ödeme başarıyla iade edildi" });
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
                _logger.LogError(ex, $"Ödeme iade edilirken hata oluştu - ID: {id}");
                return StatusCode(500, new { success = false, message = "Ödeme iade edilirken bir hata oluştu" });
            }
        }

        // ============ GET: api/v1/payment/stats/revenue ============
        [HttpGet("stats/revenue")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetRevenueStats()
        {
            try
            {
                var totalRevenue = await _paymentService.GetTotalRevenueAsync();
                var completedCount = await _paymentService.GetPaymentCountByStatusAsync(PaymentStatus.Completed);
                var pendingCount = await _paymentService.GetPaymentCountByStatusAsync(PaymentStatus.Pending);
                var failedCount = await _paymentService.GetPaymentCountByStatusAsync(PaymentStatus.Failed);
                var refundedCount = await _paymentService.GetPaymentCountByStatusAsync(PaymentStatus.Refunded);

                return Ok(new
                {
                    success = true,
                    data = new
                    {
                        totalRevenue,
                        completedCount,
                        pendingCount,
                        failedCount,
                        refundedCount
                    }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Gelir istatistikleri alınırken hata oluştu");
                return StatusCode(500, new { success = false, message = "İstatistikler alınırken bir hata oluştu" });
            }
        }

        // ============ GET: api/v1/payment/stats/instructor ============
        [HttpGet("stats/instructor")]
        [Authorize(Roles = "Instructor,Admin")]
        public async Task<IActionResult> GetInstructorEarnings()
        {
            try
            {
                var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
                var earnings = await _paymentService.GetInstructorEarningsAsync(userId);

                return Ok(new { success = true, data = new { totalEarnings = earnings } });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Eğitmen kazancı alınırken hata oluştu");
                return StatusCode(500, new { success = false, message = "Kazanç bilgisi alınırken bir hata oluştu" });
            }
        }



        // ============ POST: api/v1/payment/{id}/request-refund ============
        [HttpPost("{id}/request-refund")]
        [Authorize(Roles = "Student")]
        public async Task<IActionResult> RequestRefund(int id, [FromBody] RequestRefundDto request)
        {
            try
            {
                var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");

                var payment = await _paymentService.GetPaymentByIdAsync(id);

                //  Ödeme bu kullanıcıya ait mi kontrol et
                if (payment.UserId != userId)
                    return Forbid();

                //  İade talebi oluştur
                var refundRequest = await _paymentService.RequestRefundAsync(id, request.Reason);

                _logger.LogInformation($"İade talebi oluşturuldu - PaymentId: {id}, UserId: {userId}");

                return Ok(new
                {
                    success = true,
                    data = refundRequest,
                    message = "İade talebiniz başarıyla oluşturuldu. Admin onayı bekleniyor."
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
                _logger.LogError(ex, $"İade talebi oluşturulurken hata oluştu - ID: {id}");
                return StatusCode(500, new { success = false, message = "İade talebi oluşturulurken bir hata oluştu" });
            }
        }

        // ============ GET: api/v1/payment/refund-requests ============
        [HttpGet("refund-requests")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetRefundRequests()
        {
            try
            {
                //  RefundRequested (5) statüsündeki ödemeleri getir
                var payments = await _unitOfWork.GetRepository<Payment>()
                    .Query()
                    .Include(p => p.Course)
                    .Include(p => p.User)
                    .Where(p => p.Status == PaymentStatus.RefundRequested && !p.IsDeleted)
                    .OrderByDescending(p => p.RefundDate)
                    .ToListAsync();

                return Ok(new { success = true, data = payments });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "İade talepleri listelenirken hata oluştu");
                return StatusCode(500, new { success = false, message = "İade talepleri listelenirken bir hata oluştu" });
            }
        }

        // ============ POST: api/v1/payment/{id}/approve-refund ============
        [HttpPost("{id}/approve-refund")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> ApproveRefund(int id)
        {
            try
            {
                var payment = await _paymentService.ApproveRefundAsync(id);

                _logger.LogInformation($"✅ İade onaylandı - PaymentId: {id}");

                return Ok(new
                {
                    success = true,
                    data = payment,
                    message = "İade başarıyla onaylandı ve gerçekleştirildi"
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
                _logger.LogError(ex, $"İade onaylanırken hata oluştu - ID: {id}");
                return StatusCode(500, new { success = false, message = "İade onaylanırken bir hata oluştu" });
            }
        }

        // ============ POST: api/v1/payment/{id}/reject-refund ============
        [HttpPost("{id}/reject-refund")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> RejectRefund(int id, [FromBody] RejectRefundDto request)
        {
            try
            {
                var payment = await _paymentService.RejectRefundAsync(id, request.Reason);

                _logger.LogInformation($"❌ İade reddedildi - PaymentId: {id}");

                return Ok(new
                {
                    success = true,
                    data = payment,
                    message = "İade talebi reddedildi"
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
                _logger.LogError(ex, $"İade reddedilirken hata oluştu - ID: {id}");
                return StatusCode(500, new { success = false, message = "İade reddedilirken bir hata oluştu" });
            }
        }

        // ============ GET: api/v1/payment/refundable ============
        [HttpGet("refundable")]
        public async Task<IActionResult> GetRefundablePayments()
        {
            try
            {
                var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
                var userRole = User.FindFirst(ClaimTypes.Role)?.Value;

                // Admin ise tüm iade edilebilir ödemeleri getir
                if (userRole == "Admin")
                {
                    var allPayments = await _unitOfWork.GetRepository<Payment>()
                        .Query()
                        .Include(p => p.Course)
                        .Include(p => p.User)
                        .Where(p => p.Status == PaymentStatus.Completed
                                    && !p.IsDeleted
                                    && p.PaymentDate >= DateTime.UtcNow.AddDays(-30))
                        .OrderByDescending(p => p.PaymentDate)
                        .ToListAsync();

                    return Ok(new { success = true, data = allPayments });
                }

                // Öğrenci ise kendi iade edilebilir ödemelerini getir
                var payments = await _paymentService.GetRefundablePaymentsByUserAsync(userId);
                return Ok(new { success = true, data = payments });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "İade edilebilir ödemeler alınırken hata oluştu");
                return StatusCode(500, new { success = false, message = "Ödemeler alınırken bir hata oluştu" });
            }
        }
    }
}

