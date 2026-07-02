using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AcademyHub.Application.DTOs.Exam
{
    public class UpdateAnswerDto
    {
        [Required(ErrorMessage = "Cevap metni gereklidir")]
        [MinLength(1, ErrorMessage = "Cevap metni en az 1 karakter olmalıdır")]
        public string Text { get; set; } = string.Empty;

        [Required(ErrorMessage = "Doğru cevap bilgisi gereklidir")]
        public bool IsCorrect { get; set; }
    }
}
