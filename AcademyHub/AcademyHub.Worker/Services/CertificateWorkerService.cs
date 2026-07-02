using AcademyHub.Core.Interfaces.Services;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using RabbitMQ.Client;
using RabbitMQ.Client.Events;
using System;
using System.Text;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;

namespace AcademyHub.Worker.Services
{
    public class CertificateWorkerService : BackgroundService
    {
        private readonly ILogger<CertificateWorkerService> _logger;
        private readonly IServiceScopeFactory _scopeFactory;
        private readonly IConnection _rabbitConnection;
        private readonly IChannel _channel;

        public CertificateWorkerService(
            ILogger<CertificateWorkerService> logger,
            IServiceScopeFactory scopeFactory,
            IConnection rabbitConnection)
        {
            _logger = logger;
            _scopeFactory = scopeFactory;
            _rabbitConnection = rabbitConnection;

            _channel = _rabbitConnection.CreateChannelAsync().GetAwaiter().GetResult();

            _channel.QueueDeclareAsync(
                queue: "certificate_queue",
                durable: true,
                exclusive: false,
                autoDelete: false,
                arguments: null).GetAwaiter().GetResult();
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("📜 CertificateWorkerService başlatıldı, kuyruk dinleniyor...");

            var consumer = new AsyncEventingBasicConsumer(_channel);

            consumer.ReceivedAsync += async (sender, ea) =>
            {
                var body = ea.Body.ToArray();
                var message = Encoding.UTF8.GetString(body);

                try
                {
                    using var scope = _scopeFactory.CreateScope();
                    var certificateService = scope.ServiceProvider.GetRequiredService<ICertificateService>();

                    var certData = JsonSerializer.Deserialize<CertificateGenerationDto>(message);

                    if (certData != null)
                    {
                        _logger.LogInformation($"📝 Sertifika oluşturma başladı: EnrollmentId={certData.EnrollmentId}");

                        //  1. Sertifika oluştur (Veritabanına kaydeder)
                        var certificate = await certificateService.GenerateCertificateAsync(certData.EnrollmentId);

                        //  2. Sertifika PDF'ini oluştur (byte[] döner)
                        var pdfBytes = await certificateService.GenerateCertificatePdfBytesAsync(certificate.Id);

                        //  3. PDF'i kaydet (Bu kısım mevcut serviste yok, ek bir metod gerekli)
                        // Mevcut serviste PdfUrl zaten GenerateCertificateAsync'de set ediliyor
                        // Sadece fiziksel dosyayı kaydetmemiz gerekiyor
                        await SaveCertificatePdfAsync(certificate.CertificateNumber, pdfBytes);

                        //  Async Ack
                        await _channel.BasicAckAsync(ea.DeliveryTag, false);
                        _logger.LogInformation($"✅ Sertifika oluşturuldu: {certificate.CertificateNumber} - EnrollmentId={certData.EnrollmentId}");
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError($"❌ Sertifika oluşturulamadı: {ex.Message}");
                    await _channel.BasicNackAsync(ea.DeliveryTag, false, true);
                }
            };

            await _channel.BasicConsumeAsync(
                queue: "certificate_queue",
                autoAck: false,
                consumer: consumer);

            await Task.Delay(Timeout.Infinite, stoppingToken);
        }

        //  PDF dosyasını fiziksel olarak kaydeden yardımcı metod
        private async Task SaveCertificatePdfAsync(string certificateNumber, byte[] pdfBytes)
        {
            try
            {
                var fileName = $"{certificateNumber}.pdf";
                var directory = Path.Combine("wwwroot", "certificates");

                if (!Directory.Exists(directory))
                {
                    Directory.CreateDirectory(directory);
                }

                var filePath = Path.Combine(directory, fileName);
                await File.WriteAllBytesAsync(filePath, pdfBytes);

                _logger.LogInformation($"✅ PDF kaydedildi: {filePath}");
            }
            catch (Exception ex)
            {
                _logger.LogError($"❌ PDF kaydedilemedi: {ex.Message}");
                throw;
            }
        }

        public override void Dispose()
        {
            try
            {
                if (_channel != null)
                {
                    _channel.CloseAsync().GetAwaiter().GetResult();
                    _channel.DisposeAsync().GetAwaiter().GetResult();
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning($"Channel dispose sırasında hata: {ex.Message}");
            }

            base.Dispose();
        }
    }

    public class CertificateGenerationDto
    {
        public int EnrollmentId { get; set; }
        public int StudentId { get; set; }
        public string StudentName { get; set; }
        public string StudentEmail { get; set; }
        public string CourseName { get; set; }
        public DateTime CompletionDate { get; set; }
        public string CertificateNumber { get; set; }
        public string CertificateUrl { get; set; }
    }
}