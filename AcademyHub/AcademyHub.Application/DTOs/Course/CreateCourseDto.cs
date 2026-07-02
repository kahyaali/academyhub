using AcademyHub.Core.Enums;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AcademyHub.Application.DTOs.Course
{
    public class CreateCourseDto
    {
        [Required(ErrorMessage = "Kurs başlığı gereklidir")]
        [MinLength(3, ErrorMessage = "Kurs başlığı en az 3 karakter olmalıdır")]
        [MaxLength(200, ErrorMessage = "Kurs başlığı en fazla 200 karakter olmalıdır")]
        public string Title { get; set; } = string.Empty;

        [Required(ErrorMessage = "Kurs açıklaması gereklidir")]
        [MinLength(10, ErrorMessage = "Kurs açıklaması en az 10 karakter olmalıdır")]
        [MaxLength(5000, ErrorMessage = "Kurs açıklaması en fazla 5000 karakter olmalıdır")]
        public string Description { get; set; } = string.Empty;

        [MaxLength(500, ErrorMessage = "Kısa açıklama en fazla 500 karakter olmalıdır")]
        public string? ShortDescription { get; set; }

        public string? CoverImage { get; set; }
        public string? PreviewVideoUrl { get; set; }

        [Range(0, 99999.99, ErrorMessage = "Fiyat 0 ile 99999.99 arasında olmalıdır")]
        public decimal Price { get; set; }
        public Currency Currency { get; set; } = Currency.TL;

        public bool IsFree { get; set; }

        [Required(ErrorMessage = "Kategori seçimi gereklidir")]
        public int CategoryId { get; set; }

        public CourseLevel Level { get; set; } = CourseLevel.AllLevels;

        [MinLength(20, ErrorMessage = "Kurs içeriği en az 20 karakter olmalıdır")]
        public string? WhatYouWillLearn { get; set; }

        public string? Requirements { get; set; }
        public string? TargetAudience { get; set; }

        public int? InstructorId { get; set; }

        public bool IsPublished { get; set; } = false;
    }
}
