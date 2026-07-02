using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AcademyHub.Application.DTOs.Enrollment
{
    public class CreateEnrollmentDto
    {
        [Required(ErrorMessage = "Öğrenci ID gereklidir")]
        public int StudentId { get; set; }

        [Required(ErrorMessage = "Kurs ID gereklidir")]
        public int CourseId { get; set; }

        public decimal PaidAmount { get; set; }
    }
}
