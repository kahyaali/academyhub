using AcademyHub.Core.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AcademyHub.Core.Interfaces.Services
{
    public interface IMailConfigurationService
    {
        Task<MailConfiguration> GetConfigurationAsync();
        Task<MailConfiguration> GetActiveConfigurationAsync();
        Task<MailConfiguration> CreateConfigurationAsync(MailConfiguration configuration);
        Task<MailConfiguration> UpdateConfigurationAsync(MailConfiguration configuration);
        Task<bool> TestConfigurationAsync(int id);
        Task<bool> TestConfigurationAsync(MailConfiguration configuration);
    }
}
