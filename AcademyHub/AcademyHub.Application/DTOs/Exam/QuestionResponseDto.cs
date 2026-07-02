using AcademyHub.Core.Enums;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AcademyHub.Application.DTOs.Exam
{
    public class QuestionResponseDto
    {
        public int Id { get; set; }
        public string Text { get; set; } = string.Empty;
        public int ExamId { get; set; }
        public QuestionType Type { get; set; }
        public int Points { get; set; }
        public string? Explanation { get; set; }
        public List<AnswerResponseDto> Answers { get; set; } = new();
    }
}
