using AcademyHub.Core.Enums;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AcademyHub.Core.Entities
{
    public class Enrollment:BaseEntity
    {
        public int StudentId { get; set; }  
        public int CourseId { get; set; }
        public DateTime EnrollmentDate { get; set; } = DateTime.UtcNow;
        public decimal PaidAmount { get; set; }
        public EnrollmentStatus Status { get; set; } = EnrollmentStatus.Active;
        public DateTime? CompletionDate { get; set; }
        public double ProgressPercentage { get; set; }
        public string? CertificateUrl { get; set; }
        public string? CertificateNumber { get; set; }
        public DateTime? CertificateIssuedDate { get; set; }
        public DateTime? LastActivityDate { get; set; }

        // Navigation
        public virtual Student Student { get; set; } = null!;  
        public virtual Course Course { get; set; } = null!;
        public virtual ICollection<LessonProgress> LessonProgresses { get; set; } = new List<LessonProgress>();
        public virtual ICollection<ExamResult> ExamResults { get; set; } = new List<ExamResult>();
    }
}
