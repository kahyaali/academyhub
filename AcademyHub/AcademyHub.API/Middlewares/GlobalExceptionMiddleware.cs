using AcademyHub.Core.Entities;
using AcademyHub.Core.Exceptions;
using AcademyHub.Core.Interfaces;
using System.Net;
using System.Text.Json;

namespace AcademyHub.API.Middlewares
{
    public class GlobalExceptionMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly ILogger<GlobalExceptionMiddleware> _logger;
        private readonly IServiceProvider _serviceProvider;

        public GlobalExceptionMiddleware(
            RequestDelegate next,
            ILogger<GlobalExceptionMiddleware> logger,
            IServiceProvider serviceProvider)
        {
            _next = next;
            _logger = logger;
            _serviceProvider = serviceProvider;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            try
            {
                await _next(context);
            }
            catch (Exception ex)
            {
                await HandleExceptionAsync(context, ex);
            }
        }

        private async Task HandleExceptionAsync(HttpContext context, Exception exception)
        {
            var response = context.Response;
            response.ContentType = "application/json";

            var statusCode = HttpStatusCode.InternalServerError;
            var message = "Internal Server Error";
            var errorCode = "SERVER_001";
            var details = string.Empty;

            switch (exception)
            {
                case NotFoundException notFound:
                    statusCode = HttpStatusCode.NotFound;
                    message = notFound.Message;
                    errorCode = "NOTFOUND_001";
                    break;

                case BusinessRuleException businessRule:
                    statusCode = HttpStatusCode.BadRequest;
                    message = businessRule.Message;
                    errorCode = "BUSINESS_001";
                    break;

                case UnauthorizedException unauthorized:
                    statusCode = HttpStatusCode.Unauthorized;
                    message = unauthorized.Message;
                    errorCode = "UNAUTH_001";
                    break;

                case ValidationException validation:
                    statusCode = HttpStatusCode.BadRequest;
                    message = validation.Message;
                    errorCode = "VALIDATION_001";
                    break;

                default:
                    statusCode = HttpStatusCode.InternalServerError;
                    message = "Beklenmeyen bir hata oluştu";
                    errorCode = "SERVER_001";
                    _logger.LogError(exception, "Beklenmeyen hata: {Message}", exception.Message);
                    break;
            }

            // ErrorLog'u veritabanına kaydet
            try
            {
                using var scope = _serviceProvider.CreateScope();
                var unitOfWork = scope.ServiceProvider.GetRequiredService<IUnitOfWork>();

                var errorLog = new ErrorLog
                {
                    ErrorMessage = exception.Message,
                    StackTrace = exception.StackTrace ?? string.Empty,
                    ErrorType = exception.GetType().Name,
                    Source = exception.Source ?? string.Empty,
                    TargetSite = exception.TargetSite?.ToString() ?? string.Empty,
                    InnerException = exception.InnerException?.Message,
                    RequestPath = context.Request.Path,
                    RequestMethod = context.Request.Method,
                    IpAddress = context.Connection.RemoteIpAddress?.ToString(),
                    UserAgent = context.Request.Headers["User-Agent"].ToString(),
                    Severity = statusCode >= HttpStatusCode.InternalServerError ? "Critical" : "Error",
                    AdditionalData = details,
                    CreatedDate = DateTime.UtcNow
                };

                await unitOfWork.GetRepository<ErrorLog>().AddAsync(errorLog);
                await unitOfWork.SaveChangesAsync();
            }
            catch (Exception logEx)
            {
                _logger.LogError(logEx, "ErrorLog kaydedilirken hata oluştu");
            }

            var errorResponse = new
            {
                success = false,
                statusCode = (int)statusCode,
                errorCode,
                message,
                details,
                timestamp = DateTime.UtcNow,
                path = context.Request.Path
            };

            response.StatusCode = (int)statusCode;
            await response.WriteAsync(JsonSerializer.Serialize(errorResponse, new JsonSerializerOptions
            {
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase
            }));
        }
    }
}
