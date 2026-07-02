using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AcademyHub.Core.DTOs
{
    public class CurrencyEarningDto
    {
        public string Currency { get; set; }  // "USD", "EUR", "TL", "GBP"
        public decimal Total { get; set; }
    }
}
