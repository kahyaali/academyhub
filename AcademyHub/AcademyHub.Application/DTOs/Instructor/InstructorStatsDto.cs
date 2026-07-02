using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AcademyHub.Application.DTOs.Instructor
{
    public class InstructorStatsDto
    {
        public int TotalCourses { get; set; }
        public int TotalStudents { get; set; }
        public decimal TotalEarnings { get; set; }
        public double AverageRating { get; set; }
    }
}
