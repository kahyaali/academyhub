using AcademyHub.Core.Enums;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AcademyHub.Application.DTOs.Enrollment
{
    public class EnrollmentResponseDto
    {
        public int Id { get; set; }
        public int StudentId { get; set; }
        public string StudentName { get; set; } = string.Empty;
        public string StudentEmail { get; set; } = string.Empty;
        public int CourseId { get; set; }
        public string CourseTitle { get; set; } = string.Empty;
        public string? CourseImage { get; set; }

        //  EĞİTMEN BİLGİLERİ 
        public int InstructorId { get; set; }
        public string InstructorName { get; set; } = string.Empty;
        public string? InstructorImage { get; set; }

        //  FİYAT BİLGİLERİ 
        public decimal Price { get; set; }
        public string Currency { get; set; } = string.Empty;
        public string FormattedPrice { get; set; } = string.Empty;

        //  DURUM BİLGİLERİ 
        public string Status { get; set; } = string.Empty;  
        public DateTime EnrollmentDate { get; set; }
        public DateTime? CompletionDate { get; set; }
        public double ProgressPercentage { get; set; }

        //  Sertifika bilgileri
        public string? CertificateUrl { get; set; }
        public bool HasCertificate { get; set; }  

        public decimal PaidAmount { get; set; }
        public string? CertificateNumber { get; set; }
        public DateTime? CertificateIssuedDate { get; set; }
        public DateTime? LastActivityDate { get; set; }
    }
}
