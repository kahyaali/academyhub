using AcademyHub.Core.Enums;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AcademyHub.Core.Entities
{
    public class Question:BaseEntity
    {
        public string Text { get; set; } = string.Empty;
        public int ExamId { get; set; }
        public QuestionType Type { get; set; }
        public int Points { get; set; }
        public string? Explanation { get; set; }

        // Navigation Properties
        public virtual Exam Exam { get; set; } = null!;
        public virtual ICollection<Answer> Answers { get; set; } = new List<Answer>();
    }
}
