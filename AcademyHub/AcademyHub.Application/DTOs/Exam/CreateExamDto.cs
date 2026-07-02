using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AcademyHub.Application.DTOs.Exam
{
    public class CreateExamDto
    {
        [Required(ErrorMessage = "Sınav başlığı gereklidir")]
        [MinLength(3, ErrorMessage = "Başlık en az 3 karakter olmalıdır")]
        [MaxLength(200, ErrorMessage = "Başlık en fazla 200 karakter olmalıdır")]
        public string Title { get; set; } = string.Empty;

        [MaxLength(1000, ErrorMessage = "Açıklama en fazla 1000 karakter olmalıdır")]
        public string? Description { get; set; }

        [Required(ErrorMessage = "Kurs ID gereklidir")]
        public int CourseId { get; set; }

        [Required(ErrorMessage = "Süre gereklidir")]
        [Range(1, 180, ErrorMessage = "Süre 1-180 dakika arasında olmalıdır")]
        public int DurationMinutes { get; set; }

        [Required(ErrorMessage = "Geçme notu gereklidir")]
        [Range(1, 100, ErrorMessage = "Geçme notu 1-100 arasında olmalıdır")]
        public int PassingScore { get; set; }

        public int Order { get; set; } = 0;
    }
}
