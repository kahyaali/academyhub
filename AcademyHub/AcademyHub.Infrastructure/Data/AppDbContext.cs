using AcademyHub.Core.Entities;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AcademyHub.Infrastructure.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

        public DbSet<User> Users { get; set; }
        public DbSet<Instructor> Instructors { get; set; }  
        public DbSet<Student> Students { get; set; }        
        public DbSet<Category> Categories { get; set; }
        public DbSet<Course> Courses { get; set; }
        public DbSet<Lesson> Lessons { get; set; }

        public DbSet<Certificate> Certificates { get; set; }
        public DbSet<Enrollment> Enrollments { get; set; }
        public DbSet<LessonProgress> LessonProgresses { get; set; }
        public DbSet<Exam> Exams { get; set; }
        public DbSet<Question> Questions { get; set; }
        public DbSet<Answer> Answers { get; set; }
        public DbSet<ExamResult> ExamResults { get; set; }
        public DbSet<Review> Reviews { get; set; }
        public DbSet<Payment> Payments { get; set; }
        public DbSet<Notification> Notifications { get; set; }
        public DbSet<PasswordResetToken> PasswordResetTokens { get; set; }
        public DbSet<MailConfiguration> MailConfigurations { get; set; }
        public DbSet<ActionLog> ActionLogs { get; set; }
        public DbSet<ErrorLog> ErrorLogs { get; set; }
        public DbSet<EmailLog> EmailLogs { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // ============ USER CONFIGURATION ============
            modelBuilder.Entity<User>(entity =>
            {
                entity.HasIndex(e => e.Email).IsUnique();
                entity.Property(e => e.Email).IsRequired().HasMaxLength(100);
                entity.Property(e => e.FirstName).IsRequired().HasMaxLength(50);
                entity.Property(e => e.LastName).IsRequired().HasMaxLength(50);
                entity.Property(e => e.PasswordHash).IsRequired();
                entity.Property(e => e.PasswordSalt).IsRequired();
                entity.Property(e => e.Balance).HasPrecision(18, 2);

                // User → Instructor (1-1)
                entity.HasOne(u => u.Instructor)
                      .WithOne(i => i.User)
                      .HasForeignKey<Instructor>(i => i.UserId)
                      .OnDelete(DeleteBehavior.Restrict);

                // User → Student (1-1)
                entity.HasOne(u => u.Student)
                      .WithOne(s => s.User)
                      .HasForeignKey<Student>(s => s.UserId)
                      .OnDelete(DeleteBehavior.Restrict);
            });

            // ============ INSTRUCTOR CONFIGURATION ============
            modelBuilder.Entity<Instructor>(entity =>
            {
                entity.Property(e => e.FirstName).IsRequired().HasMaxLength(50);
                entity.Property(e => e.LastName).IsRequired().HasMaxLength(50);
                entity.Property(e => e.Bio).HasMaxLength(1000);
                entity.Property(e => e.Expertise).HasMaxLength(500);
                entity.Property(e => e.TotalEarnings).HasPrecision(18, 2);

                entity.HasOne(i => i.User)
                      .WithOne(u => u.Instructor)
                      .HasForeignKey<Instructor>(i => i.UserId)
                      .OnDelete(DeleteBehavior.Restrict);
            });

            // ============ STUDENT CONFIGURATION ============
            modelBuilder.Entity<Student>(entity =>
            {
                entity.Property(e => e.FirstName).IsRequired().HasMaxLength(50);
                entity.Property(e => e.LastName).IsRequired().HasMaxLength(50);
                entity.Property(e => e.PhoneNumber).HasMaxLength(20);
                entity.Property(e => e.Address).HasMaxLength(500);

                entity.HasOne(s => s.User)
                      .WithOne(u => u.Student)
                      .HasForeignKey<Student>(s => s.UserId)
                      .OnDelete(DeleteBehavior.Restrict);
            });

            // ============ CATEGORY CONFIGURATION ============
            modelBuilder.Entity<Category>(entity =>
            {
                entity.Property(e => e.Name).IsRequired().HasMaxLength(100);
                entity.HasIndex(e => e.Name);
                entity.HasOne(e => e.ParentCategory)
                      .WithMany(e => e.SubCategories)
                      .HasForeignKey(e => e.ParentCategoryId)
                      .OnDelete(DeleteBehavior.Restrict);
            });

            // ============ COURSE CONFIGURATION ============
            modelBuilder.Entity<Course>(entity =>
            {
                entity.Property(e => e.Title).IsRequired().HasMaxLength(200);
                entity.Property(e => e.Description).IsRequired();
                entity.Property(e => e.Price).HasPrecision(18, 2);
                entity.HasIndex(e => e.Title);
                entity.HasIndex(e => e.InstructorId);
                entity.HasIndex(e => e.CategoryId);
                entity.HasIndex(e => e.IsPublished);

                entity.HasOne(e => e.Instructor)
                      .WithMany(e => e.Courses)
                      .HasForeignKey(e => e.InstructorId)
                      .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(e => e.Category)
                      .WithMany(e => e.Courses)
                      .HasForeignKey(e => e.CategoryId)
                      .OnDelete(DeleteBehavior.Restrict);
            });

            // ============ LESSON CONFIGURATION ============
            modelBuilder.Entity<Lesson>(entity =>
            {
                entity.Property(e => e.Title).IsRequired().HasMaxLength(200);
                entity.HasIndex(e => e.CourseId);
                entity.HasIndex(e => e.Order);

                entity.HasOne(e => e.Course)
                      .WithMany(e => e.Lessons)
                      .HasForeignKey(e => e.CourseId)
                      .OnDelete(DeleteBehavior.Cascade);
            });

            // ============ ENROLLMENT CONFIGURATION ============
            modelBuilder.Entity<Enrollment>(entity =>
            {
                entity.HasIndex(e => new { e.StudentId, e.CourseId }).IsUnique();
                entity.HasIndex(e => e.Status);
                entity.HasIndex(e => e.EnrollmentDate);
                entity.Property(e => e.PaidAmount).HasPrecision(18, 2);

                entity.HasOne(e => e.Student)
                      .WithMany(e => e.Enrollments)
                      .HasForeignKey(e => e.StudentId)
                      .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(e => e.Course)
                      .WithMany(e => e.Enrollments)
                      .HasForeignKey(e => e.CourseId)
                      .OnDelete(DeleteBehavior.Restrict);
            });

            // ============ LESSON PROGRESS CONFIGURATION ============
            modelBuilder.Entity<LessonProgress>(entity =>
            {
                entity.HasIndex(e => new { e.EnrollmentId, e.LessonId }).IsUnique();
                entity.HasIndex(e => e.IsCompleted);

                entity.HasOne(e => e.Enrollment)
                      .WithMany(e => e.LessonProgresses)
                      .HasForeignKey(e => e.EnrollmentId)
                      .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(e => e.Lesson)
                      .WithMany(e => e.LessonProgresses)
                      .HasForeignKey(e => e.LessonId)
                      .OnDelete(DeleteBehavior.Restrict);
            });

            // ============ EXAM CONFIGURATION ============
            modelBuilder.Entity<Exam>(entity =>
            {
                entity.Property(e => e.Title).IsRequired().HasMaxLength(200);
                entity.HasIndex(e => e.CourseId);

                entity.HasOne(e => e.Course)
                      .WithMany()
                      .HasForeignKey(e => e.CourseId)
                      .OnDelete(DeleteBehavior.Cascade);
            });

            // ============ QUESTION CONFIGURATION ============
            modelBuilder.Entity<Question>(entity =>
            {
                entity.Property(e => e.Text).IsRequired();
                entity.HasIndex(e => e.ExamId);

                entity.HasOne(e => e.Exam)
                      .WithMany(e => e.Questions)
                      .HasForeignKey(e => e.ExamId)
                      .OnDelete(DeleteBehavior.Cascade);
            });

            // ============ ANSWER CONFIGURATION ============
            modelBuilder.Entity<Answer>(entity =>
            {
                entity.Property(e => e.Text).IsRequired();
                entity.HasIndex(e => e.QuestionId);

                entity.HasOne(e => e.Question)
                      .WithMany(e => e.Answers)
                      .HasForeignKey(e => e.QuestionId)
                      .OnDelete(DeleteBehavior.Cascade);
            });

            // ============ EXAM RESULT CONFIGURATION ============
            modelBuilder.Entity<ExamResult>(entity =>
            {
                entity.HasIndex(e => e.StudentId);
                entity.HasIndex(e => e.ExamId);
                entity.HasIndex(e => e.IsPassed);

                entity.HasOne(e => e.Student)
                      .WithMany()
                      .HasForeignKey(e => e.StudentId)
                      .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(e => e.Exam)
                      .WithMany(e => e.ExamResults)
                      .HasForeignKey(e => e.ExamId)
                      .OnDelete(DeleteBehavior.Restrict);
            });

            // ============ CERTIFICATE CONFIGURATION ============
            modelBuilder.Entity<Certificate>(entity =>
            {
                entity.Property(e => e.CertificateNumber).IsRequired().HasMaxLength(50);
                entity.HasIndex(e => e.CertificateNumber).IsUnique();
                entity.HasIndex(e => e.StudentId);
                entity.HasIndex(e => e.CourseId);
                entity.HasIndex(e => e.EnrollmentId);

                entity.HasOne(e => e.Student)
                      .WithMany()
                      .HasForeignKey(e => e.StudentId)
                      .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(e => e.Course)
                      .WithMany()
                      .HasForeignKey(e => e.CourseId)
                      .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(e => e.Enrollment)
                      .WithOne()
                      .HasForeignKey<Certificate>(e => e.EnrollmentId)
                      .OnDelete(DeleteBehavior.Restrict);
            });

            // ============ REVIEW CONFIGURATION ============
            modelBuilder.Entity<Review>(entity =>
            {
                entity.HasIndex(e => new { e.UserId, e.CourseId })
         .IsUnique()
         .HasFilter("[IsDeleted] = 0");  

                entity.HasIndex(e => e.CourseId);
                entity.HasIndex(e => e.IsApproved);

                entity.HasOne(e => e.User)
                      .WithMany(e => e.Reviews)
                      .HasForeignKey(e => e.UserId)
                      .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(e => e.Course)
                      .WithMany(e => e.Reviews)
                      .HasForeignKey(e => e.CourseId)
                      .OnDelete(DeleteBehavior.Cascade);
            });

            // ============ PAYMENT CONFIGURATION ============
            modelBuilder.Entity<Payment>(entity =>
            {
                entity.Property(e => e.Amount).HasPrecision(18, 2);
                entity.Property(e => e.CommissionAmount).HasPrecision(18, 2);
                entity.Property(e => e.InstructorAmount).HasPrecision(18, 2);
                entity.HasIndex(e => e.UserId);
                entity.HasIndex(e => e.CourseId);
                entity.HasIndex(e => e.TransactionId);
                entity.HasIndex(e => e.Status);

                entity.HasOne(e => e.User)
                      .WithMany(e => e.Payments)
                      .HasForeignKey(e => e.UserId)
                      .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(e => e.Course)
                      .WithMany(e => e.Payments)
                      .HasForeignKey(e => e.CourseId)
                      .OnDelete(DeleteBehavior.Restrict);
            });

            // ============ NOTIFICATION CONFIGURATION ============
            modelBuilder.Entity<Notification>(entity =>
            {
                entity.Property(e => e.Title).IsRequired().HasMaxLength(200);
                entity.Property(e => e.Message).IsRequired();
                entity.HasIndex(e => e.UserId);
                entity.HasIndex(e => e.IsRead);

                entity.HasOne(e => e.User)
                      .WithMany(e => e.Notifications)
                      .HasForeignKey(e => e.UserId)
                      .OnDelete(DeleteBehavior.Cascade);
            });

            // ============ PASSWORD RESET TOKEN CONFIGURATION ============
            modelBuilder.Entity<PasswordResetToken>(entity =>
            {
                entity.Property(e => e.Token).IsRequired();
                entity.HasIndex(e => e.Token).IsUnique();
                entity.HasIndex(e => e.UserId);
                entity.HasIndex(e => e.IsUsed);

                entity.HasOne(e => e.User)
                      .WithMany(e => e.PasswordResetTokens)
                      .HasForeignKey(e => e.UserId)
                      .OnDelete(DeleteBehavior.Cascade);
            });

            // ============ MAIL CONFIGURATION ============
            modelBuilder.Entity<MailConfiguration>(entity =>
            {
                entity.Property(e => e.SmtpServer).IsRequired().HasMaxLength(100);
                entity.Property(e => e.SenderEmail).IsRequired().HasMaxLength(100);
                entity.Property(e => e.SenderName).IsRequired().HasMaxLength(100);
                entity.Property(e => e.Username).IsRequired().HasMaxLength(100);
                entity.Property(e => e.Password).IsRequired();
            });

            // ============ ACTION LOG CONFIGURATION ============
            modelBuilder.Entity<ActionLog>(entity =>
            {
                entity.Property(e => e.Action).IsRequired().HasMaxLength(50);
                entity.Property(e => e.UserEmail).HasMaxLength(100);
                entity.HasIndex(e => e.CreatedDate);
                entity.HasIndex(e => e.UserId);
            });

            // ============ ERROR LOG CONFIGURATION ============
            modelBuilder.Entity<ErrorLog>(entity =>
            {
                entity.Property(e => e.ErrorMessage).IsRequired();
                entity.HasIndex(e => e.CreatedDate);
                entity.HasIndex(e => e.Severity);
            });

            // ============ EMAIL LOG CONFIGURATION ============
            modelBuilder.Entity<EmailLog>(entity =>
            {
                entity.Property(e => e.To).IsRequired().HasMaxLength(500);
                entity.Property(e => e.Subject).IsRequired().HasMaxLength(500);
                entity.HasIndex(e => e.CreatedDate);
                entity.HasIndex(e => e.Status);
            });

            // ============ GLOBAL QUERY FILTER - SOFT DELETE ============
            modelBuilder.Entity<User>().HasQueryFilter(e => !e.IsDeleted);
            modelBuilder.Entity<Instructor>().HasQueryFilter(e => !e.IsDeleted);    
            modelBuilder.Entity<Student>().HasQueryFilter(e => !e.IsDeleted);      
            modelBuilder.Entity<Category>().HasQueryFilter(e => !e.IsDeleted);
            modelBuilder.Entity<Course>().HasQueryFilter(e => !e.IsDeleted);
            modelBuilder.Entity<Lesson>().HasQueryFilter(e => !e.IsDeleted);
            modelBuilder.Entity<Enrollment>().HasQueryFilter(e => !e.IsDeleted);
            modelBuilder.Entity<LessonProgress>().HasQueryFilter(e => !e.IsDeleted);
            modelBuilder.Entity<Exam>().HasQueryFilter(e => !e.IsDeleted);
            modelBuilder.Entity<Question>().HasQueryFilter(e => !e.IsDeleted);
            modelBuilder.Entity<Answer>().HasQueryFilter(e => !e.IsDeleted);
            modelBuilder.Entity<ExamResult>().HasQueryFilter(e => !e.IsDeleted);
            modelBuilder.Entity<Review>().HasQueryFilter(e => !e.IsDeleted);
            modelBuilder.Entity<Payment>().HasQueryFilter(e => !e.IsDeleted);
            modelBuilder.Entity<Notification>().HasQueryFilter(e => !e.IsDeleted);
            modelBuilder.Entity<PasswordResetToken>().HasQueryFilter(e => !e.IsDeleted);
            modelBuilder.Entity<MailConfiguration>().HasQueryFilter(e => !e.IsDeleted);
            modelBuilder.Entity<ActionLog>().HasQueryFilter(e => !e.IsDeleted);
            modelBuilder.Entity<ErrorLog>().HasQueryFilter(e => !e.IsDeleted);
            modelBuilder.Entity<EmailLog>().HasQueryFilter(e => !e.IsDeleted);
        }
    }
}