using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AcademyHub.Application.DTOs.Exam
{
    public class ExamResponseDto
    {
        public int Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string? Description { get; set; }
        public int CourseId { get; set; }
        public string CourseTitle { get; set; } = string.Empty;
        public int DurationMinutes { get; set; }
        public int PassingScore { get; set; }
        public int Order { get; set; }
        public bool IsPublished { get; set; }
        public int QuestionCount { get; set; }
        public int TotalPoints { get; set; }
        public DateTime CreatedDate { get; set; }
        public DateTime? UpdatedDate { get; set; }
        public List<QuestionResponseDto>? Questions { get; set; }
    }
}
