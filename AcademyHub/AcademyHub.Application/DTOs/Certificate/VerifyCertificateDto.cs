using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AcademyHub.Application.DTOs.Certificate
{
    public class VerifyCertificateDto
    {
        [Required(ErrorMessage = "Sertifika numarası gereklidir")]
        public string CertificateNumber { get; set; } = string.Empty;
    }
}
