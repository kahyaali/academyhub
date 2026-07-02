using AcademyHub.Core.Enums;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AcademyHub.Application.DTOs.Course
{
    public class CourseResponseDto
    {
        public int Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string? ShortDescription { get; set; }
        public string? CoverImage { get; set; }
        public string? PreviewVideoUrl { get; set; }
        public decimal Price { get; set; }
        public Currency Currency { get; set; } = Currency.TL;

        public string CurrencySymbol { get; set; } = string.Empty;  // "$", "€", "₺", "£"
        public string FormattedPrice { get; set; } = string.Empty;  // "$150.00", "€200.00"
        public string CurrencyCode { get; set; } = string.Empty;    // "USD", "EUR", "TL", "GBP"
        public bool IsFree { get; set; }
        public int CategoryId { get; set; }
        public string CategoryName { get; set; } = string.Empty;
        public int InstructorId { get; set; }
        public string InstructorName { get; set; } = string.Empty;
        public CourseLevel Level { get; set; }
        public string? WhatYouWillLearn { get; set; }
        public string? Requirements { get; set; }
        public string? TargetAudience { get; set; }
        public bool IsPublished { get; set; }
        public DateTime? PublishedDate { get; set; }
        public double AverageRating { get; set; }
        public int TotalEnrollments { get; set; }
        public int TotalReviews { get; set; }
        public int TotalStudents { get; set; }
        public int LessonCount { get; set; }
        public int TotalDurationInMinutes { get; set; }
        public DateTime CreatedDate { get; set; }
        public DateTime? UpdatedDate { get; set; }
    }
}
