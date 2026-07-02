using AcademyHub.Core.Entities;
using AcademyHub.Core.Exceptions;
using AcademyHub.Core.Interfaces;
using AcademyHub.Core.Interfaces.Services;
using Microsoft.Extensions.Logging;
using Microsoft.EntityFrameworkCore;

namespace AcademyHub.Infrastructure.Services
{
    public class StudentService : IStudentService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly ILogger<StudentService> _logger;

        public StudentService(IUnitOfWork unitOfWork, ILogger<StudentService> logger)
        {
            _unitOfWork = unitOfWork;
            _logger = logger;
        }

        public async Task<Student> GetStudentByIdAsync(int id)
        {
            var student = await _unitOfWork.GetRepository<Student>()
                .Query()
                .Include(s => s.User)
                .FirstOrDefaultAsync(s => s.Id == id && !s.IsDeleted);

            if (student == null)
                throw new NotFoundException($"ID {id} olan öğrenci bulunamadı");

            return student;
        }

        public async Task<Student> GetStudentByUserIdAsync(int userId)
        {
            var student = await _unitOfWork.GetRepository<Student>()
                .Query()
                .Include(s => s.User)
                .FirstOrDefaultAsync(s => s.UserId == userId && !s.IsDeleted);

            return student;
        }

        public async Task<Student> UpdateProfileAsync(
       int userId,
       string firstName,
       string lastName,
       string? phoneNumber,
       string? address,
       string? bio)
        {
            var student = await GetStudentByUserIdAsync(userId);
            if (student == null)
                throw new NotFoundException("Öğrenci profili bulunamadı");

            //  Student bilgilerini güncelle (Ad, Soyad, Telefon, Adres)
            student.FirstName = firstName;
            student.LastName = lastName;

            if (!string.IsNullOrEmpty(phoneNumber))
                student.PhoneNumber = phoneNumber;  

            if (!string.IsNullOrEmpty(address))
                student.Address = address;          

            student.UpdatedDate = DateTime.UtcNow;
            student.UpdatedBy = userId;

            //  User bilgilerini de güncelle (PhoneNumber, Address, Bio)
            var user = await _unitOfWork.GetRepository<User>().GetByIdAsync(userId);
            if (user != null)
            {
                if (!string.IsNullOrEmpty(phoneNumber))
                    user.PhoneNumber = phoneNumber;  

                if (!string.IsNullOrEmpty(address))
                    user.Address = address;          

                if (!string.IsNullOrEmpty(bio))
                    user.Bio = bio;

                user.UpdatedDate = DateTime.UtcNow;
                user.UpdatedBy = userId;
                _unitOfWork.GetRepository<User>().Update(user);
            }

            _unitOfWork.GetRepository<Student>().Update(student);
            await _unitOfWork.SaveChangesAsync();

            return student;
        }
    }
}
