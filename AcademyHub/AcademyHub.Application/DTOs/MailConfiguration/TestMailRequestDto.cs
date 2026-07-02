using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AcademyHub.Application.DTOs.MailConfiguration
{
    public class TestMailRequestDto
    {
        [Required(ErrorMessage = "Test e-posta adresi gereklidir")]
        [EmailAddress(ErrorMessage = "Geçerli bir e-posta adresi giriniz")]
        public string TestEmail { get; set; } = string.Empty;
    }
}
