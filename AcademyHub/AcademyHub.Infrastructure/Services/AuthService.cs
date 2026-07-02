using AcademyHub.Core.Entities;
using AcademyHub.Core.Enums;
using AcademyHub.Core.Exceptions;
using AcademyHub.Core.Interfaces;
using AcademyHub.Core.Interfaces.Services;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Cryptography;
using System.Text;
using System.Threading.Tasks;

namespace AcademyHub.Infrastructure.Services
{
    public class AuthService : IAuthService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IPasswordHasher _passwordHasher;

        public AuthService(IUnitOfWork unitOfWork, IPasswordHasher passwordHasher)
        {
            _unitOfWork = unitOfWork;
            _passwordHasher = passwordHasher;
        }


        public async Task<User> RegisterAsync(
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
            DateTime? birthDate = null)
        {
            // Email kontrolü
            if (await EmailExistsAsync(email))
                throw new BusinessRuleException("Bu e-posta adresi zaten kullanımda");

            var passwordHash = _passwordHasher.HashPassword(password);
            var parts = passwordHash.Split(':');
            var salt = parts[0];
            var hash = parts[1];

            var user = new User
            {
                FirstName = firstName,
                LastName = lastName,
                Email = email,
                PasswordHash = hash,
                PasswordSalt = salt,
                Role = role,
                PhoneNumber = phoneNumber,
                ProfileImage = profileImage,
                IsActive = true,
                CreatedDate = DateTime.UtcNow
            };

            await _unitOfWork.GetRepository<User>().AddAsync(user);
            await _unitOfWork.SaveChangesAsync();

            if (role == UserRole.Instructor)
            {
                var instructor = new Instructor
                {
                    UserId = user.Id,
                    FirstName = firstName,
                    LastName = lastName,
                    Bio = bio,
                    Expertise = expertise,
                    ProfileImage = profileImage,
                    IsActive = true,
                    CreatedDate = DateTime.UtcNow
                };
                await _unitOfWork.GetRepository<Instructor>().AddAsync(instructor);
            }
            else if (role == UserRole.Student)
            {
                var student = new Student
                {
                    UserId = user.Id,
                    FirstName = firstName,
                    LastName = lastName,
                    PhoneNumber = phoneNumber,
                    Address = address,
                    BirthDate = birthDate,
                    ProfileImage = profileImage,
                    IsActive = true,
                    CreatedDate = DateTime.UtcNow
                };
                await _unitOfWork.GetRepository<Student>().AddAsync(student);
            }

            await _unitOfWork.SaveChangesAsync();
            return user;
        }

        // ============ DİĞER METOTLAR ============
        public async Task<User> LoginAsync(string email, string password)
        {
            var user = await _unitOfWork.GetRepository<User>()
                .SingleOrDefaultAsync(u => u.Email == email && u.IsActive);

            if (user == null)
                throw new UnauthorizedException("E-posta veya şifre hatalı");

            if (!_passwordHasher.VerifyPassword(password, user.PasswordHash, user.PasswordSalt))
                throw new UnauthorizedException("E-posta veya şifre hatalı");

            user.LastLoginDate = DateTime.UtcNow;
            _unitOfWork.GetRepository<User>().Update(user);
            await _unitOfWork.SaveChangesAsync();

            return user;
        }

        public async Task<bool> EmailExistsAsync(string email)
        {
            return await _unitOfWork.GetRepository<User>()
                .AnyAsync(u => u.Email == email);
        }

        public async Task<User> GetUserByEmailAsync(string email)
        {
            var user = await _unitOfWork.GetRepository<User>()
                .SingleOrDefaultAsync(u => u.Email == email && u.IsActive);

            if (user == null)
                throw new NotFoundException("Kullanıcı bulunamadı");

            return user;
        }

        public async Task<string> GeneratePasswordResetTokenAsync(int userId)
        {
            var token = Convert.ToBase64String(RandomNumberGenerator.GetBytes(32));

            var resetToken = new PasswordResetToken
            {
                UserId = userId,
                Token = token,
                ExpiryDate = DateTime.UtcNow.AddHours(1),
                IsUsed = false,
                CreatedDate = DateTime.UtcNow
            };

            await _unitOfWork.GetRepository<PasswordResetToken>().AddAsync(resetToken);
            await _unitOfWork.SaveChangesAsync();

            return token;
        }

        public async Task<bool> ResetPasswordAsync(string email, string token, string newPassword)
        {
            var user = await GetUserByEmailAsync(email);

            var resetToken = await _unitOfWork.GetRepository<PasswordResetToken>()
                .SingleOrDefaultAsync(rt => rt.UserId == user.Id &&
                                            rt.Token == token &&
                                            !rt.IsUsed &&
                                            rt.ExpiryDate > DateTime.UtcNow);

            if (resetToken == null)
                throw new BusinessRuleException("Geçersiz veya süresi dolmuş token");

            resetToken.IsUsed = true;
            resetToken.UsedDate = DateTime.UtcNow;
            _unitOfWork.GetRepository<PasswordResetToken>().Update(resetToken);

            var passwordHash = _passwordHasher.HashPassword(newPassword);
            var parts = passwordHash.Split(':');
            user.PasswordHash = parts[1];
            user.PasswordSalt = parts[0];
            user.UpdatedDate = DateTime.UtcNow;

            _unitOfWork.GetRepository<User>().Update(user);
            await _unitOfWork.SaveChangesAsync();

            return true;
        }

        public async Task<User> GetUserByIdAsync(int id)
        {
            var user = await _unitOfWork.GetRepository<User>()
                .GetByIdAsync(id);

            if (user == null || !user.IsActive)
                throw new NotFoundException("Kullanıcı bulunamadı");

            return user;
        }

        public async Task UpdateUserRefreshTokenAsync(int userId, string refreshToken, DateTime expiryTime)
        {
            var user = await GetUserByIdAsync(userId);
            user.RefreshToken = refreshToken;
            user.RefreshTokenExpiryTime = expiryTime;
            user.UpdatedDate = DateTime.UtcNow;

            _unitOfWork.GetRepository<User>().Update(user);
            await _unitOfWork.SaveChangesAsync();
        }

        public async Task<bool> ValidateRefreshTokenAsync(int userId, string refreshToken)
        {
            var user = await GetUserByIdAsync(userId);

            if (string.IsNullOrEmpty(user.RefreshToken) ||
                user.RefreshToken != refreshToken ||
                user.RefreshTokenExpiryTime < DateTime.UtcNow)
            {
                return false;
            }

            return true;
        }

        public async Task<bool> ChangePasswordAsync(int userId, string currentPassword, string newPassword)
        {
            var user = await GetUserByIdAsync(userId);
            if (user == null)
                throw new NotFoundException("Kullanıcı bulunamadı");

            // Mevcut şifreyi doğrula
            if (!_passwordHasher.VerifyPassword(currentPassword, user.PasswordHash, user.PasswordSalt))
                return false;

            // Yeni şifreyi hash'le
            var passwordHash = _passwordHasher.HashPassword(newPassword);
            var parts = passwordHash.Split(':');
            user.PasswordHash = parts[1];
            user.PasswordSalt = parts[0];
            user.UpdatedDate = DateTime.UtcNow;

            _unitOfWork.GetRepository<User>().Update(user);
            await _unitOfWork.SaveChangesAsync();

            return true;
        }
    }
}