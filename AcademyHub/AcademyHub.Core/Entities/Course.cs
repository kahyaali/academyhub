using AcademyHub.Core.Enums;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AcademyHub.Core.Entities
{
    public class Course:BaseEntity
    {
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string? ShortDescription { get; set; }
        public string? CoverImage { get; set; }
        public string? PreviewVideoUrl { get; set; }
        public decimal Price { get; set; }
        public Currency Currency { get; set; } = Currency.TL;
        public bool IsFree { get; set; }
        public int CategoryId { get; set; }
        public int InstructorId { get; set; }  
        public CourseLevel Level { get; set; } = CourseLevel.AllLevels;
        public string? WhatYouWillLearn { get; set; }
        public string? Requirements { get; set; }
        public string? TargetAudience { get; set; }
        public bool IsPublished { get; set; }
        public DateTime? PublishedDate { get; set; }
        public double AverageRating { get; set; }
        public int TotalEnrollments { get; set; }
        public int TotalReviews { get; set; }
        public int TotalStudents { get; set; }
        public int TotalLessons { get; set; }
        public int TotalDurationInMinutes { get; set; }

        // Navigation Properties
        public virtual Instructor Instructor { get; set; } = null!;  
        public virtual Category Category { get; set; } = null!;
        public virtual ICollection<Lesson> Lessons { get; set; } = new List<Lesson>();
        public virtual ICollection<Enrollment> Enrollments { get; set; } = new List<Enrollment>();
        public virtual ICollection<Review> Reviews { get; set; } = new List<Review>();
        public virtual ICollection<Payment> Payments { get; set; } = new List<Payment>();
    }
}
