using AcademyHub.API.Filters;
using AcademyHub.API.Helpers;
using AcademyHub.API.Middlewares;
using AcademyHub.Application.Mappings;
using AcademyHub.Core.Interfaces.Services;
using AcademyHub.Infrastructure.Data;
using AcademyHub.Infrastructure.Extensions;
using AcademyHub.Infrastructure.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Http.Features;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using RabbitMQ.Client;
using Serilog;
using System.Reflection;
using System.Text;
using System.Text.Json;
using QuestPDF.Infrastructure;



var builder = WebApplication.CreateBuilder(args);


// ============ 1. SERILOG ============

builder.Host.UseSerilog((context, config) =>
{
    config.ReadFrom.Configuration(context.Configuration)
     .WriteTo.Console()
        .WriteTo.File("Logs/log-.txt", rollingInterval: RollingInterval.Day)
        .MinimumLevel.Debug()  
        .Enrich.FromLogContext(); 
});



// ============ 2. CONTROLLERS ============

builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;
        options.JsonSerializerOptions.WriteIndented = true;
        options.JsonSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
    });

//  DOSYA YÜKLEME AYARLARI
builder.Services.Configure<FormOptions>(options =>
{
    options.ValueLengthLimit = int.MaxValue;
    options.MultipartBodyLengthLimit = 600 * 1024 * 1024; // 600 MB
    options.MemoryBufferThreshold = int.MaxValue;
});

//  KESTREL AYARLARI 
builder.WebHost.ConfigureKestrel(options =>
{
    options.Limits.MaxRequestBodySize = 600 * 1024 * 1024; // 600 MB
    options.Limits.KeepAliveTimeout = TimeSpan.FromMinutes(10);
    options.Limits.RequestHeadersTimeout = TimeSpan.FromMinutes(5);
});


// ============ 3. SWAGGER ============

builder.Services.AddEndpointsApiExplorer();

builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1",
        new OpenApiInfo
        {
            Title = "AcademyHub API",
            Version = "v1",
            Description = "AcademyHub Online Eğitim Platformu API",
            Contact = new OpenApiContact
            {
                Name = "AcademyHub",
                Email = "info@academyhub.com"
            }
        });

    c.OperationFilter<FormFileOperationFilter>();
    c.MapType<IFormFile>(() => new OpenApiSchema
    {
        Type = "string",
        Format = "binary"
    });

    c.AddSecurityDefinition("Bearer",
        new OpenApiSecurityScheme
        {
            Name = "Authorization",
            Type = SecuritySchemeType.Http,
            Scheme = "bearer",
            BearerFormat = "JWT",
            In = ParameterLocation.Header,
            Description = "Bearer {token}"
        });

    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });

    var xmlFile = $"{Assembly.GetExecutingAssembly().GetName().Name}.xml";
    var xmlPath = Path.Combine(AppContext.BaseDirectory, xmlFile);
    if (File.Exists(xmlPath))
    {
        c.IncludeXmlComments(xmlPath);
    }
});



// ============ 4. DATABASE & AUTO MAPPER ============

builder.Services.AddInfrastructureServices(
    builder.Configuration
);

builder.Services.AddAutoMapper(
    typeof(MappingProfile)
);



// ============ 5. JWT ============

var jwtKey = builder.Configuration["Jwt:Key"]!;
var key = Encoding.UTF8.GetBytes(jwtKey);

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(key),
            ValidateIssuer = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidateAudience = true,
            ValidAudience = builder.Configuration["Jwt:Audience"],
            ValidateLifetime = true,
            ClockSkew = TimeSpan.Zero
        };

        options.Events = new JwtBearerEvents
        {
            OnMessageReceived = context =>
            {
                var token = context.Request.Headers["Authorization"].ToString();
                Console.WriteLine("GELEN HEADER: " + token);
                return Task.CompletedTask;
            },
            OnAuthenticationFailed = context =>
            {
                Console.WriteLine("TOKEN HATASI: " + context.Exception.Message);
                return Task.CompletedTask;
            }
        };
    });

builder.Services.AddAuthorization();



// ============ 6. CUSTOM SERVICES ============

var encryptionKey = builder.Configuration["Encryption:Key"] ?? "AcademyHubEncryptionKey2024!1234567890";

builder.Services.AddScoped<IEncryptionService>(
    provider => new EncryptionService(encryptionKey)
);

builder.Services.AddScoped<IPasswordHasher, PasswordHasher>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<ICourseService, CourseService>();
builder.Services.AddScoped<ICategoryService, CategoryService>();
builder.Services.AddScoped<ILessonService, LessonService>();
builder.Services.AddScoped<IEnrollmentService, EnrollmentService>();
builder.Services.AddScoped<IStatsService, StatsService>();
builder.Services.AddScoped<IReviewService, ReviewService>();
builder.Services.AddScoped<IPaymentService, PaymentService>();
builder.Services.AddScoped<INotificationService, NotificationService>();
builder.Services.AddScoped<IMailConfigurationService, MailConfigurationService>();
builder.Services.AddScoped<IEmailService, EmailService>();
builder.Services.AddScoped<IExamService, ExamService>();
builder.Services.AddScoped<ICertificateService, CertificateService>();
builder.Services.AddScoped<IInstructorService, InstructorService>();
builder.Services.AddScoped<IStudentService, StudentService>();
builder.Services.AddScoped<JwtHelper>();



