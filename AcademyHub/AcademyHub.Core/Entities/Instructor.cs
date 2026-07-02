using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AcademyHub.Core.Entities
{
    public class Instructor : BaseEntity
    {
        public int UserId { get; set; }
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string? Bio { get; set; }
        public string? Expertise { get; set; }
        public string? ProfileImage { get; set; }
        public bool IsActive { get; set; } = true;
        public decimal TotalEarnings { get; set; } = 0;
        public int TotalStudents { get; set; } = 0;
        public int TotalCourses { get; set; } = 0;
        public int PublishedCourses { get; set; } = 0;  
        public int TotalReviews { get; set; } = 0;    
        public double AverageRating { get; set; } = 0;

        // Navigation
        public virtual User User { get; set; } = null!;
        public virtual ICollection<Course> Courses { get; set; } = new List<Course>();
    }
}