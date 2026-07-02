using AcademyHub.Core.Entities;
using AcademyHub.Core.Enums;
using AcademyHub.Core.Exceptions;
using AcademyHub.Core.Interfaces;
using AcademyHub.Core.Interfaces.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;



namespace AcademyHub.Infrastructure.Services
{
    public class CertificateService : ICertificateService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IEnrollmentService _enrollmentService;
        private readonly ICourseService _courseService;
        private readonly ILogger<CertificateService> _logger;
    

        public CertificateService(
            IUnitOfWork unitOfWork,
            IEnrollmentService enrollmentService,
            ICourseService courseService,
            ILogger<CertificateService> logger)
        {
            _unitOfWork = unitOfWork;
            _enrollmentService = enrollmentService;
            _courseService = courseService;
            _logger = logger;
        }

        public async Task<Certificate> GetCertificateByIdAsync(int id)
        {
            var certificate = await _unitOfWork.GetRepository<Certificate>()
                .Query()
                .Include(c => c.Student)
                .Include(c => c.Course)
                .FirstOrDefaultAsync(c => c.Id == id && !c.IsDeleted);

            if (certificate == null)
                throw new NotFoundException($"ID {id} olan sertifika bulunamadı");

            return certificate;
        }

        public async Task<Certificate> GetCertificateByEnrollmentIdAsync(int enrollmentId)
        {
            var certificate = await _unitOfWork.GetRepository<Certificate>()
                .Query()
                .Include(c => c.Student)
                .Include(c => c.Course)
                .FirstOrDefaultAsync(c => c.EnrollmentId == enrollmentId && !c.IsDeleted);

            if (certificate == null)
                throw new NotFoundException($"Kayıt ID {enrollmentId} için sertifika bulunamadı");

            return certificate;
        }

        public async Task<IEnumerable<Certificate>> GetCertificatesByStudentAsync(int studentId)
        {
            return await _unitOfWork.GetRepository<Certificate>()
                .Query()
                .Include(c => c.Student)
                .Include(c => c.Course)
                .Where(c => c.StudentId == studentId && !c.IsDeleted)
                .ToListAsync();
        }

        public async Task<IEnumerable<Certificate>> GetCertificatesByCourseAsync(int courseId)
        {
            return await _unitOfWork.GetRepository<Certificate>()
                .Query()
                .Include(c => c.Student)
                .Include(c => c.Course)
                .Where(c => c.CourseId == courseId && !c.IsDeleted)
                .ToListAsync();
        }

        public async Task<Certificate> GenerateCertificateAsync(int enrollmentId)
        {
            var enrollment = await _enrollmentService.GetEnrollmentByIdAsync(enrollmentId);

            if (enrollment.Status != EnrollmentStatus.Completed)
                throw new BusinessRuleException("Sadece tamamlanmış kurslar için sertifika oluşturulabilir");

            var existingCertificate = await _unitOfWork.GetRepository<Certificate>()
                .SingleOrDefaultAsync(c => c.EnrollmentId == enrollmentId && !c.IsDeleted);

            if (existingCertificate != null)
                throw new BusinessRuleException("Bu kayıt için zaten bir sertifika oluşturulmuş");

            var course = await _courseService.GetCourseByIdAsync(enrollment.CourseId);
            var student = await _unitOfWork.GetRepository<User>().GetByIdAsync(enrollment.StudentId);

            if (student == null || student.IsDeleted)
                throw new NotFoundException("Öğrenci bulunamadı");

            var certificateNumber = GenerateCertificateNumber();

            var certificate = new Certificate
            {
                CertificateNumber = certificateNumber,
                StudentId = enrollment.StudentId,
                CourseId = enrollment.CourseId,
                EnrollmentId = enrollmentId,
                IssueDate = DateTime.UtcNow,
                IsVerified = true,
                VerifiedDate = DateTime.UtcNow,
                CreatedDate = DateTime.UtcNow
            };

            await _unitOfWork.GetRepository<Certificate>().AddAsync(certificate);
            await _unitOfWork.SaveChangesAsync();

            certificate.PdfUrl = $"/certificates/{certificate.CertificateNumber}.pdf";
            certificate.UpdatedDate = DateTime.UtcNow;

            _unitOfWork.GetRepository<Certificate>().Update(certificate);
            await _unitOfWork.SaveChangesAsync();

            enrollment.CertificateUrl = certificate.PdfUrl;
            enrollment.CertificateNumber = certificate.CertificateNumber;
            enrollment.CertificateIssuedDate = certificate.IssueDate;
            enrollment.UpdatedDate = DateTime.UtcNow;

            _unitOfWork.GetRepository<Enrollment>().Update(enrollment);
            await _unitOfWork.SaveChangesAsync();

            _logger.LogInformation($"✅ Sertifika oluşturuldu - No: {certificateNumber}");

            return certificate;
        }

        public async Task<string> GenerateCertificatePdfAsync(int certificateId)
        {
            var certificate = await GetCertificateByIdAsync(certificateId);

            return certificate.PdfUrl ?? $"/certificates/{certificate.CertificateNumber}.pdf";
        }

