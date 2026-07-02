using AcademyHub.Core.Entities;
using AcademyHub.Core.Enums;
using AcademyHub.Core.Exceptions;
using AcademyHub.Core.Interfaces;
using AcademyHub.Core.Interfaces.Services;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace AcademyHub.Infrastructure.Services
{
    public class PaymentService : IPaymentService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly ICourseService _courseService;
        private readonly IEnrollmentService _enrollmentService;
        private readonly INotificationService _notificationService;

        public PaymentService(
            IUnitOfWork unitOfWork,
            ICourseService courseService,
            IEnrollmentService enrollmentService,
            INotificationService notificationService)
        {
            _unitOfWork = unitOfWork;
            _courseService = courseService;
            _enrollmentService = enrollmentService;
            _notificationService = notificationService;
        }

        public async Task<Payment> GetPaymentByIdAsync(int id)
        {
            var payment = await _unitOfWork.GetRepository<Payment>()
                .SingleOrDefaultAsync(p => p.Id == id && !p.IsDeleted);

            if (payment == null)
                throw new NotFoundException($"ID {id} olan ödeme bulunamadı");

            return payment;
        }

        public async Task<IEnumerable<Payment>> GetPaymentsByUserAsync(int userId)
        {
            return await _unitOfWork.GetRepository<Payment>()
                .Query()
                .Include(p => p.Course)  
                .Include(p => p.User)
                .Where(p => p.UserId == userId && !p.IsDeleted)
                .OrderByDescending(p => p.PaymentDate)
                .ToListAsync();
        }

        public async Task<IEnumerable<Payment>> GetPaymentsByCourseAsync(int courseId)
        {
            return await _unitOfWork.GetRepository<Payment>()
                .FindAsync(p => p.CourseId == courseId && !p.IsDeleted);
        }

        public async Task<IEnumerable<Payment>> GetPaymentsByStatusAsync(PaymentStatus status)
        {
            return await _unitOfWork.GetRepository<Payment>()
                .FindAsync(p => p.Status == status && !p.IsDeleted);
        }

        public async Task<Payment> CreatePaymentAsync(int userId, int courseId, decimal amount, string paymentMethod, string? paymentDetails = null)
        {
            // Kullanıcı kontrolü
            var user = await _unitOfWork.GetRepository<User>()
                .GetByIdAsync(userId);

            if (user == null || user.IsDeleted)
                throw new NotFoundException("Geçerli bir kullanıcı bulunamadı");

            // Kurs kontrolü
            var course = await _courseService.GetCourseByIdAsync(courseId);

            if (!course.IsPublished)
                throw new BusinessRuleException("Bu kurs henüz yayınlanmamış");

            if (course.IsFree && amount > 0)
                throw new BusinessRuleException("Bu kurs ücretsizdir, ödeme yapmanıza gerek yok");

            if (!course.IsFree && amount < course.Price)
                throw new BusinessRuleException($"Ödeme tutarı yetersiz. Kurs fiyatı: {course.Price}");

            // ============================================================
            // KAYIT KONTROLÜ - SADECE ACTIVE VE COMPLETED KONTROL ET 
            // ============================================================
            var student = await _unitOfWork.GetRepository<Student>()
                .FirstOrDefaultAsync(s => s.UserId == userId && !s.IsDeleted);

            if (student != null)
            {
                //  SADECE ACTIVE ve COMPLETED kontrol et (Cancelled kontrol etme!)
                var activeEnrollment = await _unitOfWork.GetRepository<Enrollment>()
                    .FirstOrDefaultAsync(e => e.StudentId == student.Id &&
                                              e.CourseId == courseId &&
                                              (e.Status == EnrollmentStatus.Active || e.Status == EnrollmentStatus.Completed) &&
                                              !e.IsDeleted);

                if (activeEnrollment != null)
                {
                    throw new BusinessRuleException("Bu kursa zaten kayıtlısınız");
                }

                //  İptal edilmiş veya silinmiş kayıtları temizle (varsa)
                var cancelledEnrollments = await _unitOfWork.GetRepository<Enrollment>()
                    .FindAsync(e => e.StudentId == student.Id &&
                                   e.CourseId == courseId &&
                                   (e.Status == EnrollmentStatus.Cancelled || e.IsDeleted));

                foreach (var enrollment in cancelledEnrollments)
                {
                    _unitOfWork.GetRepository<Enrollment>().Remove(enrollment);
                    Console.WriteLine($"🗑️ İptal edilmiş kayıt silindi - EnrollmentId: {enrollment.Id}");
                }

                await _unitOfWork.SaveChangesAsync();
            }
            // ============================================================

            // Komisyon hesapla
            var commissionRate = 0.30m;
            var commissionAmount = amount * commissionRate;
            var instructorAmount = amount - commissionAmount;

            var payment = new Payment
            {
                UserId = userId,
                CourseId = courseId,
                Amount = amount,
                Currency = course.Currency,
                PaymentMethod = paymentMethod,
                Status = PaymentStatus.Pending,
                PaymentDate = DateTime.UtcNow,
                CommissionAmount = commissionAmount,
                InstructorAmount = instructorAmount,
                PaymentDetails = paymentDetails,
                CreatedDate = DateTime.UtcNow
            };

            await _unitOfWork.GetRepository<Payment>().AddAsync(payment);
            await _unitOfWork.SaveChangesAsync();

            return payment;
        }

        public async Task<Payment> CompletePaymentAsync(int paymentId, string transactionId)
        {
            var payment = await GetPaymentByIdAsync(paymentId);

            if (payment.Status != PaymentStatus.Pending)
                throw new BusinessRuleException("Bu ödeme zaten işlenmiş");

            payment.Status = PaymentStatus.Completed;
            payment.TransactionId = transactionId;
            payment.UpdatedDate = DateTime.UtcNow;

            _unitOfWork.GetRepository<Payment>().Update(payment);
            await _unitOfWork.SaveChangesAsync();

            //  Ödeme başarılı olduğunda otomatik kayıt oluştur
            var enrollment = await _enrollmentService.CreateEnrollmentAsync(
                payment.UserId,
                payment.CourseId,
                payment.Amount);

            // ============================================================
            //  BİLDİRİM GÖNDER - EĞİTMENE VE ÖĞRENCİYE
            // ============================================================
            try
            {
                // Kursu getir
                var course = await _courseService.GetCourseByIdAsync(payment.CourseId);

                // Öğrenciyi getir
                var student = await _unitOfWork.GetRepository<Student>()
                    .SingleOrDefaultAsync(s => s.UserId == payment.UserId && !s.IsDeleted);

                // Eğitmeni getir
                var instructor = await _unitOfWork.GetRepository<Instructor>()
                    .SingleOrDefaultAsync(i => i.Id == course.InstructorId && !i.IsDeleted);

                //  Eğitmene bildirim gönder
                if (instructor != null && student != null)
                {
                    await _notificationService.CreateNotificationAsync(
                        instructor.UserId,
                        "📚 Yeni Öğrenci Kaydı!",
                        $"{student.FirstName} {student.LastName} kursunuza kaydoldu. (Kurs: {course.Title})",
                        "Success",
                        $"/instructor/students",
                        "fa-user-plus"
                    );

                    Console.WriteLine($"✅ Eğitmene bildirim gönderildi - InstructorId: {instructor.Id}");
                }

                //  Öğrenciye bildirim gönder
                await _notificationService.CreateNotificationAsync(
                    payment.UserId,
                    "✅ Kaydınız Başarılı!",
                    $"'{course.Title}' kursuna başarıyla kaydoldunuz. İyi çalışmalar! 🎉",
                    "Success",
                    $"/my-courses",
                    "fa-check-circle"
                );

                Console.WriteLine($"✅ Öğrenciye bildirim gönderildi - UserId: {payment.UserId}");
            }
            catch (Exception ex)
            {
                // Bildirim gönderilemezse logla ama işlemi engelleme
                Console.WriteLine($"❌ Bildirim gönderilemedi: {ex.Message}");
            }
            // ============================================================

            return payment;
        }

        public async Task<Payment> FailPaymentAsync(int paymentId, string errorMessage)
        {
            var payment = await GetPaymentByIdAsync(paymentId);

            if (payment.Status != PaymentStatus.Pending)
                throw new BusinessRuleException("Bu ödeme zaten işlenmiş");

            payment.Status = PaymentStatus.Failed;
            payment.PaymentDetails = errorMessage;
            payment.UpdatedDate = DateTime.UtcNow;

            _unitOfWork.GetRepository<Payment>().Update(payment);
            await _unitOfWork.SaveChangesAsync();

            return payment;
        }

        public async Task<Payment> RefundPaymentAsync(int paymentId, string refundReason)
        {
            var payment = await GetPaymentByIdAsync(paymentId);

            if (payment.Status != PaymentStatus.Completed)
                throw new BusinessRuleException("Sadece tamamlanmış ödemeler iade edilebilir");

            var daysSincePayment = (DateTime.UtcNow - payment.PaymentDate).TotalDays;
            if (daysSincePayment > 30)
                throw new BusinessRuleException("Ödeme üzerinden 30 günden fazla zaman geçti, iade yapılamaz");

            payment.Status = PaymentStatus.Refunded;
            payment.RefundDate = DateTime.UtcNow;
            payment.RefundReason = refundReason;
            payment.UpdatedDate = DateTime.UtcNow;

            _unitOfWork.GetRepository<Payment>().Update(payment);
            await _unitOfWork.SaveChangesAsync();

            // Kaydı iptal et
            var enrollments = await _unitOfWork.GetRepository<Enrollment>()
                .FindAsync(e => e.StudentId == payment.UserId && e.CourseId == payment.CourseId && !e.IsDeleted);

            foreach (var enrollment in enrollments)
            {
                if (enrollment.Status == EnrollmentStatus.Active)
                {
                    enrollment.Status = EnrollmentStatus.Cancelled;
                    enrollment.UpdatedDate = DateTime.UtcNow;
                    _unitOfWork.GetRepository<Enrollment>().Update(enrollment);
                }
            }

            await _unitOfWork.SaveChangesAsync();

            //  İade bildirimi gönder
            try
            {
                await _notificationService.CreateNotificationAsync(
                    payment.UserId,
                    "💰 İade İşlemi Tamamlandı",
                    $"'{refundReason}' nedeniyle ödemeniz iade edildi. Tutar: {payment.Amount} {payment.Currency}",
                    "Warning",
                    $"/payments",
                    "fa-credit-card"
                );
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ Bildirim gönderilemedi: {ex.Message}");
            }

            return payment;
        }

        public async Task<decimal> GetTotalRevenueAsync()
        {
            var payments = await _unitOfWork.GetRepository<Payment>()
                .FindAsync(p => p.Status == PaymentStatus.Completed && !p.IsDeleted);

            return payments.Sum(p => p.Amount);
        }

        public async Task<decimal> GetUserTotalSpentAsync(int userId)
        {
            var payments = await _unitOfWork.GetRepository<Payment>()
                .FindAsync(p => p.UserId == userId && p.Status == PaymentStatus.Completed && !p.IsDeleted);

            return payments.Sum(p => p.Amount);
        }

        public async Task<decimal> GetInstructorEarningsAsync(int instructorId)
        {
            var courses = await _unitOfWork.GetRepository<Course>()
                .FindAsync(c => c.InstructorId == instructorId && !c.IsDeleted);

            var courseIds = courses.Select(c => c.Id).ToList();

            var payments = await _unitOfWork.GetRepository<Payment>()
                .FindAsync(p => courseIds.Contains(p.CourseId) && p.Status == PaymentStatus.Completed && !p.IsDeleted);

            return payments.Sum(p => p.InstructorAmount ?? 0);
        }

        public async Task<int> GetPaymentCountByStatusAsync(PaymentStatus status)
        {
            return await _unitOfWork.GetRepository<Payment>()
                .CountAsync(p => p.Status == status && !p.IsDeleted);
        }

        public async Task<List<RevenueByCurrencyDto>> GetInstructorEarningsByCurrencyAsync(int instructorId)
        {
            var courses = await _unitOfWork.GetRepository<Course>()
                .FindAsync(c => c.InstructorId == instructorId && !c.IsDeleted);

            var courseIds = courses.Select(c => c.Id).ToList();

            if (!courseIds.Any())
                return new List<RevenueByCurrencyDto>();

            var payments = await _unitOfWork.GetRepository<Payment>()
                .FindAsync(p => courseIds.Contains(p.CourseId) &&
                               p.Status == PaymentStatus.Completed &&
                               !p.IsDeleted);

            var result = payments
                .GroupBy(p => p.Currency)
                .Select(g => new RevenueByCurrencyDto
                {
                    Currency = GetCurrencyString(g.Key),
                    Total = g.Sum(p => p.InstructorAmount ?? p.Amount * 0.7m)
                })
                .ToList();

            return result;
        }

        // ============================================================
        //  ÖĞRENCİ İADE TALEBİ 
        // ============================================================

        /// <summary>
        /// Öğrenci iade talebi oluşturur
        /// </summary>
        public async Task<Payment> RequestRefundAsync(int paymentId, string reason)
        {
            var payment = await GetPaymentByIdAsync(paymentId);

            // Sadece tamamlanmış ödemeler iade edilebilir
            if (payment.Status != PaymentStatus.Completed)
                throw new BusinessRuleException("Sadece tamamlanmış ödemeler için iade talebi oluşturulabilir");

            // 30 gün içinde mi kontrol et
            var daysSincePayment = (DateTime.UtcNow - payment.PaymentDate).TotalDays;
            if (daysSincePayment > 30)
                throw new BusinessRuleException("Ödeme üzerinden 30 günden fazla zaman geçti, iade talebi oluşturulamaz");

            // Zaten iade talebi var mı kontrol et
            if (payment.Status == PaymentStatus.RefundRequested)
                throw new BusinessRuleException("Bu ödeme için zaten bir iade talebi mevcut");

            if (payment.Status == PaymentStatus.Refunded)
                throw new BusinessRuleException("Bu ödeme zaten iade edilmiş");

            //  İade talebi oluştur (Admin onayı bekliyor)
            payment.Status = PaymentStatus.RefundRequested;
            payment.RefundReason = reason;
            payment.RefundDate = DateTime.UtcNow;
            payment.UpdatedDate = DateTime.UtcNow;

            _unitOfWork.GetRepository<Payment>().Update(payment);
            await _unitOfWork.SaveChangesAsync();

            // ============================================================
            //  ADMIN'E BİLDİRİM GÖNDER 
            // ============================================================
            try
            {
                var user = await _unitOfWork.GetRepository<User>()
                    .GetByIdAsync(payment.UserId);

                var course = await _courseService.GetCourseByIdAsync(payment.CourseId);

                var adminUsers = await _unitOfWork.GetRepository<User>()
                    .FindAsync(u => u.Role == UserRole.Admin && u.IsActive);

                foreach (var admin in adminUsers)
                {
                    await _notificationService.CreateNotificationAsync(
                        admin.Id,
                        "💰 Yeni İade Talebi!",
                        $"{user?.FirstName} {user?.LastName} tarafından iade talebi gönderildi.\n" +
                        $"Kurs: {course.Title}\n" +
                        $"Tutar: {payment.Amount} {payment.Currency}\n" +
                        $"Sebep: {reason}",
                        "Warning",
                        $"/admin/refunds",
                        "fa-credit-card"
                    );
                }

                //  Öğrenciye bildirim gönder
                await _notificationService.CreateNotificationAsync(
                    payment.UserId,
                    "📩 İade Talebiniz Alındı",
                    $"İade talebiniz başarıyla oluşturuldu. Admin onayı bekleniyor.",
                    "Info",
                    $"/payments",
                    "fa-clock"
                );

                Console.WriteLine($"✅ İade talebi oluşturuldu - PaymentId: {paymentId}");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ Bildirim gönderilemedi: {ex.Message}");
            }
            // ============================================================

            return payment;
        }

        /// <summary>
        /// Admin iade talebini onaylar
        /// </summary>
        public async Task<Payment> ApproveRefundAsync(int paymentId)
        {
            var payment = await GetPaymentByIdAsync(paymentId);

            if (payment.Status != PaymentStatus.RefundRequested)
                throw new BusinessRuleException("Sadece iade talebi bekleyen ödemeler onaylanabilir");

            // İadeyi gerçekleştir
            payment.Status = PaymentStatus.Refunded;
            payment.RefundDate = DateTime.UtcNow;
            payment.UpdatedDate = DateTime.UtcNow;

            _unitOfWork.GetRepository<Payment>().Update(payment);
            await _unitOfWork.SaveChangesAsync();

            // ============================================================
            //  KAYDI TAMAMEN SİL (Fiziksel olarak) 
            // ============================================================
            var student = await _unitOfWork.GetRepository<Student>()
                .FirstOrDefaultAsync(s => s.UserId == payment.UserId && !s.IsDeleted);

            if (student != null)
            {
                // Bu kursa ait tüm kayıtları bul (Active, Cancelled, hepsi)
                var enrollments = await _unitOfWork.GetRepository<Enrollment>()
                    .FindAsync(e => e.StudentId == student.Id && e.CourseId == payment.CourseId);

                foreach (var enrollment in enrollments)
                {
                    //  FİZİKSEL OLARAK SİL (Remove)
                    _unitOfWork.GetRepository<Enrollment>().Remove(enrollment);
                    Console.WriteLine($"🗑️ Kayıt fiziksel olarak silindi - EnrollmentId: {enrollment.Id}, Status: {enrollment.Status}");
                }

                await _unitOfWork.SaveChangesAsync();
                Console.WriteLine($"✅ Tüm kayıtlar silindi - StudentId: {student.Id}, CourseId: {payment.CourseId}");
            }
            // ============================================================

            // Öğrenciye bildirim gönder
            try
            {
                await _notificationService.CreateNotificationAsync(
                    payment.UserId,
                    "✅ İadeniz Onaylandı!",
                    $"İade talebiniz onaylandı. Tutar: {payment.Amount} {payment.Currency} hesabınıza iade edilecektir.",
                    "Success",
                    $"/payments",
                    "fa-check-circle"
                );

                Console.WriteLine($"✅ İade onaylandı - PaymentId: {paymentId}");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ Bildirim gönderilemedi: {ex.Message}");
            }

            return payment;
        }

        /// <summary>
        /// Admin iade talebini reddeder
        /// </summary>
        public async Task<Payment> RejectRefundAsync(int paymentId, string reason)
        {
            var payment = await GetPaymentByIdAsync(paymentId);

            if (payment.Status != PaymentStatus.RefundRequested)
                throw new BusinessRuleException("Sadece iade talebi bekleyen ödemeler reddedilebilir");

            //  İade talebini reddet (eski haline dön)
            payment.Status = PaymentStatus.Completed;
            payment.RefundReason = $"Reddedildi: {reason}";
            payment.UpdatedDate = DateTime.UtcNow;

            _unitOfWork.GetRepository<Payment>().Update(payment);
            await _unitOfWork.SaveChangesAsync();

            //  Öğrenciye bildirim gönder
            try
            {
                await _notificationService.CreateNotificationAsync(
                    payment.UserId,
                    "❌ İade Talebiniz Reddedildi",
                    $"İade talebiniz reddedildi.\nSebep: {reason}",
                    "Error",
                    $"/payments",
                    "fa-times-circle"
                );

                Console.WriteLine($"✅ İade reddedildi - PaymentId: {paymentId}");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ Bildirim gönderilemedi: {ex.Message}");
            }

            return payment;
        }

        /// <summary>
        /// Kullanıcının iade edilebilir ödemelerini getirir (30 gün içinde yapılan tamamlanmış ödemeler)
        /// </summary>
        public async Task<IEnumerable<Payment>> GetRefundablePaymentsByUserAsync(int userId)
        {
            var thirtyDaysAgo = DateTime.UtcNow.AddDays(-30);

            return await _unitOfWork.GetRepository<Payment>()
                .Query()
                .Include(p => p.Course)
                .Where(p => p.UserId == userId
                            && p.Status == PaymentStatus.Completed
                            && !p.IsDeleted
                            && p.PaymentDate >= thirtyDaysAgo)
                .OrderByDescending(p => p.PaymentDate)
                .ToListAsync();
        }

        private string GetCurrencyString(Currency currency)
        {
            if ((int)currency == 0)
                return "TL";

            return currency switch
            {
                Currency.TL => "TL",
                Currency.USD => "USD",
                Currency.EUR => "EUR",
                Currency.GBP => "GBP",
                _ => "TL"
            };
        }
    }
}