using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AcademyHub.Core.Exceptions
{
    public class UnauthorizedException:Exception
    {
        public UnauthorizedException() : base("Yetkisiz erişim.") { }
        public UnauthorizedException(string message) : base(message) { }
        public UnauthorizedException(string message, Exception innerException) : base(message, innerException) { }
    }
}
