using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AcademyHub.Application.DTOs.Exam
{
    public class SubmitExamDto
    {
        [Required(ErrorMessage = "Sınav sonuç ID gereklidir")]
        public int ExamResultId { get; set; }

        [Required(ErrorMessage = "Cevaplar gereklidir")]
        public Dictionary<int, int> Answers { get; set; } = new();
    }
}
