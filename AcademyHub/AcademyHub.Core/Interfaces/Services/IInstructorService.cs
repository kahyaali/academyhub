using AcademyHub.Core.Entities;
using AcademyHub.Core.DTOs;

namespace AcademyHub.Core.Interfaces.Services
{
    public interface IInstructorService
    {
        Task<Instructor> GetInstructorByIdAsync(int id);
        Task<Instructor> GetInstructorByUserIdAsync(int userId);
        Task<IEnumerable<Instructor>> GetAllInstructorsAsync();
        Task<IEnumerable<Instructor>> GetActiveInstructorsAsync();
        Task<Instructor> CreateInstructorAsync(Instructor instructor);
        Task<Instructor> UpdateInstructorAsync(Instructor instructor);
        Task<Instructor> UpdateProfileAsync(int userId, string firstName, string lastName, string? bio, string? expertise, string? phoneNumber, string? address);
        Task<string> UpdateProfileImageAsync(int userId, string imageUrl);
        Task RemoveProfileImageAsync(int userId);
        Task DeleteInstructorAsync(int id);
        Task<bool> InstructorExistsAsync(int id);
        Task<bool> InstructorExistsByUserIdAsync(int userId);
        Task<int> GetInstructorCountAsync();
        Task<decimal> GetTotalEarningsAsync(int instructorId);
        Task<int> GetTotalStudentsAsync(int instructorId);
        Task<double> GetAverageRatingAsync(int instructorId);
        Task<int> GetTotalCoursesAsync(int instructorId);

        Task<Instructor> GetInstructorProfileAsync(int userId);

        Task<IEnumerable<CurrencyEarningDto>> GetEarningsByCurrencyAsync(int instructorId);

        Task<IEnumerable<Instructor>> GetAllInstructorsWithDetailsAsync();


    }
}
