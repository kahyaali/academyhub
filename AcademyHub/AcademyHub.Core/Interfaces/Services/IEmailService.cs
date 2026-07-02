using AcademyHub.Core.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AcademyHub.Core.Interfaces.Services
{
    public interface IEmailService
    {
        Task SendEmailAsync(string to, string subject, string body, bool isHtml = true);
        Task SendEmailAsync(MailConfiguration config, string to, string subject, string body, bool isHtml = true);
        Task SendEmailWithTemplateAsync(string to, string subject, string templateName, object model);
        Task<bool> SendTestEmailAsync(MailConfiguration config);
        Task<bool> ValidateConfigurationAsync(MailConfiguration config);
    }
}
