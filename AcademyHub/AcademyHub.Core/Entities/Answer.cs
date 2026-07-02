using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AcademyHub.Core.Entities
{
    public class Answer:BaseEntity
    {
        public string Text { get; set; } = string.Empty;
        public int QuestionId { get; set; }
        public bool IsCorrect { get; set; }

        // Navigation Properties
        public virtual Question Question { get; set; } = null!;
    }
}
