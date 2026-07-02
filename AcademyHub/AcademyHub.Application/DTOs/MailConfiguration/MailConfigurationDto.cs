using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AcademyHub.Application.DTOs.MailConfiguration
{
    public class MailConfigurationDto
    {
        public int Id { get; set; }

        [Required(ErrorMessage = "SMTP Sunucu gereklidir")]
        public string SmtpServer { get; set; } = string.Empty;

        [Required(ErrorMessage = "SMTP Port gereklidir")]
        [Range(1, 65535, ErrorMessage = "Port 1-65535 arasında olmalıdır")]
        public int SmtpPort { get; set; }

        [Required(ErrorMessage = "Gönderen E-posta gereklidir")]
        [EmailAddress(ErrorMessage = "Geçerli bir e-posta adresi giriniz")]
        public string SenderEmail { get; set; } = string.Empty;

        [Required(ErrorMessage = "Gönderen İsmi gereklidir")]
        public string SenderName { get; set; } = string.Empty;

        [Required(ErrorMessage = "Kullanıcı Adı gereklidir")]
        public string Username { get; set; } = string.Empty;

        [Required(ErrorMessage = "Şifre gereklidir")]
        public string Password { get; set; } = string.Empty;

        public bool EnableSsl { get; set; } = true;
        public bool UseDefaultCredentials { get; set; } = false;
        public int MaxRetryCount { get; set; } = 3;
        public int Timeout { get; set; } = 30000;
        public bool IsActive { get; set; } = true;

        public DateTime? LastTestDate { get; set; }
        public bool? LastTestSuccess { get; set; }
        public string? LastTestError { get; set; }
    }
}
