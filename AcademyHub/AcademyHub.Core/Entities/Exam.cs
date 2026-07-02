using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AcademyHub.Core.Entities
{
    public class Exam:BaseEntity
    {
        public string Title { get; set; } = string.Empty;
        public string? Description { get; set; }
        public int CourseId { get; set; }
        public int DurationMinutes { get; set; }
        public int PassingScore { get; set; }
        public bool IsPublished { get; set; }
        public int Order { get; set; }

        // Navigation Properties
        public virtual Course Course { get; set; } = null!;
        public virtual ICollection<Question> Questions { get; set; } = new List<Question>();
        public virtual ICollection<ExamResult> ExamResults { get; set; } = new List<ExamResult>();
    }
}
