using AcademyHub.Core.Interfaces.Services;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Cryptography;
using System.Text;
using System.Threading.Tasks;

namespace AcademyHub.Infrastructure.Services
{

  
    public class PasswordHasher:IPasswordHasher
    {
        public string HashPassword(string password)
        {
            using var hmac = new HMACSHA512();
            var salt = Convert.ToBase64String(hmac.Key);
            var hash = Convert.ToBase64String(hmac.ComputeHash(Encoding.UTF8.GetBytes(password)));
            return $"{salt}:{hash}";
        }

        public bool VerifyPassword(string password, string passwordHash, string passwordSalt)
        {
            var saltBytes = Convert.FromBase64String(passwordSalt);
            using var hmac = new HMACSHA512(saltBytes);
            var hash = Convert.ToBase64String(hmac.ComputeHash(Encoding.UTF8.GetBytes(password)));
            return hash == passwordHash;
        }
    }
}
