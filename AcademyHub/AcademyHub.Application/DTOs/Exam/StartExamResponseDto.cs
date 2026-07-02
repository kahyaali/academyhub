using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AcademyHub.Application.DTOs.Exam
{
    public class StartExamResponseDto
    {
        public int ExamResultId { get; set; }
        public int ExamId { get; set; }
        public string ExamTitle { get; set; } = string.Empty;
        public int DurationMinutes { get; set; }
        public DateTime StartTime { get; set; }
        public DateTime EndTime { get; set; }
        public int TotalQuestions { get; set; }
        public int TotalPoints { get; set; }
        public List<QuestionResponseDto> Questions { get; set; } = new();
    }
}
