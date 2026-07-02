using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AcademyHub.Application.DTOs.Review
{
    public class ReviewResponseDto
    {
        public int Id { get; set; }
        public string? Comment { get; set; }
        public int Rating { get; set; }
        public int CourseId { get; set; }
        public string? CourseTitle { get; set; }
        public int UserId { get; set; }
        public string? UserName { get; set; }
        public bool IsApproved { get; set; }
        public DateTime? ApprovedDate { get; set; }
        public DateTime CreatedDate { get; set; }
    }
}
