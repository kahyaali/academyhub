using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AcademyHub.Core.Entities
{
    public class Review:BaseEntity
    {
        public string? Comment { get; set; }
        public int Rating { get; set; }
        public int CourseId { get; set; }
        public int UserId { get; set; }
        public bool IsApproved { get; set; } = false;

        public DateTime? ApprovedDate { get; set; }  
        public int? ApprovedBy { get; set; }  

        // Navigation Properties
        public virtual Course Course { get; set; } = null!;
        public virtual User User { get; set; } = null!;
    }
}
