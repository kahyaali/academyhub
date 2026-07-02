using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AcademyHub.Application.DTOs.Lesson
{
    public class ReorderLessonsDto
    {
        [Required(ErrorMessage = "Kurs ID gereklidir")]
        public int CourseId { get; set; }

        [Required(ErrorMessage = "Ders sıralamaları gereklidir")]
        public Dictionary<int, int> LessonOrders { get; set; } = new Dictionary<int, int>();
    }
}
