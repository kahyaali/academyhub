using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AcademyHub.Application.DTOs.Review
{
    public class CreateReviewDto
    {
        [Required(ErrorMessage = "Kurs ID gereklidir")]
        public int CourseId { get; set; }

        [Required(ErrorMessage = "Puan gereklidir")]
        [Range(1, 5, ErrorMessage = "Puan 1-5 arasında olmalıdır")]
        public int Rating { get; set; }

        [MaxLength(1000, ErrorMessage = "Yorum en fazla 1000 karakter olabilir")]
        public string? Comment { get; set; }
    }
}
