using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AcademyHub.Application.DTOs.Payment
{
    public class RefundPaymentRequestDto
    {
        [Required(ErrorMessage = "İade sebebi gereklidir")]
        public string RefundReason { get; set; } = string.Empty;
    }
}
