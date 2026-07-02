using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AcademyHub.Core.Entities
{
    public class PasswordResetToken:BaseEntity
    {
        public int UserId { get; set; }
        public string Token { get; set; } = string.Empty;
        public DateTime ExpiryDate { get; set; }
        public bool IsUsed { get; set; } = false;
        public DateTime? UsedDate { get; set; }

        // Navigation Properties
        public virtual User User { get; set; } = null!;
    }
}
