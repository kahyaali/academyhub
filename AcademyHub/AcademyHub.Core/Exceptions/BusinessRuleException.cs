using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AcademyHub.Core.Exceptions
{
    public class BusinessRuleException:Exception
    {
        public BusinessRuleException() : base("İş kuralı ihlali.") { }
        public BusinessRuleException(string message) : base(message) { }
        public BusinessRuleException(string message, Exception innerException) : base(message, innerException) { }
    }
}
