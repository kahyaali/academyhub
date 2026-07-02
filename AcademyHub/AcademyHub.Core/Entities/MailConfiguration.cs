using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AcademyHub.Core.Entities
{
    public class MailConfiguration:BaseEntity
    {
        public string SmtpServer { get; set; } = string.Empty;
        public int SmtpPort { get; set; } = 587;
        public string SenderEmail { get; set; } = string.Empty;
        public string SenderName { get; set; } = string.Empty;
        public string Username { get; set; } = string.Empty;
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
