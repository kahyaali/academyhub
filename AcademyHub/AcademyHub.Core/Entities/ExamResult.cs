using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AcademyHub.Core.Entities
{
    public class ExamResult:BaseEntity
    {
        public int StudentId { get; set; }
        public int ExamId { get; set; }
        public int Score { get; set; }
        public bool IsPassed { get; set; }
        public DateTime StartTime { get; set; }
        public DateTime EndTime { get; set; }
        public int CorrectAnswers { get; set; }
        public int WrongAnswers { get; set; }
        public int TotalQuestions { get; set; }
        public int TotalPoints { get; set; }
        public string? StudentAnswers { get; set; }

        // Navigation Properties
        public virtual User Student { get; set; } = null!;
        public virtual Exam Exam { get; set; } = null!;
    }
}
