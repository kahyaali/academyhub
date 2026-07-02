using AcademyHub.Core.Entities;
using AcademyHub.Core.Exceptions;
using AcademyHub.Core.Interfaces.Services;
using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.Extensions.DependencyInjection;
using MimeKit;
using System;
using System.Threading.Tasks;

namespace AcademyHub.Infrastructure.Services
{
    public class EmailService : IEmailService
    {
        private readonly IServiceProvider _serviceProvider;

        public EmailService(IServiceProvider serviceProvider)
        {
            _serviceProvider = serviceProvider;
        }

        //  Config'i kendi alır, email gönderir
        public async Task SendEmailAsync(string to, string subject, string body, bool isHtml = true)
        {
            var config = await GetMailConfigurationAsync();
            await SendEmailAsync(config, to, subject, body, isHtml);
        }

        //  Verilen config ile email gönderir
        public async Task SendEmailAsync(MailConfiguration config, string to, string subject, string body, bool isHtml = true)
        {
            try
            {
                var message = new MimeMessage();
                message.From.Add(new MailboxAddress(config.SenderName, config.SenderEmail));
                message.To.Add(MailboxAddress.Parse(to));
                message.Subject = subject;

                var bodyBuilder = new BodyBuilder();
                if (isHtml)
                    bodyBuilder.HtmlBody = body;
                else
                    bodyBuilder.TextBody = body;

                message.Body = bodyBuilder.ToMessageBody();

                using var client = new SmtpClient();

                //  Port'a göre SSL/STARTTLS seç
                if (config.SmtpPort == 465)
                {
                    await client.ConnectAsync(config.SmtpServer, config.SmtpPort, SecureSocketOptions.SslOnConnect);
                }
                else
                {
                    await client.ConnectAsync(config.SmtpServer, config.SmtpPort, SecureSocketOptions.StartTls);
                }

                if (!config.UseDefaultCredentials)
                {
                    await client.AuthenticateAsync(config.Username, config.Password);
                }

                await client.SendAsync(message);
                await client.DisconnectAsync(true);
            }
            catch (Exception ex)
            {
                throw new BusinessRuleException($"Mail gönderilemedi: {ex.Message}");
            }
        }

        //  Template ile email gönderir
        public async Task SendEmailWithTemplateAsync(string to, string subject, string templateName, object model)
        {
            var body = $"<h1>{subject}</h1><p>Merhaba,</p><p>Bu mesaj template ile gönderilmiştir.</p>";
            await SendEmailAsync(to, subject, body, true);
        }

        //  Test maili gönderir
        public async Task<bool> SendTestEmailAsync(MailConfiguration config)
        {
            try
            {
                var subject = "✅ Test Maili - AcademyHub";
                var body = @"
                    <h1>✅ Test Maili Başarılı!</h1>
                    <p>Bu mesaj AcademyHub platformundan gönderilmiştir.</p>
                    <p><strong>SMTP Sunucu:</strong> " + config.SmtpServer + @"</p>
                    <p><strong>Gönderen:</strong> " + config.SenderName + @" &lt;" + config.SenderEmail + @"&gt;</p>
                    <p><strong>Tarih:</strong> " + DateTime.Now.ToString("dd.MM.yyyy HH:mm:ss") + @"</p>
                    <hr/>
                    <p style='color: green;'>✅ Mail konfigürasyonunuz başarıyla çalışıyor!</p>
                ";

                await SendEmailAsync(config, config.SenderEmail, subject, body, true);
                return true;
            }
            catch
            {
                return false;
            }
        }

        //  SMTP bağlantısını doğrular
        public async Task<bool> ValidateConfigurationAsync(MailConfiguration config)
        {
            try
            {
                using var client = new SmtpClient();

                if (config.SmtpPort == 465)
                {
                    await client.ConnectAsync(config.SmtpServer, config.SmtpPort, SecureSocketOptions.SslOnConnect);
                }
                else
                {
                    await client.ConnectAsync(config.SmtpServer, config.SmtpPort, SecureSocketOptions.StartTls);
                }

                if (!config.UseDefaultCredentials)
                {
                    await client.AuthenticateAsync(config.Username, config.Password);
                }

                await client.DisconnectAsync(true);
                return true;
            }
            catch
            {
                return false;
            }
        }

        //  PRIVATE METOT - Aktif mail konfigürasyonunu alır
        private async Task<MailConfiguration> GetMailConfigurationAsync()
        {
            using var scope = _serviceProvider.CreateScope();
            var mailConfigService = scope.ServiceProvider.GetRequiredService<IMailConfigurationService>();
            return await mailConfigService.GetActiveConfigurationAsync();
        }
    }
}