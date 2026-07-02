using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AcademyHub.Core.Entities
{
    public class Certificate:BaseEntity
    {
        public string CertificateNumber { get; set; } = string.Empty;
        public int StudentId { get; set; }
        public int CourseId { get; set; }
        public int EnrollmentId { get; set; }
        public string? PdfUrl { get; set; }
        public DateTime IssueDate { get; set; }
        public bool IsVerified { get; set; }
        public DateTime? VerifiedDate { get; set; }
        public int? VerifiedBy { get; set; }

        // Navigation
        public virtual Student Student { get; set; } = null!;
        public virtual Course Course { get; set; } = null!;
        public virtual Enrollment Enrollment { get; set; } = null!;
    }
}
