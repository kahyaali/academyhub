using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AcademyHub.Application.DTOs.Certificate
{
    public class CertificateResponseDto
    {
        public int Id { get; set; }
        public string CertificateNumber { get; set; } = string.Empty;
        public int StudentId { get; set; }
        public string StudentName { get; set; } = string.Empty;
        public string StudentEmail { get; set; } = string.Empty;
        public int CourseId { get; set; }
        public string CourseTitle { get; set; } = string.Empty;
        public int EnrollmentId { get; set; }
        public string? PdfUrl { get; set; }
        public DateTime IssueDate { get; set; }
        public bool IsVerified { get; set; }
        public DateTime? VerifiedDate { get; set; }
        public DateTime CreatedDate { get; set; }
    }
}
