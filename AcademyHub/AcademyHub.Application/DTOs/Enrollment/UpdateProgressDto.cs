using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AcademyHub.Application.DTOs.Enrollment
{
    public class UpdateProgressDto
    {
        [Required(ErrorMessage = "Kayıt ID gereklidir")]
        public int EnrollmentId { get; set; }

        [Required(ErrorMessage = "Ders ID gereklidir")]
        public int LessonId { get; set; }

        [Required(ErrorMessage = "İzlenme süresi gereklidir")]
        public int WatchTimeSeconds { get; set; }
    }
}
