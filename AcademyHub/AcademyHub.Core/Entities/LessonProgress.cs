using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AcademyHub.Core.Entities
{
    public class LessonProgress:BaseEntity
    {
        public int EnrollmentId { get; set; }
        public int LessonId { get; set; }
        public bool IsCompleted { get; set; }
        public DateTime? CompletedDate { get; set; }
        public int WatchTimeSeconds { get; set; }
        public DateTime? LastWatchDate { get; set; }

        // Navigation Properties
        public virtual Enrollment Enrollment { get; set; } = null!;
        public virtual Lesson Lesson { get; set; } = null!;
    }
}
