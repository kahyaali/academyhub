using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AcademyHub.Core.Entities
{
    public class EmailLog:BaseEntity
    {
        public string To { get; set; } = string.Empty;
        public string? Cc { get; set; }
        public string? Bcc { get; set; }
        public string Subject { get; set; } = string.Empty;
        public string Body { get; set; } = string.Empty;
        public bool IsHtml { get; set; } = true;
        public string From { get; set; } = string.Empty;
        public string FromName { get; set; } = string.Empty;
        public string Status { get; set; } = "Pending";
        public string? ErrorMessage { get; set; }
        public DateTime? SentDate { get; set; }
        public int RetryCount { get; set; }
        public string? MessageId { get; set; }
        public int? UserId { get; set; }
    }
}
