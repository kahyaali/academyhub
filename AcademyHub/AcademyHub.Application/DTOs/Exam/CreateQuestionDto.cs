using AcademyHub.Core.Enums;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AcademyHub.Application.DTOs.Exam
{
    public class CreateQuestionDto
    {
        [Required(ErrorMessage = "Soru metni gereklidir")]
        [MinLength(5, ErrorMessage = "Soru metni en az 5 karakter olmalıdır")]
        public string Text { get; set; } = string.Empty;

        [Required(ErrorMessage = "Sınav ID gereklidir")]
        public int ExamId { get; set; }

        [Required(ErrorMessage = "Soru tipi gereklidir")]
        public QuestionType Type { get; set; }

        [Required(ErrorMessage = "Puan gereklidir")]
        [Range(1, 100, ErrorMessage = "Puan 1-100 arasında olmalıdır")]
        public int Points { get; set; }

        public string? Explanation { get; set; }

        [Required(ErrorMessage = "Cevaplar gereklidir")]
        [MinLength(2, ErrorMessage = "En az 2 cevap olmalıdır")]
        public List<CreateAnswerDto> Answers { get; set; } = new();
    }
}
