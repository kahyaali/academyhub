using AcademyHub.Core.Entities;
using AcademyHub.Core.Enums;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AcademyHub.Core.Interfaces.Services
{
    public interface IPaymentService
    {
        Task<Payment> GetPaymentByIdAsync(int id);
        Task<IEnumerable<Payment>> GetPaymentsByUserAsync(int userId);
        Task<IEnumerable<Payment>> GetPaymentsByCourseAsync(int courseId);
        Task<IEnumerable<Payment>> GetPaymentsByStatusAsync(PaymentStatus status);
        Task<Payment> CreatePaymentAsync(int userId, int courseId, decimal amount, string paymentMethod, string? paymentDetails = null);
        Task<Payment> CompletePaymentAsync(int paymentId, string transactionId);
        Task<Payment> FailPaymentAsync(int paymentId, string errorMessage);
        Task<Payment> RefundPaymentAsync(int paymentId, string refundReason);
        Task<decimal> GetTotalRevenueAsync();
        Task<decimal> GetUserTotalSpentAsync(int userId);
        Task<decimal> GetInstructorEarningsAsync(int instructorId);
        Task<int> GetPaymentCountByStatusAsync(PaymentStatus status);

        Task<List<RevenueByCurrencyDto>> GetInstructorEarningsByCurrencyAsync(int instructorId);


        Task<Payment> RequestRefundAsync(int paymentId, string reason);
        Task<Payment> ApproveRefundAsync(int paymentId);
        Task<Payment> RejectRefundAsync(int paymentId, string reason);
        Task<IEnumerable<Payment>> GetRefundablePaymentsByUserAsync(int userId);
    }

    public class RevenueByCurrencyDto
    {
        public string Currency { get; set; } = string.Empty;
        public decimal Total { get; set; }
    }
}
