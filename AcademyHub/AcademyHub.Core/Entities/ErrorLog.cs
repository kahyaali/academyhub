using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AcademyHub.Core.Entities
{
    public class ErrorLog:BaseEntity
    {
        public string ErrorMessage { get; set; } = string.Empty;
        public string StackTrace { get; set; } = string.Empty;
        public string ErrorType { get; set; } = string.Empty;
        public string Source { get; set; } = string.Empty;
        public string TargetSite { get; set; } = string.Empty;
        public string? InnerException { get; set; }
        public string? RequestPath { get; set; }
        public string? RequestMethod { get; set; }
        public string? IpAddress { get; set; }
        public string? UserAgent { get; set; }
        public int? UserId { get; set; }
        public string? UserEmail { get; set; }
        public string Severity { get; set; } = "Error";
        public string? AdditionalData { get; set; }
    }
}