// ============ 7. CORS ============

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll",
        policy =>
        {
            policy
            .AllowAnyOrigin()
            .AllowAnyMethod()
            .AllowAnyHeader();
        });
});


// ============ 8. STATIC FILES ============
builder.Services.AddDirectoryBrowser();


// ============ 9. HTTPS AYARLARI ============
if (builder.Environment.IsDevelopment())
{
    builder.WebHost.UseUrls("http://localhost:7230");
    Console.WriteLine("🌐 Development: HTTP kullanılıyor");
}
else
{
    builder.WebHost.UseUrls("https://localhost:7230");
    Console.WriteLine("🌐 Production: HTTPS kullanılıyor");
}


// ============  10. RABBITMQ - PRODUCER (API) ============
// API sadece mesaj GÖNDERECEK, tüketmeyecek

//  IConnection - RabbitMQ bağlantısı (HATA YÖNETİMLİ)
builder.Services.AddSingleton<IConnection>(sp =>
{
    try
    {
        var config = sp.GetRequiredService<IConfiguration>();
        var factory = new ConnectionFactory
        {
            HostName = config["RabbitMQ:HostName"] ?? "localhost",
            UserName = config["RabbitMQ:UserName"] ?? "guest",
            Password = config["RabbitMQ:Password"] ?? "guest",
            Port = int.Parse(config["RabbitMQ:Port"] ?? "5672"),
            VirtualHost = config["RabbitMQ:VirtualHost"] ?? "/"
        };

        Console.WriteLine($"🔌 RabbitMQ bağlanıyor: {factory.HostName}:{factory.Port}");
        return factory.CreateConnectionAsync().GetAwaiter().GetResult();
    }
    catch (Exception ex)
    {
        Console.WriteLine($"⚠️ RabbitMQ bağlantı hatası: {ex.Message}");
        Console.WriteLine("⚠️ RabbitMQ olmadan devam ediliyor... (Sertifika direkt oluşturulacak)");
        return null;  
    }
});

// IChannel - Mesaj göndermek için kanal (HATA YÖNETİMLİ)
builder.Services.AddSingleton<IChannel>(sp =>
{
    try
    {
        var connection = sp.GetRequiredService<IConnection>();
        if (connection == null) return null;  //  Connection null ise channel da null

        var channel = connection.CreateChannelAsync().GetAwaiter().GetResult();
        if (channel == null) return null;

        // Kuyrukları oluştur (Worker ile aynı olmalı)
        channel.QueueDeclareAsync(
            queue: "certificate_queue",
            durable: true,
            exclusive: false,
            autoDelete: false,
            arguments: null).GetAwaiter().GetResult();

        channel.QueueDeclareAsync(
            queue: "email_queue",
            durable: true,
            exclusive: false,
            autoDelete: false,
            arguments: null).GetAwaiter().GetResult();

        Console.WriteLine("📨 RabbitMQ kuyrukları oluşturuldu");
        return channel;
    }
    catch (Exception ex)
    {
        Console.WriteLine($"⚠️ RabbitMQ kanal hatası: {ex.Message}");
        return null;  
    }
});



//  QuestPDF Community License
QuestPDF.Settings.License = LicenseType.Community;

// ============ BUILD ============
var app = builder.Build();



// ============ 10. PIPELINE ============

app.UseSwagger();
app.UseSwaggerUI();

if (!app.Environment.IsDevelopment())
{
    app.UseHttpsRedirection();
}

app.UseCors("AllowAll");

//  STATIC FILES - Video ve dosyalar için
app.UseStaticFiles();


// 1. Önce Request Logging Middleware
app.UseMiddleware<RequestLoggingMiddleware>();

// 2. Sonra Global Exception Middleware
app.UseMiddleware<GlobalExceptionMiddleware>();

app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();



// ============ 11. WWWROOT KLASÖRLERİNİ OLUŞTUR ============
var wwwrootPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
var uploadsPath = Path.Combine(wwwrootPath, "uploads");
var videosPath = Path.Combine(uploadsPath, "videos");
var resourcesPath = Path.Combine(uploadsPath, "resources");
var certificatesPath = Path.Combine(wwwrootPath, "certificates");

if (!Directory.Exists(wwwrootPath))
    Directory.CreateDirectory(wwwrootPath);
if (!Directory.Exists(uploadsPath))
    Directory.CreateDirectory(uploadsPath);
if (!Directory.Exists(videosPath))
    Directory.CreateDirectory(videosPath);
if (!Directory.Exists(resourcesPath))
    Directory.CreateDirectory(resourcesPath);
if (!Directory.Exists(certificatesPath))
    Directory.CreateDirectory(certificatesPath);

Console.WriteLine($"📁 Klasörler oluşturuldu: {videosPath}");


// ============ 12. MIGRATION & INITIALIZER ============

using (var scope = app.Services.CreateScope())
{
    var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    await dbContext.Database.MigrateAsync();
    await DbInitializer.InitializeAsync(dbContext);
}

app.Run();