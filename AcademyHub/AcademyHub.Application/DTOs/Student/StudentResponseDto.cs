using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AcademyHub.Application.DTOs.Student
{
    public class StudentResponseDto
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string FullName => $"{FirstName} {LastName}";
        public string? PhoneNumber { get; set; }
        public string? Address { get; set; }
        public DateTime? BirthDate { get; set; }
        public string? ProfileImage { get; set; }
        public bool IsActive { get; set; }
        public int TotalEnrollments { get; set; }
        public int CompletedCourses { get; set; }
        public double AverageProgress { get; set; }
        public string Email { get; set; } = string.Empty;
        public DateTime CreatedDate { get; set; }
        public string? Bio { get; set; }
    }
}