        public async Task<bool> VerifyCertificateAsync(string certificateNumber)
        {
            var certificate = await _unitOfWork.GetRepository<Certificate>()
                .SingleOrDefaultAsync(c => c.CertificateNumber == certificateNumber && !c.IsDeleted);

            if (certificate == null)
                return false;

            certificate.IsVerified = true;
            certificate.VerifiedDate = DateTime.UtcNow;
            certificate.UpdatedDate = DateTime.UtcNow;

            _unitOfWork.GetRepository<Certificate>().Update(certificate);
            await _unitOfWork.SaveChangesAsync();

            return true;
        }

        public async Task DeleteCertificateAsync(int id)
        {
            var certificate = await GetCertificateByIdAsync(id);

            certificate.IsDeleted = true;
            certificate.UpdatedDate = DateTime.UtcNow;

            _unitOfWork.GetRepository<Certificate>().Update(certificate);
            await _unitOfWork.SaveChangesAsync();

            _logger.LogInformation($"Sertifika silindi - ID: {id}");
        }

        public async Task<int> GetCertificateCountByStudentAsync(int studentId)
        {
            return await _unitOfWork.GetRepository<Certificate>()
                .CountAsync(c => c.StudentId == studentId && !c.IsDeleted);
        }

        public async Task<int> GetCertificateCountByCourseAsync(int courseId)
        {
            return await _unitOfWork.GetRepository<Certificate>()
                .CountAsync(c => c.CourseId == courseId && !c.IsDeleted);
        }

        public async Task<Certificate> GetCertificateByCourseAndStudentAsync(int courseId, int studentId)
        {
            return await _unitOfWork.GetRepository<Certificate>()
                .SingleOrDefaultAsync(c => c.CourseId == courseId && c.StudentId == studentId && !c.IsDeleted);
        }

        public async Task<bool> HasCertificateAsync(int studentId, int courseId)
        {
            return await _unitOfWork.GetRepository<Certificate>()
                .AnyAsync(c => c.StudentId == studentId && c.CourseId == courseId && !c.IsDeleted);
        }

        public async Task<byte[]> GenerateCertificatePdfBytesAsync(int certificateId)
        {
            var certificate = await GetCertificateByIdAsync(certificateId);

            if (certificate == null)
                throw new NotFoundException($"Sertifika bulunamadı: {certificateId}");

            string studentName = certificate.Student != null
                ? $"{certificate.Student.FirstName} {certificate.Student.LastName}"
                : "Bilinmeyen Öğrenci";

            string courseTitle = certificate.Course?.Title ?? "Kurs";

            //  QuestPDF ile PDF oluştur
            var document = Document.Create(container =>
            {
                container.Page(page =>
                {
                    page.Size(PageSizes.A4);
                    page.Margin(40);
                    page.Background(Colors.White);

                    page.Content().Column(column =>
                    {
                        column.Item().Text("🎓").FontSize(48).AlignCenter();

                        column.Item().Text("SERTİFİKA")
                            .FontSize(32)
                            .Bold()
                            .FontColor(Colors.Blue.Darken2)
                            .AlignCenter();

                        column.Item().Text("Başarıyla tamamladığını onaylarız")
                            .FontSize(16)
                            .FontColor(Colors.Grey.Medium)
                            .AlignCenter();

                        column.Item().PaddingVertical(20).LineHorizontal(1);

                        column.Item().Text(studentName)
                            .FontSize(28)
                            .Bold()
                            .FontColor(Colors.Blue.Accent2)
                            .AlignCenter();

                        column.Item().PaddingVertical(10);

                        column.Item().Text($"📚 {courseTitle}")
                            .FontSize(20)
                            .FontColor(Colors.Grey.Darken1)
                            .AlignCenter();

                        column.Item().PaddingVertical(15);

                        column.Item().Text($"Sertifika No: {certificate.CertificateNumber}")
                            .FontSize(12)
                            .FontColor(Colors.Grey.Medium)
                            .AlignCenter();

                        column.Item().Text($"Veriliş Tarihi: {certificate.IssueDate:dd MMMM yyyy}")
                            .FontSize(12)
                            .FontColor(Colors.Grey.Medium)
                            .AlignCenter();

                        column.Item().PaddingVertical(20).LineHorizontal(1);

                        column.Item().Row(row =>
                        {
                            row.RelativeItem().Text("AcademyHub").FontSize(10).FontColor(Colors.Grey.Medium);
                            row.RelativeItem().Text("✅ Doğrulandı").FontSize(10).FontColor(Colors.Green.Medium).AlignCenter();
                            row.RelativeItem().Text(certificate.IssueDate.ToString("dd.MM.yyyy")).FontSize(10).FontColor(Colors.Grey.Medium).AlignRight();
                        });
                    });
                });
            });

            //  PDF'i byte[] olarak döndür
            return document.GeneratePdf();
        }

        private string GenerateCertificateNumber()
        {
            var prefix = "AH";
            var date = DateTime.UtcNow.ToString("yyyyMMdd");
            var random = new Random().Next(10000, 99999);
            return $"{prefix}-{date}-{random}";
        }
    }
}