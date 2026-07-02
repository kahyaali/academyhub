using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AcademyHub.Application.DTOs.Payment
{
    public class CreatePaymentRequestDto
    {
        [Required(ErrorMessage = "Kurs ID gereklidir")]
        public int CourseId { get; set; }

        [Required(ErrorMessage = "Tutar gereklidir")]
        [Range(0.01, 99999.99, ErrorMessage = "Tutar 0.01 ile 99999.99 arasında olmalıdır")]
        public decimal Amount { get; set; }

        [Required(ErrorMessage = "Ödeme yöntemi gereklidir")]
        public string PaymentMethod { get; set; } = "CreditCard";

        public string? PaymentDetails { get; set; }

        public bool? AutoComplete { get; set; } = true;
    }
}
