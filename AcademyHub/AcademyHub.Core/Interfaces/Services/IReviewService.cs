using AcademyHub.Core.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AcademyHub.Core.Interfaces.Services
{
    public interface IReviewService
    {
        Task<Review> GetReviewByIdAsync(int id);
        Task<IEnumerable<Review>> GetReviewsByCourseIdAsync(int courseId);
        Task<IEnumerable<Review>> GetReviewsByUserIdAsync(int userId);
        Task<IEnumerable<Review>> GetPendingReviewsAsync();
        Task<Review> CreateReviewAsync(int userId, int courseId, int rating, string? comment);
        Task<Review> UpdateReviewAsync(int id, int rating, string? comment);
        Task DeleteReviewAsync(int id);
        Task<Review> ApproveReviewAsync(int id);  
        Task<Review> RejectReviewAsync(int id);
        Task<double> GetAverageRatingByCourseIdAsync(int courseId);
        Task<int> GetReviewCountByCourseIdAsync(int courseId);
        Task<bool> HasUserReviewedAsync(int userId, int courseId);
    }
}
