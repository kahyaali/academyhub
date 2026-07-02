using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AcademyHub.Application.DTOs.Review
{
    public class ReviewStatsDto
    {
        public double AverageRating { get; set; }
        public int TotalReviews { get; set; }
        public int PendingReviews { get; set; }
        public int ApprovedReviews { get; set; }
        public int RejectedReviews { get; set; }
        public Dictionary<int, int> RatingDistribution { get; set; } = new();
    }
}
