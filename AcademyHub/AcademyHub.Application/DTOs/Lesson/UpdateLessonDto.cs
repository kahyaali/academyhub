using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AcademyHub.Application.DTOs.Lesson
{
    public class UpdateLessonDto
    {
        [Required(ErrorMessage = "Ders başlığı gereklidir")]
        [MinLength(3, ErrorMessage = "Ders başlığı en az 3 karakter olmalıdır")]
        [MaxLength(200, ErrorMessage = "Ders başlığı en fazla 200 karakter olmalıdır")]
        public string Title { get; set; } = string.Empty;

        [MaxLength(1000, ErrorMessage = "Açıklama en fazla 1000 karakter olmalıdır")]
        public string? Description { get; set; }

        public string? VideoUrl { get; set; }
        public string? VideoDuration { get; set; }

        public int Order { get; set; }

        public bool IsPreview { get; set; }

        public string? ResourceUrl { get; set; }
        public string? ResourceFileName { get; set; }
    }
}
