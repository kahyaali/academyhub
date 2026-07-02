using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AcademyHub.Application.DTOs.Payment
{
    public class CompletePaymentRequestDto
    {
        [Required(ErrorMessage = "İşlem ID gereklidir")]
        public string TransactionId { get; set; } = string.Empty;
    }
}
