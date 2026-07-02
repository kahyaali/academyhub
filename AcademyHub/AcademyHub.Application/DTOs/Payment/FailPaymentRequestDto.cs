using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AcademyHub.Application.DTOs.Payment
{
    public class FailPaymentRequestDto
    {
        [Required(ErrorMessage = "Hata mesajı gereklidir")]
        public string ErrorMessage { get; set; } = string.Empty;
    }
}
