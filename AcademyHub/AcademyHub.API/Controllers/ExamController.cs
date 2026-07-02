using AcademyHub.Application.DTOs.Exam;
using AcademyHub.Core.Entities;
using AcademyHub.Core.Exceptions;
using AcademyHub.Core.Interfaces;
using AcademyHub.Core.Interfaces.Services;
using AutoMapper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace AcademyHub.API.Controllers
{
    [Route("api/v1/[controller]")]
    [ApiController]
    [Authorize]
    public class ExamController : ControllerBase
    {
        private readonly IExamService _examService;
        private readonly ICourseService _courseService;
        private readonly IMapper _mapper;
        private readonly ILogger<ExamController> _logger;
        private readonly IUnitOfWork _unitOfWork;

        public ExamController(
            IExamService examService,
            ICourseService courseService,
            IMapper mapper,
            ILogger<ExamController> logger,
            IUnitOfWork unitOfWork)
        {
            _examService = examService;
            _courseService = courseService;
            _mapper = mapper;
            _logger = logger;
            _unitOfWork = unitOfWork;
        }

        // ============ EXAM CRUD ============

        // GET: api/v1/exam/course/{courseId}
        [HttpGet("course/{courseId}")]
        public async Task<IActionResult> GetExamsByCourse(int courseId)
        {
            try
            {
                var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
                var userRole = User.FindFirst(ClaimTypes.Role)?.Value;

                var course = await _courseService.GetCourseByIdAsync(courseId);

                if (!course.IsPublished && userRole != "Admin" && userRole != "Instructor")
                    return Forbid();

                var exams = await _examService.GetExamsByCourseIdAsync(courseId);
                var response = _mapper.Map<IEnumerable<ExamResponseDto>>(exams);

                return Ok(new { success = true, data = response });
            }
            catch (NotFoundException ex)
            {
                return NotFound(new { success = false, message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Sınavlar listelenirken hata oluştu - CourseId: {courseId}");
                return StatusCode(500, new { success = false, message = "Sınavlar listelenirken bir hata oluştu" });
            }
        }

        // GET: api/v1/exam/instructor
        [HttpGet("instructor")]
        [Authorize(Roles = "Instructor,Admin")]
        public async Task<IActionResult> GetInstructorExams()
        {
            try
            {
                var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
                var userRole = User.FindFirst(ClaimTypes.Role)?.Value;

                var instructor = await _unitOfWork.GetRepository<Instructor>()
                    .SingleOrDefaultAsync(i => i.UserId == userId && !i.IsDeleted);

                if (instructor == null && userRole != "Admin")
                    return Unauthorized(new { success = false, message = "Eğitmen bulunamadı" });

                var courseIds = new List<int>();

                if (userRole == "Admin")
                {
                    var allCourses = await _courseService.GetAllCoursesAsync();
                    courseIds = allCourses.Select(c => c.Id).ToList();
                }
                else
                {
                    var courses = await _courseService.GetCoursesByInstructorAsync(instructor.Id);
                    courseIds = courses.Select(c => c.Id).ToList();
                }

                var exams = new List<Exam>();
                foreach (var courseId in courseIds)
                {
                    var courseExams = await _examService.GetExamsByCourseIdAsync(courseId);
                    exams.AddRange(courseExams);
                }

                var response = _mapper.Map<IEnumerable<ExamResponseDto>>(exams);

                return Ok(new { success = true, data = response });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Eğitmen sınavları listelenirken hata oluştu");
                return StatusCode(500, new { success = false, message = "Sınavlar listelenirken bir hata oluştu" });
            }
        }

        // GET: api/v1/exam/{id}
        [HttpGet("{id}")]
        public async Task<IActionResult> GetExam(int id)
        {
            try
            {
                var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
                var userRole = User.FindFirst(ClaimTypes.Role)?.Value;

                var exam = await _examService.GetExamByIdAsync(id);
                var course = await _courseService.GetCourseByIdAsync(exam.CourseId);

                if (!exam.IsPublished && userRole != "Admin" && userRole != "Instructor")
                    return Forbid();

                var questions = await _examService.GetQuestionsByExamIdAsync(id);
                var response = _mapper.Map<ExamResponseDto>(exam);
                response.QuestionCount = questions.Count();

                if (exam.IsPublished || userRole == "Admin" || userRole == "Instructor")
                {
                    response.Questions = _mapper.Map<List<QuestionResponseDto>>(questions);
                }

                return Ok(new { success = true, data = response });
            }
            catch (NotFoundException ex)
            {
                return NotFound(new { success = false, message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Sınav detayı alınırken hata oluştu - ID: {id}");
                return StatusCode(500, new { success = false, message = "Sınav detayı alınırken bir hata oluştu" });
            }
        }

        // POST: api/v1/exam
        [HttpPost]
        [Authorize(Roles = "Instructor,Admin")]
        public async Task<IActionResult> CreateExam([FromBody] CreateExamDto request)
        {
            try
            {
                var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
                var userRole = User.FindFirst(ClaimTypes.Role)?.Value;

                var course = await _courseService.GetCourseByIdAsync(request.CourseId);

                if (userRole != "Admin")
                {
                    var instructor = await _courseService.GetInstructorByUserIdAsync(userId);

                    if (instructor == null)
                    {
                        return BadRequest(new
                        {
                            success = false,
                            message = "Eğitmen profili bulunamadı."
                        });
                    }

                    if (course.InstructorId != instructor.Id)
                    {
                        return Forbid("Bu kursa sınav ekleme yetkiniz yok.");
                    }
                }

                var exam = _mapper.Map<Exam>(request);
                var createdExam = await _examService.CreateExamAsync(exam);
                var response = _mapper.Map<ExamResponseDto>(createdExam);

                _logger.LogInformation($"Yeni sınav oluşturuldu - ID: {createdExam.Id}, Başlık: {createdExam.Title}");
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
                _logger.LogError(ex, "Sınav oluşturulurken hata oluştu");
                return StatusCode(500, new { success = false, message = "Sınav oluşturulurken bir hata oluştu" });
            }
        }

        // PUT: api/v1/exam/{id}
        [HttpPut("{id}")]
        [Authorize(Roles = "Instructor,Admin")]
        public async Task<IActionResult> UpdateExam(int id, [FromBody] UpdateExamDto request)
        {
            try
            {
                var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
                var userRole = User.FindFirst(ClaimTypes.Role)?.Value;

                var exam = await _examService.GetExamByIdAsync(id);
                var course = await _courseService.GetCourseByIdAsync(exam.CourseId);

                if (userRole != "Admin")
                {
                    var instructor = await _courseService.GetInstructorByUserIdAsync(userId);

                    if (instructor == null)
                    {
                        return BadRequest(new
                        {
                            success = false,
                            message = "Eğitmen profili bulunamadı."
                        });
                    }

                    if (course.InstructorId != instructor.Id)
                    {
                        return Forbid("Bu sınavı düzenleme yetkiniz yok.");
                    }
                }

                var updatedExam = _mapper.Map(request, exam);
                updatedExam.Id = id;

                var result = await _examService.UpdateExamAsync(updatedExam);
                var response = _mapper.Map<ExamResponseDto>(result);

                _logger.LogInformation($"Sınav güncellendi - ID: {id}");
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
                _logger.LogError(ex, $"Sınav güncellenirken hata oluştu - ID: {id}");
                return StatusCode(500, new { success = false, message = "Sınav güncellenirken bir hata oluştu" });
            }
        }

        // DELETE: api/v1/exam/{id}
        [HttpDelete("{id}")]
        [Authorize(Roles = "Instructor,Admin")]
        public async Task<IActionResult> DeleteExam(int id)
        {
            try
            {
                var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
                var userRole = User.FindFirst(ClaimTypes.Role)?.Value;

                var exam = await _examService.GetExamByIdAsync(id);
                var course = await _courseService.GetCourseByIdAsync(exam.CourseId);

                if (userRole != "Admin")
                {
                    var instructor = await _courseService.GetInstructorByUserIdAsync(userId);

                    if (instructor == null)
                    {
                        return BadRequest(new
                        {
                            success = false,
                            message = "Eğitmen profili bulunamadı."
                        });
                    }

                    if (course.InstructorId != instructor.Id)
                    {
                        return Forbid("Bu sınavı silme yetkiniz yok.");
                    }
                }

                await _examService.DeleteExamAsync(id);

                _logger.LogInformation($"Sınav silindi - ID: {id}");
                return Ok(new { success = true, message = "Sınav başarıyla silindi" });
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
                _logger.LogError(ex, $"Sınav silinirken hata oluştu - ID: {id}");
                return StatusCode(500, new { success = false, message = "Sınav silinirken bir hata oluştu" });
            }
        }

        // POST: api/v1/exam/{id}/publish
        [HttpPost("{id}/publish")]
        [Authorize(Roles = "Instructor,Admin")]
        public async Task<IActionResult> PublishExam(int id)
        {
            try
            {
                var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
                var userRole = User.FindFirst(ClaimTypes.Role)?.Value;

                var exam = await _examService.GetExamByIdAsync(id);
                var course = await _courseService.GetCourseByIdAsync(exam.CourseId);

                if (userRole != "Admin")
                {
                    var instructor = await _courseService.GetInstructorByUserIdAsync(userId);

                    if (instructor == null)
                    {
                        return BadRequest(new
                        {
                            success = false,
                            message = "Eğitmen profili bulunamadı."
                        });
                    }

                    if (course.InstructorId != instructor.Id)
                    {
                        return Forbid("Bu sınavı yayınlama yetkiniz yok.");
                    }
                }

                await _examService.PublishExamAsync(id);

                _logger.LogInformation($"Sınav yayınlandı - ID: {id}");
                return Ok(new { success = true, message = "Sınav başarıyla yayınlandı" });
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
                _logger.LogError(ex, $"Sınav yayınlanırken hata oluştu - ID: {id}");
                return StatusCode(500, new { success = false, message = "Sınav yayınlanırken bir hata oluştu" });
            }
        }

        // POST: api/v1/exam/{id}/unpublish
        [HttpPost("{id}/unpublish")]
        [Authorize(Roles = "Instructor,Admin")]
        public async Task<IActionResult> UnpublishExam(int id)
        {
            try
            {
                var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
                var userRole = User.FindFirst(ClaimTypes.Role)?.Value;

                var exam = await _examService.GetExamByIdAsync(id);
                var course = await _courseService.GetCourseByIdAsync(exam.CourseId);

                if (userRole != "Admin")
                {
                    var instructor = await _courseService.GetInstructorByUserIdAsync(userId);

                    if (instructor == null)
                    {
                        return BadRequest(new
                        {
                            success = false,
                            message = "Eğitmen profili bulunamadı."
                        });
                    }

                    if (course.InstructorId != instructor.Id)
                    {
                        return Forbid("Bu sınavı yayından kaldırma yetkiniz yok.");
                    }
                }

                await _examService.UnpublishExamAsync(id);

                _logger.LogInformation($"Sınav yayından kaldırıldı - ID: {id}");
                return Ok(new { success = true, message = "Sınav yayından kaldırıldı" });
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
                _logger.LogError(ex, $"Sınav yayından kaldırılırken hata oluştu - ID: {id}");
                return StatusCode(500, new { success = false, message = "Sınav yayından kaldırılırken bir hata oluştu" });
            }
        }

        // ============ QUESTION CRUD ============

        // POST: api/v1/exam/question
        [HttpPost("question")]
        [Authorize(Roles = "Instructor,Admin")]
        public async Task<IActionResult> AddQuestion([FromBody] CreateQuestionDto request)
        {
            try
            {
                var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
                var userRole = User.FindFirst(ClaimTypes.Role)?.Value;

                var exam = await _examService.GetExamByIdAsync(request.ExamId);
                var course = await _courseService.GetCourseByIdAsync(exam.CourseId);

                if (userRole != "Admin")
                {
                    var instructor = await _courseService.GetInstructorByUserIdAsync(userId);

                    if (instructor == null)
                    {
                        return BadRequest(new
                        {
                            success = false,
                            message = "Eğitmen profili bulunamadı."
                        });
                    }

                    if (course.InstructorId != instructor.Id)
                    {
                        return Forbid("Bu sınava soru ekleme yetkiniz yok.");
                    }
                }

                var question = _mapper.Map<Question>(request);
                var createdQuestion = await _examService.AddQuestionAsync(question);

                foreach (var answerDto in request.Answers)
                {
                    var answer = _mapper.Map<Answer>(answerDto);
                    answer.QuestionId = createdQuestion.Id;
                    await _examService.AddAnswerAsync(answer);
                }

                var response = _mapper.Map<QuestionResponseDto>(createdQuestion);
                response.Answers = _mapper.Map<List<AnswerResponseDto>>(
                    await _examService.GetAnswersByQuestionIdAsync(createdQuestion.Id));

                _logger.LogInformation($"Yeni soru eklendi - ID: {createdQuestion.Id}, Sınav: {request.ExamId}");
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
                _logger.LogError(ex, "Soru eklenirken hata oluştu");
                return StatusCode(500, new { success = false, message = "Soru eklenirken bir hata oluştu" });
            }
        }

        // ============ EXAM TAKING ============

        // POST: api/v1/exam/{examId}/start
        [HttpPost("{examId}/start")]
        public async Task<IActionResult> StartExam(int examId)
        {
            try
            {
                var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");

                var result = await _examService.StartExamAsync(userId, examId);
                var exam = await _examService.GetExamByIdAsync(examId);
                var questions = await _examService.GetQuestionsByExamIdAsync(examId);

                var response = new StartExamResponseDto
                {
                    ExamResultId = result.Id,
                    ExamId = examId,
                    ExamTitle = exam.Title,
                    DurationMinutes = exam.DurationMinutes,
                    StartTime = result.StartTime,
                    EndTime = result.EndTime,
                    TotalQuestions = questions.Count(),
                    TotalPoints = questions.Sum(q => q.Points),
                    Questions = _mapper.Map<List<QuestionResponseDto>>(questions)
                };

                _logger.LogInformation($"Sınav başlatıldı - Kullanıcı: {userId}, Sınav: {examId}");
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
                _logger.LogError(ex, $"Sınav başlatılırken hata oluştu - ExamId: {examId}");
                return StatusCode(500, new { success = false, message = "Sınav başlatılırken bir hata oluştu" });
            }
        }

        // POST: api/v1/exam/submit
        [HttpPost("submit")]
        public async Task<IActionResult> SubmitExam([FromBody] SubmitExamDto request)
        {
            try
            {
                var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");

                var result = await _examService.SubmitExamAsync(request.ExamResultId, request.Answers);
                var response = _mapper.Map<ExamResultResponseDto>(result);

                _logger.LogInformation($"Sınav gönderildi - Sonuç ID: {result.Id}, Öğrenci: {userId}, Puan: {result.Score}");
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
                _logger.LogError(ex, "Sınav gönderilirken hata oluştu");
                return StatusCode(500, new { success = false, message = "Sınav gönderilirken bir hata oluştu" });
            }
        }

        // GET: api/v1/exam/result/{resultId}
        [HttpGet("result/{resultId}")]
        public async Task<IActionResult> GetExamResult(int resultId)
        {
            try
            {
                var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
                var userRole = User.FindFirst(ClaimTypes.Role)?.Value;

                var result = await _examService.GetExamResultAsync(resultId);
                var exam = await _examService.GetExamByIdAsync(result.ExamId);
                var course = await _courseService.GetCourseByIdAsync(exam.CourseId);

                if (userRole != "Admin" && userRole != "Instructor" && result.StudentId != userId)
                    return Forbid();

                var response = _mapper.Map<ExamResultResponseDto>(result);
                response.StudentName = $"{result.Student.FirstName} {result.Student.LastName}";
                response.StudentEmail = result.Student.Email;
                response.ExamTitle = exam.Title;

                return Ok(new { success = true, data = response });
            }
            catch (NotFoundException ex)
            {
                return NotFound(new { success = false, message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Sınav sonucu alınırken hata oluştu - ResultId: {resultId}");
                return StatusCode(500, new { success = false, message = "Sınav sonucu alınırken bir hata oluştu" });
            }
        }

        // GET: api/v1/exam/results/me
        [HttpGet("results/me")]
        public async Task<IActionResult> GetMyExamResults()
        {
            try
            {
                var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
                var results = await _examService.GetExamResultsByStudentAsync(userId);
                var response = _mapper.Map<IEnumerable<ExamResultResponseDto>>(results);

                return Ok(new { success = true, data = response });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Sınav sonuçları listelenirken hata oluştu");
                return StatusCode(500, new { success = false, message = "Sınav sonuçları listelenirken bir hata oluştu" });
            }
        }

        // GET: api/v1/exam/{examId}/results
        [HttpGet("{examId}/results")]
        [Authorize(Roles = "Instructor,Admin")]
        public async Task<IActionResult> GetExamResults(int examId)
        {
            try
            {
                var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
                var userRole = User.FindFirst(ClaimTypes.Role)?.Value;

                var exam = await _examService.GetExamByIdAsync(examId);
                var course = await _courseService.GetCourseByIdAsync(exam.CourseId);

                if (userRole != "Admin")
                {
                    var instructor = await _courseService.GetInstructorByUserIdAsync(userId);

                    if (instructor == null)
                    {
                        return BadRequest(new
                        {
                            success = false,
                            message = "Eğitmen profili bulunamadı."
                        });
                    }

                    if (course.InstructorId != instructor.Id)
                    {
                        return Forbid("Bu sınavın sonuçlarını görme yetkiniz yok.");
                    }
                }

                var results = await _examService.GetExamResultsByExamAsync(examId);
                var response = _mapper.Map<IEnumerable<ExamResultResponseDto>>(results);

                return Ok(new { success = true, data = response });
            }
            catch (NotFoundException ex)
            {
                return NotFound(new { success = false, message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Sınav sonuçları listelenirken hata oluştu - ExamId: {examId}");
                return StatusCode(500, new { success = false, message = "Sınav sonuçları listelenirken bir hata oluştu" });
            }
        }


        // GET: api/v1/exam/{examId}/questions
        [HttpGet("{examId}/questions")]
        [Authorize(Roles = "Instructor,Admin")]
        public async Task<IActionResult> GetExamQuestions(int examId)
        {
            try
            {
                var questions = await _examService.GetQuestionsByExamIdAsync(examId);
                var response = _mapper.Map<IEnumerable<QuestionResponseDto>>(questions);
                return Ok(new { success = true, data = response });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Sınav soruları alınırken hata oluştu - ExamId: {examId}");
                return StatusCode(500, new { success = false, message = "Sorular alınırken bir hata oluştu" });
            }
        }

        // DELETE: api/v1/exam/question/{questionId}
        [HttpDelete("question/{questionId}")]
        [Authorize(Roles = "Instructor,Admin")]
        public async Task<IActionResult> DeleteQuestion(int questionId)
        {
            try
            {
                await _examService.DeleteQuestionAsync(questionId);
                return Ok(new { success = true, message = "Soru başarıyla silindi" });
            }
            catch (NotFoundException ex)
            {
                return NotFound(new { success = false, message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Soru silinirken hata oluştu - QuestionId: {questionId}");
                return StatusCode(500, new { success = false, message = "Soru silinirken bir hata oluştu" });
            }
        }
    }
}