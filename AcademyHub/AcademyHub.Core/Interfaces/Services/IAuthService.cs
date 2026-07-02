using AcademyHub.Core.Entities;
using AcademyHub.Core.Enums;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AcademyHub.Core.Interfaces.Services
{
    public interface IAuthService
    {
        Task<User> RegisterAsync(
              string firstName,
              string lastName,
              string email,
              string password,
              UserRole role,
              string? phoneNumber = null,
              string? profileImage = null,
              string? bio = null,
              string? expertise = null,
              string? address = null,
              DateTime? birthDate = null);

        Task<User> LoginAsync(string email, string password);
        Task<bool> EmailExistsAsync(string email);
        Task<User> GetUserByEmailAsync(string email);
        Task<string> GeneratePasswordResetTokenAsync(int userId);
        Task<bool> ResetPasswordAsync(string email, string token, string newPassword);
        Task<User> GetUserByIdAsync(int id);
        Task UpdateUserRefreshTokenAsync(int userId, string refreshToken, DateTime expiryTime);
        Task<bool> ValidateRefreshTokenAsync(int userId, string refreshToken);

        Task<bool> ChangePasswordAsync(int userId, string currentPassword, string newPassword);
    }
}
