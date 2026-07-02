using AcademyHub.Core.Entities;
using AcademyHub.Core.Interfaces;
using System.Diagnostics;
using System.Security.Claims;
using System.Text;

namespace AcademyHub.API.Middlewares
{
    public class RequestLoggingMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly ILogger<RequestLoggingMiddleware> _logger;
        private readonly IServiceProvider _serviceProvider;

        public RequestLoggingMiddleware(
            RequestDelegate next,
            ILogger<RequestLoggingMiddleware> logger,
            IServiceProvider serviceProvider)
        {
            _next = next;
            _logger = logger;
            _serviceProvider = serviceProvider;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            var stopwatch = Stopwatch.StartNew();
            var requestBody = await ReadRequestBodyAsync(context.Request);

            var originalBodyStream = context.Response.Body;
            using var responseBody = new MemoryStream();
            context.Response.Body = responseBody;

            try
            {
                await _next(context);
                stopwatch.Stop();

                var responseBodyText = await ReadResponseBodyAsync(context.Response);

                await LogActionAsync(context, requestBody, responseBodyText, stopwatch.ElapsedMilliseconds);

                await responseBody.CopyToAsync(originalBodyStream);
            }
            catch (Exception)
            {
                throw;
            }
            finally
            {
                context.Response.Body = originalBodyStream;
            }
        }

        private async Task<string> ReadRequestBodyAsync(HttpRequest request)
        {
            if (!request.Body.CanRead) return string.Empty;

            request.EnableBuffering();
            using var reader = new StreamReader(request.Body, Encoding.UTF8, leaveOpen: true);
            var body = await reader.ReadToEndAsync();
            request.Body.Position = 0;
            return body;
        }

        private async Task<string> ReadResponseBodyAsync(HttpResponse response)
        {
            response.Body.Position = 0;
            using var reader = new StreamReader(response.Body, Encoding.UTF8, leaveOpen: true);
            var body = await reader.ReadToEndAsync();
            response.Body.Position = 0;
            return body;
        }

        private async Task LogActionAsync(HttpContext context, string requestBody, string responseBody, long responseTime)
        {
            try
            {
                using var scope = _serviceProvider.CreateScope();
                var unitOfWork = scope.ServiceProvider.GetRequiredService<IUnitOfWork>();

                var userId = context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                var userEmail = context.User?.FindFirst(ClaimTypes.Email)?.Value;

                var actionLog = new ActionLog
                {
                    UserId = userId != null ? int.Parse(userId) : null,
                    UserEmail = userEmail ?? "Anonymous",
                    Action = context.Request.Method,
                    Controller = context.GetRouteValue("controller")?.ToString() ?? "Unknown",
                    ActionName = context.GetRouteValue("action")?.ToString() ?? "Unknown",
                    IpAddress = context.Connection.RemoteIpAddress?.ToString() ?? "Unknown",
                    UserAgent = context.Request.Headers["User-Agent"].ToString(),
                    RequestMethod = context.Request.Method,
                    RequestPath = context.Request.Path,
                    RequestBody = requestBody.Length > 4000 ? requestBody.Substring(0, 4000) : requestBody,
                    ResponseBody = responseBody.Length > 4000 ? responseBody.Substring(0, 4000) : responseBody,
                    StatusCode = context.Response.StatusCode,
                    ResponseTime = responseTime,
                    IsSuccess = context.Response.StatusCode < 400,
                    ErrorMessage = context.Response.StatusCode >= 400 ? $"Status Code: {context.Response.StatusCode}" : null,
                    CreatedDate = DateTime.UtcNow
                };

                await unitOfWork.GetRepository<ActionLog>().AddAsync(actionLog);
                await unitOfWork.SaveChangesAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "ActionLog kaydedilirken hata oluştu");
            }
        }
    }
}
