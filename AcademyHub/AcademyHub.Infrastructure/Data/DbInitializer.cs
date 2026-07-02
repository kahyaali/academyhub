using AcademyHub.Core.Entities;
using AcademyHub.Core.Enums;
using AcademyHub.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;
using System;
using System.Linq;
using System.Threading.Tasks;

namespace AcademyHub.Infrastructure.Data
{
    public static class DbInitializer
    {
        public static async Task InitializeAsync(AppDbContext context)
        {
            // Admin zaten varsa çık
            if (await context.Users.AnyAsync(u => u.Email == "admin@academyhub.com"))
                return;

            var passwordHasher = new PasswordHasher();

            // ============ SADECE ADMIN ============
            var adminHash = passwordHasher.HashPassword("Admin123!");
            var adminParts = adminHash.Split(':');

            var admin = new User
            {
                FirstName = "Admin",
                LastName = "User",
                Email = "admin@academyhub.com",
                PasswordHash = adminParts[1],
                PasswordSalt = adminParts[0],
                Role = UserRole.Admin,
                IsActive = true,
                IsSystemAdmin = true,
                CreatedDate = DateTime.UtcNow,
                UpdatedDate = DateTime.UtcNow
            };

            await context.Users.AddAsync(admin);
            await context.SaveChangesAsync();
        }
    }
}