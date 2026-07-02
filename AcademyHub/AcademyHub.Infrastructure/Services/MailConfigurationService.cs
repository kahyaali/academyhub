using AcademyHub.Core.Entities;
using AcademyHub.Core.Exceptions;
using AcademyHub.Core.Interfaces;
using AcademyHub.Core.Interfaces.Services;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using static AcademyHub.Infrastructure.Services.EncryptionService;

namespace AcademyHub.Infrastructure.Services
{
    public class MailConfigurationService: IMailConfigurationService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IEncryptionService _encryptionService;
        private readonly IEmailService _emailService;

        public MailConfigurationService(
            IUnitOfWork unitOfWork,
            IEncryptionService encryptionService,
            IEmailService emailService)
        {
            _unitOfWork = unitOfWork;
            _encryptionService = encryptionService;
            _emailService = emailService;
        }

        public async Task<MailConfiguration> GetConfigurationAsync()
        {
            var configs = await _unitOfWork.GetRepository<MailConfiguration>()
                .FindAsync(c => !c.IsDeleted);

            // İlk kaydı dön
            return configs.FirstOrDefault() ?? throw new NotFoundException("Mail konfigürasyonu bulunamadı");
        }

        public async Task<MailConfiguration> GetActiveConfigurationAsync()
        {
            var config = await _unitOfWork.GetRepository<MailConfiguration>()
                .SingleOrDefaultAsync(c => c.IsActive && !c.IsDeleted);

            if (config == null)
                throw new NotFoundException("Aktif mail konfigürasyonu bulunamadı");

            //  Şifreyi decrypt et - Hata varsa yakala
            try
            {
                if (!string.IsNullOrEmpty(config.Password))
                {
                    config.Password = _encryptionService.Decrypt(config.Password);
                    Console.WriteLine($"✅ Şifre çözüldü: {config.Password}");
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ Şifre çözülemedi: {ex.Message}");
                Console.WriteLine($"❌ Şifre (encrypted): {config.Password}");
                //  Şifre çözülemezse olduğu gibi bırak
            }

            return config;
        }

        public async Task<MailConfiguration> CreateConfigurationAsync(MailConfiguration configuration)
        {
            // Mevcut aktif konfigürasyon var mı?
            var existing = await _unitOfWork.GetRepository<MailConfiguration>()
                .SingleOrDefaultAsync(c => !c.IsDeleted);

            if (existing != null)
                throw new BusinessRuleException("Zaten bir mail konfigürasyonu mevcut. Güncelleme yapabilirsiniz.");

            // Şifreyi encrypt et
            configuration.Password = _encryptionService.Encrypt(configuration.Password);
            configuration.CreatedDate = DateTime.UtcNow;

            await _unitOfWork.GetRepository<MailConfiguration>().AddAsync(configuration);
            await _unitOfWork.SaveChangesAsync();

            return configuration;
        }

        public async Task<MailConfiguration> UpdateConfigurationAsync(MailConfiguration configuration)
        {
            var existing = await _unitOfWork.GetRepository<MailConfiguration>()
                .SingleOrDefaultAsync(c => !c.IsDeleted);

            if (existing == null)
                throw new NotFoundException("Mail konfigürasyonu bulunamadı");

            // Şifreyi encrypt et (eğer değiştiyse)
            if (configuration.Password != existing.Password)
                configuration.Password = _encryptionService.Encrypt(configuration.Password);
            else
                configuration.Password = existing.Password;

            existing.SmtpServer = configuration.SmtpServer;
            existing.SmtpPort = configuration.SmtpPort;
            existing.SenderEmail = configuration.SenderEmail;
            existing.SenderName = configuration.SenderName;
            existing.Username = configuration.Username;
            existing.Password = configuration.Password;
            existing.EnableSsl = configuration.EnableSsl;
            existing.UseDefaultCredentials = configuration.UseDefaultCredentials;
            existing.MaxRetryCount = configuration.MaxRetryCount;
            existing.Timeout = configuration.Timeout;
            existing.IsActive = configuration.IsActive;
            existing.UpdatedDate = DateTime.UtcNow;

            _unitOfWork.GetRepository<MailConfiguration>().Update(existing);
            await _unitOfWork.SaveChangesAsync();

            return existing;
        }


        public async Task<bool> TestConfigurationAsync(int id)
        {
            try
            {
                var config = await _unitOfWork.GetRepository<MailConfiguration>()
                    .GetByIdAsync(id);

                if (config == null || config.IsDeleted)
                    throw new NotFoundException("Mail konfigürasyonu bulunamadı");

                //  Şifreyi decrypt et
                Console.WriteLine($"🔐 Şifre (encrypted): {config.Password}");
                config.Password = _encryptionService.Decrypt(config.Password);
                Console.WriteLine($"🔐 Şifre (decrypted): {config.Password}");

                //  Email göndermeyi dene
                var result = await _emailService.SendTestEmailAsync(config);

                // Test sonucunu kaydet
                config.LastTestDate = DateTime.UtcNow;
                config.LastTestSuccess = result;
                config.LastTestError = result ? null : "Test maili başarısız";
                config.UpdatedDate = DateTime.UtcNow;

                _unitOfWork.GetRepository<MailConfiguration>().Update(config);
                await _unitOfWork.SaveChangesAsync();

                return result;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ TEST MAİLİ HATASI: {ex.Message}");
                Console.WriteLine($"❌ INNER: {ex.InnerException?.Message}");
                Console.WriteLine($"❌ STACK: {ex.StackTrace}");

                // Hata durumunda test sonucunu kaydet
                try
                {
                    var config = await _unitOfWork.GetRepository<MailConfiguration>()
                        .GetByIdAsync(id);
                    if (config != null)
                    {
                        config.LastTestDate = DateTime.UtcNow;
                        config.LastTestSuccess = false;
                        config.LastTestError = ex.Message;
                        config.UpdatedDate = DateTime.UtcNow;
                        _unitOfWork.GetRepository<MailConfiguration>().Update(config);
                        await _unitOfWork.SaveChangesAsync();
                    }
                }
                catch { }

                throw;
            }
        }


        public async Task<bool> TestConfigurationAsync(MailConfiguration configuration)
        {
            // Şifreyi decrypt et (eğer encrypted ise)
            if (configuration.Password.StartsWith("encrypted:"))
            {
                configuration.Password = _encryptionService.Decrypt(configuration.Password.Replace("encrypted:", ""));
            }

            return await _emailService.SendTestEmailAsync(configuration);
        }
    }
}
