using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AcademyHub.Application.DTOs.Exam
{
    public class ExamResultResponseDto
    {
        public int Id { get; set; }
        public int StudentId { get; set; }
        public string StudentName { get; set; } = string.Empty;
        public string StudentEmail { get; set; } = string.Empty;
        public int ExamId { get; set; }
        public string ExamTitle { get; set; } = string.Empty;
        public int Score { get; set; }
        public bool IsPassed { get; set; }
        public DateTime StartTime { get; set; }
        public DateTime EndTime { get; set; }
        public int CorrectAnswers { get; set; }
        public int WrongAnswers { get; set; }
        public int TotalQuestions { get; set; }
        public int TotalPoints { get; set; }
        public Dictionary<int, int>? StudentAnswers { get; set; }
        public DateTime CreatedDate { get; set; }
    }
}
