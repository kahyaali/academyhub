using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AcademyHub.Core.Entities
{
    public class Lesson:BaseEntity
    {
        public string Title { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string? VideoUrl { get; set; }
        public string? VideoDuration { get; set; }
        public int Order { get; set; }
        public bool IsPreview { get; set; }
        public int CourseId { get; set; }
        public string? ResourceUrl { get; set; }
        public string? ResourceFileName { get; set; }

        // Navigation Properties
        public virtual Course Course { get; set; } = null!;
        public virtual ICollection<LessonProgress> LessonProgresses { get; set; } = new List<LessonProgress>();
    }
}
