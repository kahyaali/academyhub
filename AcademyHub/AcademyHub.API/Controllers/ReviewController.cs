using AcademyHub.Application.DTOs.Review;
using AcademyHub.Core.Exceptions;
using AcademyHub.Core.Interfaces.Services;
using AutoMapper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace AcademyHub.API.Controllers
{
    [Route("api/v1/[controller]")]
    [ApiController]
    public class ReviewController : ControllerBase
    {
        private readonly IReviewService _reviewService;
        private readonly IMapper _mapper;
        private readonly ILogger<ReviewController> _logger;

        public ReviewController(
            IReviewService reviewService,
            IMapper mapper,
            ILogger<ReviewController> logger)
        {
            _reviewService = reviewService;
            _mapper = mapper;
            _logger = logger;
        }

        // ============ GET: api/v1/review/course/{courseId} ============
        [HttpGet("course/{courseId}")]
        [AllowAnonymous]
        public async Task<IActionResult> GetReviewsByCourse(int courseId)
        {
            try
            {
                var reviews = await _reviewService.GetReviewsByCourseIdAsync(courseId);
                var averageRating = await _reviewService.GetAverageRatingByCourseIdAsync(courseId);
                var totalReviews = await _reviewService.GetReviewCountByCourseIdAsync(courseId);

                var response = _mapper.Map<IEnumerable<ReviewResponseDto>>(reviews);

                return Ok(new
                {
                    success = true,
                    data = new
                    {
                        reviews = response,
                        averageRating,
                        totalReviews
                    }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Yorumlar listelenirken hata oluştu - CourseId: {courseId}");
                return StatusCode(500, new { success = false, message = "Yorumlar listelenirken bir hata oluştu" });
            }
        }

        // ============ GET: api/v1/review/me ============
        [HttpGet("me")]
        [Authorize]
        public async Task<IActionResult> GetMyReviews()
        {
            try
            {
                var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
                var reviews = await _reviewService.GetReviewsByUserIdAsync(userId);
                var response = _mapper.Map<IEnumerable<ReviewResponseDto>>(reviews);
                return Ok(new { success = true, data = response });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Kendi yorumlarım listelenirken hata oluştu");
                return StatusCode(500, new { success = false, message = "Yorumlar listelenirken bir hata oluştu" });
            }
        }

        // ============ GET: api/v1/review/{id} ============
        [HttpGet("{id}")]
        public async Task<IActionResult> GetReviewById(int id)
        {
            try
            {
                var review = await _reviewService.GetReviewByIdAsync(id);
                var response = _mapper.Map<ReviewResponseDto>(review);
                return Ok(new { success = true, data = response });
            }
            catch (NotFoundException ex)
            {
                return NotFound(new { success = false, message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Yorum detayı alınırken hata oluştu - ID: {id}");
                return StatusCode(500, new { success = false, message = "Yorum detayı alınırken bir hata oluştu" });
            }
        }

        // ============ GET: api/v1/review/pending ============
        [HttpGet("pending")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetPendingReviews()
        {
            try
            {
                var reviews = await _reviewService.GetPendingReviewsAsync();
                var response = _mapper.Map<IEnumerable<ReviewResponseDto>>(reviews);
                return Ok(new { success = true, data = response });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Bekleyen yorumlar listelenirken hata oluştu");
                return StatusCode(500, new { success = false, message = "Yorumlar listelenirken bir hata oluştu" });
            }
        }

        // ============ POST: api/v1/review ============
        [HttpPost]
        [Authorize]
        public async Task<IActionResult> CreateReview([FromBody] CreateReviewDto request)
        {
            try
            {
                var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");

                var review = await _reviewService.CreateReviewAsync(
                    userId,
                    request.CourseId,
                    request.Rating,
                    request.Comment);

                var response = _mapper.Map<ReviewResponseDto>(review);

                _logger.LogInformation($"✅ Yeni yorum oluşturuldu - ID: {review.Id}, Kullanıcı: {userId}, Kurs: {request.CourseId}");
                return Ok(new { success = true, data = response, message = "Yorumunuz admin onayına gönderildi" });
            }
            catch (BusinessRuleException ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
            catch (NotFoundException ex)
            {
                return NotFound(new { success = false, message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Yorum oluşturulurken hata oluştu");
                return StatusCode(500, new { success = false, message = "Yorum oluşturulurken bir hata oluştu" });
            }
        }

        // ============ PUT: api/v1/review/{id} ============
        [HttpPut("{id}")]
        [Authorize]
        public async Task<IActionResult> UpdateReview(int id, [FromBody] UpdateReviewDto request)
        {
            try
            {
                var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
                var userRole = User.FindFirst(ClaimTypes.Role)?.Value;

                var review = await _reviewService.GetReviewByIdAsync(id);

                // Sadece sahibi veya admin güncelleyebilir
                if (userRole != "Admin" && review.UserId != userId)
                    return Forbid();

                var updatedReview = await _reviewService.UpdateReviewAsync(id, request.Rating, request.Comment);
                var response = _mapper.Map<ReviewResponseDto>(updatedReview);

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
                _logger.LogError(ex, $"Yorum güncellenirken hata oluştu - ID: {id}");
                return StatusCode(500, new { success = false, message = "Yorum güncellenirken bir hata oluştu" });
            }
        }

        // ============ DELETE: api/v1/review/{id} ============
        [HttpDelete("{id}")]
        [Authorize]
        public async Task<IActionResult> DeleteReview(int id)
        {
            try
            {
                var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
                var userRole = User.FindFirst(ClaimTypes.Role)?.Value;

                var review = await _reviewService.GetReviewByIdAsync(id);

                // Sadece sahibi veya admin silebilir
                if (userRole != "Admin" && review.UserId != userId)
                    return Forbid();

                await _reviewService.DeleteReviewAsync(id);

                return Ok(new { success = true, message = "Yorum başarıyla silindi" });
            }
            catch (NotFoundException ex)
            {
                return NotFound(new { success = false, message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Yorum silinirken hata oluştu - ID: {id}");
                return StatusCode(500, new { success = false, message = "Yorum silinirken bir hata oluştu" });
            }
        }


        // ============ POST: api/v1/review/{id}/approve ============
        [HttpPost("{id}/approve")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> ApproveReview(int id)
        {
            try
            {
                var review = await _reviewService.ApproveReviewAsync(id);

                var response = _mapper.Map<ReviewResponseDto>(review);

                return Ok(new
                {
                    success = true,
                    data = response,
                    message = "Yorum başarıyla onaylandı"
                });
            }
            catch (NotFoundException ex)
            {
                return NotFound(new { success = false, message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Yorum onaylanırken hata oluştu - ID: {id}");
                return StatusCode(500, new { success = false, message = "Yorum onaylanırken bir hata oluştu" });
            }
        }

        // ============ POST: api/v1/review/{id}/reject ============
        [HttpPost("{id}/reject")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> RejectReview(int id)
        {
            try
            {
                var review = await _reviewService.RejectReviewAsync(id);

                var response = _mapper.Map<ReviewResponseDto>(review);

                return Ok(new
                {
                    success = true,
                    data = response,
                    message = "Yorum başarıyla reddedildi"
                });
            }
            catch (NotFoundException ex)
            {
                return NotFound(new { success = false, message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Yorum reddedilirken hata oluştu - ID: {id}");
                return StatusCode(500, new { success = false, message = "Yorum reddedilirken bir hata oluştu" });
            }
        }


    }
}