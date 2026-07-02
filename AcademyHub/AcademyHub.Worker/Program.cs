using AcademyHub.Core.Interfaces.Services;
using AcademyHub.Infrastructure.Data;
using AcademyHub.Infrastructure.Extensions;
using AcademyHub.Infrastructure.Services;
using AcademyHub.Worker.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using RabbitMQ.Client;
using Serilog;
using QuestPDF.Infrastructure;

var builder = Host.CreateApplicationBuilder(args);

// ============ 1. SERILOG ============
Log.Logger = new LoggerConfiguration()
    .ReadFrom.Configuration(builder.Configuration)
    .WriteTo.Console()
    .WriteTo.File("Logs/worker-log-.txt", rollingInterval: RollingInterval.Day)
    .CreateLogger();

builder.Logging.ClearProviders();
builder.Logging.AddSerilog();

// ============ 2. DATABASE ============
builder.Services.AddInfrastructureServices(builder.Configuration);

// ============ 3. SERVİSLER ============
builder.Services.AddScoped<IEmailService, EmailService>();
builder.Services.AddScoped<ICertificateService, CertificateService>();
builder.Services.AddScoped<IEnrollmentService, EnrollmentService>();
builder.Services.AddScoped<ICourseService, CourseService>();
builder.Services.AddScoped<IStudentService, StudentService>();
builder.Services.AddScoped<IMailConfigurationService, MailConfigurationService>();  //  MailConfigurationService

// ============  4. RABBITMQ ============
builder.Services.AddSingleton<IConnection>(sp =>
{
    var config = sp.GetRequiredService<IConfiguration>();
    var factory = new ConnectionFactory
    {
        HostName = config["RabbitMQ:HostName"] ?? "localhost",
        Port = int.Parse(config["RabbitMQ:Port"] ?? "5672"),
        UserName = config["RabbitMQ:UserName"] ?? "guest",
        Password = config["RabbitMQ:Password"] ?? "guest",
        VirtualHost = config["RabbitMQ:VirtualHost"] ?? "/"
    };

    Console.WriteLine($"🔌 RabbitMQ bağlanıyor: {factory.HostName}:{factory.Port}");
    return factory.CreateConnectionAsync().GetAwaiter().GetResult();
});

builder.Services.AddSingleton<IChannel>(sp =>
{
    var connection = sp.GetRequiredService<IConnection>();
    var channel = connection.CreateChannelAsync().GetAwaiter().GetResult();

    var certificateQueue = builder.Configuration["RabbitMQ:CertificateQueue"] ?? "certificate_queue";
    var emailQueue = builder.Configuration["RabbitMQ:EmailQueue"] ?? "email_queue";

    channel.QueueDeclareAsync(
        queue: certificateQueue,
        durable: true,
        exclusive: false,
        autoDelete: false,
        arguments: null).GetAwaiter().GetResult();

    channel.QueueDeclareAsync(
        queue: emailQueue,
        durable: true,
        exclusive: false,
        autoDelete: false,
        arguments: null).GetAwaiter().GetResult();

    Console.WriteLine($"📨 RabbitMQ kuyrukları oluşturuldu:");
    Console.WriteLine($"   - {certificateQueue}");
    Console.WriteLine($"   - {emailQueue}");

    return channel;
});

// ============ 5. QUESTPDF LICENSE ============
QuestPDF.Settings.License = LicenseType.Community;

// ============ 6. WORKER SERVİSLERİ ============
builder.Services.AddHostedService<CertificateWorkerService>();
builder.Services.AddHostedService<EmailWorkerService>();

// ============ 7. BUILD ============
var host = builder.Build();

// ============ 8. MIGRATION ============
using (var scope = host.Services.CreateScope())
{
    try
    {
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        await dbContext.Database.MigrateAsync();
        Console.WriteLine("✅ Veritabanı migration tamamlandı.");
    }
    catch (Exception ex)
    {
        Console.WriteLine($"⚠️ Migration hatası: {ex.Message}");
    }
}

// ============ 9. RUN ============
Console.WriteLine("🚀 Worker servisi başlatılıyor...");
Console.WriteLine($"📅 Başlangıç: {DateTime.Now:yyyy-MM-dd HH:mm:ss}");
Console.WriteLine("═══════════════════════════════════════════════");

host.Run();