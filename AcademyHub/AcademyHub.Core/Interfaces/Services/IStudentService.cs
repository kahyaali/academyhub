using AcademyHub.Core.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AcademyHub.Core.Interfaces.Services
{
    public interface IStudentService
    {
        Task<Student> GetStudentByIdAsync(int id);
        Task<Student> GetStudentByUserIdAsync(int userId);
        Task<Student> UpdateProfileAsync(int userId, string firstName, string lastName, string? phoneNumber, string? address, string? bio);
    }
}
