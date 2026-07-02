using AcademyHub.Core.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AcademyHub.Core.Interfaces.Services
{
    public interface ICertificateService
    {
        Task<Certificate> GetCertificateByIdAsync(int id);
        Task<Certificate> GetCertificateByEnrollmentIdAsync(int enrollmentId);
        Task<IEnumerable<Certificate>> GetCertificatesByStudentAsync(int studentId);
        Task<IEnumerable<Certificate>> GetCertificatesByCourseAsync(int courseId);
        Task<Certificate> GenerateCertificateAsync(int enrollmentId);
        Task<string> GenerateCertificatePdfAsync(int certificateId);
        Task<bool> VerifyCertificateAsync(string certificateNumber);
        Task DeleteCertificateAsync(int id);
        Task<int> GetCertificateCountByStudentAsync(int studentId);
        Task<int> GetCertificateCountByCourseAsync(int courseId);
        Task<bool> HasCertificateAsync(int studentId, int courseId);
        Task<Certificate> GetCertificateByCourseAndStudentAsync(int courseId, int studentId);

        Task<byte[]> GenerateCertificatePdfBytesAsync(int certificateId);
    }
}
