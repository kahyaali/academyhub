using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AcademyHub.Application.DTOs.Notification
{
    public class CreateNotificationRequestDto
    {
        [Required(ErrorMessage = "Kullanıcı ID gereklidir")]
        public int UserId { get; set; }

        [Required(ErrorMessage = "Başlık gereklidir")]
        [MinLength(3, ErrorMessage = "Başlık en az 3 karakter olmalıdır")]
        [MaxLength(200, ErrorMessage = "Başlık en fazla 200 karakter olmalıdır")]
        public string Title { get; set; } = string.Empty;

        [Required(ErrorMessage = "Mesaj gereklidir")]
        [MinLength(5, ErrorMessage = "Mesaj en az 5 karakter olmalıdır")]
        [MaxLength(2000, ErrorMessage = "Mesaj en fazla 2000 karakter olmalıdır")]
        public string Message { get; set; } = string.Empty;

        public string? Type { get; set; }
        public string? Link { get; set; }
        public string? Icon { get; set; }
    }
}
