using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AcademyHub.Core.Entities
{
    public class Notification:BaseEntity
    {
        public int UserId { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Message { get; set; } = string.Empty;
        public string? Type { get; set; }
        public bool IsRead { get; set; } = false;
        public DateTime? ReadDate { get; set; }
        public string? Link { get; set; }
        public string? Icon { get; set; }

        // Navigation Properties
        public virtual User User { get; set; } = null!;
    }
}
