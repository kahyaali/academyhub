using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AcademyHub.Application.DTOs.Instructor
{
    public class InstructorResponseDto
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string FullName => $"{FirstName} {LastName}";
        public string? Bio { get; set; }
        public string? Expertise { get; set; }
        public string? ProfileImage { get; set; }
        public bool IsActive { get; set; }
        public decimal TotalEarnings { get; set; }
        public int TotalStudents { get; set; }
        public int TotalCourses { get; set; }
        public double AverageRating { get; set; }
        public string Email { get; set; } = string.Empty;

        public string? PhoneNumber { get; set; }
        public string? Address { get; set; }
        public DateTime CreatedDate { get; set; }
    }
}
