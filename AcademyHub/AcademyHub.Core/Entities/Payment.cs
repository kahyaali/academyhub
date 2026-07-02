using AcademyHub.Core.Enums;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AcademyHub.Core.Entities
{
    public class Payment:BaseEntity
    {
        public int UserId { get; set; }
        public int CourseId { get; set; }
        public decimal Amount { get; set; }
        public Currency Currency { get; set; } = Currency.TL;
        public string? PaymentMethod { get; set; } // CreditCard, BankTransfer, Crypto
        public PaymentStatus Status { get; set; } = PaymentStatus.Pending;
        public string? TransactionId { get; set; }
        public string? PaymentDetails { get; set; } // JSON
        public DateTime PaymentDate { get; set; } = DateTime.UtcNow;
        public decimal? CommissionAmount { get; set; } // Platform komisyonu
        public decimal? InstructorAmount { get; set; } // Eğitmene giden net tutar
        public DateTime? RefundDate { get; set; } 
        public string? RefundReason { get; set; } 

        // Navigation
        public virtual User User { get; set; } = null!;
        public virtual Course Course { get; set; } = null!;
    }
}
