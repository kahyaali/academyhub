using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AcademyHub.Application.DTOs.Payment
{
    public class RequestRefundDto
    {
        [Required(ErrorMessage = "İade sebebi gereklidir")]
        [MinLength(5, ErrorMessage = "İade sebebi en az 5 karakter olmalıdır")]
        [MaxLength(500, ErrorMessage = "İade sebebi en fazla 500 karakter olmalıdır")]
        public string Reason { get; set; } = string.Empty;
    }
}
