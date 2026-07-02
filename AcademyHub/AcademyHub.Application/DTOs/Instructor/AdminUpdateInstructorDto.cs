using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AcademyHub.Application.DTOs.Instructor
{
    public class AdminUpdateInstructorDto
    {
        [MinLength(2, ErrorMessage = "Ad en az 2 karakter olmalıdır")]
        [MaxLength(50, ErrorMessage = "Ad en fazla 50 karakter olmalıdır")]
        public string? FirstName { get; set; }

        [MinLength(2, ErrorMessage = "Soyad en az 2 karakter olmalıdır")]
        [MaxLength(50, ErrorMessage = "Soyad en fazla 50 karakter olmalıdır")]
        public string? LastName { get; set; }

        public string? Bio { get; set; }
        public string? Expertise { get; set; }

        [Phone(ErrorMessage = "Geçerli bir telefon numarası giriniz")]
        public string? PhoneNumber { get; set; }

        public bool IsActive { get; set; } = true;
    }
}
