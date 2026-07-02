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
    public class EmailWorkerService : BackgroundService
    {
        private readonly ILogger<EmailWorkerService> _logger;
        private readonly IServiceScopeFactory _scopeFactory;
        private readonly IConnection _rabbitConnection;
        private readonly IChannel _channel;

        public EmailWorkerService(
            ILogger<EmailWorkerService> logger,
            IServiceScopeFactory scopeFactory,
            IConnection rabbitConnection)
        {
            _logger = logger;
            _scopeFactory = scopeFactory;
            _rabbitConnection = rabbitConnection;

            //  Channel oluştur (Async)
            _channel = _rabbitConnection.CreateChannelAsync().GetAwaiter().GetResult();

            //  Queue declare (Async)
            _channel.QueueDeclareAsync(
                queue: "email_queue",
                durable: true,
                exclusive: false,
                autoDelete: false,
                arguments: null).GetAwaiter().GetResult();
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("📧 EmailWorkerService başlatıldı, kuyruk dinleniyor...");

            //  Async consumer
            var consumer = new AsyncEventingBasicConsumer(_channel);

            consumer.ReceivedAsync += async (sender, ea) =>
            {
                var body = ea.Body.ToArray();
                var message = Encoding.UTF8.GetString(body);

                try
                {
                    using var scope = _scopeFactory.CreateScope();
                    var emailService = scope.ServiceProvider.GetRequiredService<IEmailService>();

                    var emailData = JsonSerializer.Deserialize<EmailMessageDto>(message);

                    if (emailData != null)
                    {
                        await emailService.SendEmailAsync(
                            emailData.To,
                            emailData.Subject,
                            emailData.Body,
                            emailData.IsHtml
                        );

                        //  Async Ack
                        await _channel.BasicAckAsync(ea.DeliveryTag, false);
                        _logger.LogInformation($"✅ Email gönderildi: {emailData.To}");
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError($"❌ Email gönderilemedi: {ex.Message}");
                    //  Async Nack (requeue: true ile yeniden dene)
                    await _channel.BasicNackAsync(ea.DeliveryTag, false, true);
                }
            };

            //  Async Consume
            await _channel.BasicConsumeAsync(
                queue: "email_queue",
                autoAck: false,
                consumer: consumer);

            // Servis durana kadar bekle
            await Task.Delay(Timeout.Infinite, stoppingToken);
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

    public class EmailMessageDto
    {
        public string To { get; set; }
        public string Subject { get; set; }
        public string Body { get; set; }
        public bool IsHtml { get; set; } = true;
    }
}