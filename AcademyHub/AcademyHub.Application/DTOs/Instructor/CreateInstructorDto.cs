using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AcademyHub.Application.DTOs.Instructor
{
    public class CreateInstructorDto
    {
        [Required(ErrorMessage = "Ad gereklidir")]
        [MinLength(2, ErrorMessage = "Ad en az 2 karakter olmalıdır")]
        [MaxLength(50, ErrorMessage = "Ad en fazla 50 karakter olmalıdır")]
        public string FirstName { get; set; } = string.Empty;

        [Required(ErrorMessage = "Soyad gereklidir")]
        [MinLength(2, ErrorMessage = "Soyad en az 2 karakter olmalıdır")]
        [MaxLength(50, ErrorMessage = "Soyad en fazla 50 karakter olmalıdır")]
        public string LastName { get; set; } = string.Empty;

        [Required(ErrorMessage = "E-posta adresi gereklidir")]
        [EmailAddress(ErrorMessage = "Geçerli bir e-posta adresi giriniz")]
        public string Email { get; set; } = string.Empty;

        [Required(ErrorMessage = "Şifre gereklidir")]
        [MinLength(8, ErrorMessage = "Şifre en az 8 karakter olmalıdır")]
        public string Password { get; set; } = string.Empty;

        [Required(ErrorMessage = "Şifre tekrarı gereklidir")]
        [Compare("Password", ErrorMessage = "Şifreler eşleşmiyor")]
        public string ConfirmPassword { get; set; } = string.Empty;

        public string? Bio { get; set; }
        public string? Expertise { get; set; }
        public string? ProfileImage { get; set; }
    }
}
