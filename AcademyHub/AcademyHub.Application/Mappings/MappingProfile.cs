using AcademyHub.Application.DTOs.Auth;
using AcademyHub.Application.DTOs.Category;
using AcademyHub.Application.DTOs.Course;
using AcademyHub.Application.DTOs.Enrollment;
using AcademyHub.Application.DTOs.Exam;
using AcademyHub.Application.DTOs.Instructor;
using AcademyHub.Application.DTOs.Lesson;
using AcademyHub.Application.DTOs.Student;
using AcademyHub.Application.DTOs.Certificate;
using AcademyHub.Application.DTOs.User;
using AcademyHub.Application.DTOs.MailConfiguration;
using AcademyHub.Core.Entities;
using AcademyHub.Application.DTOs.Review;
using AcademyHub.Core.Enums;
using AutoMapper;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;

namespace AcademyHub.Application.Mappings
{
    public class MappingProfile : Profile
    {
        public MappingProfile()
        {
            // ============ USER MAPPINGS ============
            CreateMap<User, LoginResponseDto>()
                .ForMember(dest => dest.Token, opt => opt.Ignore())
                .ForMember(dest => dest.RefreshToken, opt => opt.Ignore())
                .ForMember(dest => dest.TokenExpiryDate, opt => opt.Ignore())
                .ForMember(dest => dest.IsSystemAdmin,  
                    opt => opt.MapFrom(src => src.IsSystemAdmin));

            CreateMap<RegisterDto, User>()
                .ForMember(dest => dest.PasswordHash, opt => opt.Ignore())
                .ForMember(dest => dest.PasswordSalt, opt => opt.Ignore())
                .ForMember(dest => dest.Id, opt => opt.Ignore())
                .ForMember(dest => dest.CreatedDate, opt => opt.Ignore())
                .ForMember(dest => dest.UpdatedDate, opt => opt.Ignore())
                .ForMember(dest => dest.IsDeleted, opt => opt.Ignore())
                .ForMember(dest => dest.CreatedBy, opt => opt.Ignore())
                .ForMember(dest => dest.UpdatedBy, opt => opt.Ignore())
                .ForMember(dest => dest.IsSystemAdmin,  
                    opt => opt.MapFrom(src => false));

            // USER RESPONSE DTO MAPPING 
            CreateMap<User, UserResponseDto>()
                .ForMember(dest => dest.FullName,
                    opt => opt.MapFrom(src => $"{src.FirstName} {src.LastName}"))
                .ForMember(dest => dest.IsSystemAdmin,
                    opt => opt.MapFrom(src => src.IsSystemAdmin))
                .ForMember(dest => dest.Address,
                    opt => opt.MapFrom(src => src.Address))
                .ForMember(dest => dest.UpdatedDate,
                    opt => opt.MapFrom(src => src.UpdatedDate));


            // ============ CATEGORY MAPPINGS ============
            CreateMap<Category, CategoryResponseDto>()
                .ForMember(dest => dest.SubCategoryCount,
                    opt => opt.MapFrom(src => src.SubCategories.Count(c => !c.IsDeleted)))
                .ForMember(dest => dest.CourseCount,
                    opt => opt.MapFrom(src => src.Courses.Count(c => c.IsPublished && !c.IsDeleted)));

            CreateMap<CreateCategoryDto, Category>();
            CreateMap<UpdateCategoryDto, Category>();

            // ============ COURSE MAPPINGS ============
            CreateMap<Course, CourseResponseDto>()
                .ForMember(dest => dest.InstructorName,
                    opt => opt.MapFrom(src =>
                        src.Instructor != null
                            ? $"{src.Instructor.FirstName} {src.Instructor.LastName}"
                            : "Eğitmen Yok"))
                .ForMember(dest => dest.CategoryName,
                    opt => opt.MapFrom(src => src.Category != null ? src.Category.Name : null))
                .ForMember(dest => dest.TotalStudents,
                    opt => opt.MapFrom(src => src.Enrollments != null
                        ? src.Enrollments.Count(e =>
                            (e.Status == EnrollmentStatus.Active || e.Status == EnrollmentStatus.Completed) &&
                            !e.IsDeleted)
                        : 0))
                .ForMember(dest => dest.TotalEnrollments,
                    opt => opt.MapFrom(src => src.Enrollments != null
                        ? src.Enrollments.Count(e =>
                            (e.Status == EnrollmentStatus.Active || e.Status == EnrollmentStatus.Completed) &&
                            !e.IsDeleted)
                        : 0))
                .ForMember(dest => dest.LessonCount,
                    opt => opt.MapFrom(src => src.Lessons != null
                        ? src.Lessons.Count(l => !l.IsDeleted)
                        : 0))
                .ForMember(dest => dest.AverageRating,
                    opt => opt.MapFrom(src => src.Reviews != null && src.Reviews.Any(r => r.IsApproved && !r.IsDeleted)
                        ? src.Reviews.Where(r => r.IsApproved && !r.IsDeleted).Average(r => (double?)r.Rating) ?? 0
                        : 0))
                .ForMember(dest => dest.TotalReviews,
                    opt => opt.MapFrom(src => src.Reviews != null
                        ? src.Reviews.Count(r => r.IsApproved && !r.IsDeleted)
                        : 0))
               
                .ForMember(dest => dest.Currency,
                    opt => opt.MapFrom(src => src.Currency))
          
                .ForMember(dest => dest.CurrencySymbol,
                    opt => opt.MapFrom(src => GetCurrencySymbol(src.Currency)))
                .ForMember(dest => dest.FormattedPrice,
                    opt => opt.MapFrom(src => FormatPrice(src.Price, src.Currency)))
                .ForMember(dest => dest.CurrencyCode,
                    opt => opt.MapFrom(src => src.Currency.ToString()));

       
            CreateMap<CreateCourseDto, Course>()
     .ForMember(dest => dest.Id, opt => opt.Ignore())
     .ForMember(dest => dest.CreatedDate, opt => opt.Ignore())
     .ForMember(dest => dest.UpdatedDate, opt => opt.Ignore())
     .ForMember(dest => dest.IsDeleted, opt => opt.Ignore())
     .ForMember(dest => dest.CreatedBy, opt => opt.Ignore())
     .ForMember(dest => dest.UpdatedBy, opt => opt.Ignore())
     .ForMember(dest => dest.InstructorId, opt => opt.Ignore())
     .ForMember(dest => dest.AverageRating, opt => opt.Ignore())
     .ForMember(dest => dest.TotalEnrollments, opt => opt.Ignore())
     .ForMember(dest => dest.TotalReviews, opt => opt.Ignore())
     .ForMember(dest => dest.TotalStudents, opt => opt.Ignore())
     .ForMember(dest => dest.TotalLessons, opt => opt.Ignore())
     .ForMember(dest => dest.TotalDurationInMinutes, opt => opt.Ignore())
    
     .ForMember(dest => dest.IsPublished, opt => opt.MapFrom(src => src.IsPublished))
     .ForMember(dest => dest.PublishedDate, opt => opt.Ignore())  
                                                                  
     .ForMember(dest => dest.Currency, opt => opt.MapFrom(src => src.Currency))
     // IsFree kontrolü
     .ForMember(dest => dest.IsFree, opt => opt.MapFrom(src => src.Price <= 0 || src.IsFree));


            CreateMap<UpdateCourseDto, Course>()
                .ForMember(dest => dest.Id, opt => opt.Ignore())
                .ForMember(dest => dest.CreatedDate, opt => opt.Ignore())
                .ForMember(dest => dest.CreatedBy, opt => opt.Ignore())
                .ForMember(dest => dest.AverageRating, opt => opt.Ignore())
                .ForMember(dest => dest.TotalEnrollments, opt => opt.Ignore())
                .ForMember(dest => dest.TotalReviews, opt => opt.Ignore())
                .ForMember(dest => dest.TotalStudents, opt => opt.Ignore())
                .ForMember(dest => dest.TotalLessons, opt => opt.Ignore())
                .ForMember(dest => dest.TotalDurationInMinutes, opt => opt.Ignore())
            
                .ForMember(dest => dest.Currency, opt => opt.MapFrom(src => src.Currency))
            
                .ForMember(dest => dest.IsFree, opt => opt.MapFrom(src => src.Price <= 0 || src.IsFree))
           
                .ForMember(dest => dest.IsPublished, opt => opt.MapFrom(src => src.IsPublished));

            // ============ LESSON MAPPINGS ============
            CreateMap<Lesson, LessonResponseDto>()
                .ForMember(dest => dest.CourseTitle,
                    opt => opt.MapFrom(src => src.Course.Title));

            CreateMap<CreateLessonDto, Lesson>()
                .ForMember(dest => dest.Id, opt => opt.Ignore())
                .ForMember(dest => dest.CreatedDate, opt => opt.Ignore())
                .ForMember(dest => dest.UpdatedDate, opt => opt.Ignore())
                .ForMember(dest => dest.IsDeleted, opt => opt.Ignore())
                .ForMember(dest => dest.CreatedBy, opt => opt.Ignore())
                .ForMember(dest => dest.UpdatedBy, opt => opt.Ignore());

            CreateMap<UpdateLessonDto, Lesson>()
                .ForMember(dest => dest.Id, opt => opt.Ignore())
                .ForMember(dest => dest.CreatedDate, opt => opt.Ignore())
                .ForMember(dest => dest.CreatedBy, opt => opt.Ignore());

            // ============ ENROLLMENT MAPPINGS ============
            CreateMap<Enrollment, EnrollmentResponseDto>()
      .ForMember(dest => dest.StudentName,
          opt => opt.MapFrom(src =>
              src.Student != null ? $"{src.Student.FirstName} {src.Student.LastName}" : "Bilinmiyor"))
      .ForMember(dest => dest.StudentEmail,
          opt => opt.MapFrom(src =>
              src.Student != null && src.Student.User != null ? src.Student.User.Email : ""))
      .ForMember(dest => dest.CourseTitle,
          opt => opt.MapFrom(src => src.Course != null ? src.Course.Title : "Kurs Yok"))
      .ForMember(dest => dest.CourseImage,
          opt => opt.MapFrom(src => src.Course != null ? src.Course.CoverImage : null))
      .ForMember(dest => dest.ProgressPercentage,
          opt => opt.MapFrom(src => src.ProgressPercentage))
      .ForMember(dest => dest.Status,
          opt => opt.MapFrom(src => src.Status.ToString()))
      .ForMember(dest => dest.EnrollmentDate,
          opt => opt.MapFrom(src => src.EnrollmentDate))
      .ForMember(dest => dest.CompletionDate,
          opt => opt.MapFrom(src => src.CompletionDate))
      .ForMember(dest => dest.HasCertificate,
          opt => opt.MapFrom(src => !string.IsNullOrEmpty(src.CertificateUrl)))
      .ForMember(dest => dest.CertificateUrl,
          opt => opt.MapFrom(src => src.CertificateUrl))
     
      .ForMember(dest => dest.InstructorId,
          opt => opt.MapFrom(src => src.Course != null ? src.Course.InstructorId : 0))
      .ForMember(dest => dest.InstructorName,
          opt => opt.MapFrom(src =>
              src.Course != null && src.Course.Instructor != null
                  ? $"{src.Course.Instructor.FirstName} {src.Course.Instructor.LastName}"
                  : "Eğitmen Yok"))
      .ForMember(dest => dest.InstructorImage,
          opt => opt.MapFrom(src =>
              src.Course != null && src.Course.Instructor != null
                  ? src.Course.Instructor.ProfileImage
                  : null))
      //  Fiyat bilgileri
      .ForMember(dest => dest.Price,
          opt => opt.MapFrom(src => src.Course != null ? src.Course.Price : 0))
      .ForMember(dest => dest.Currency,
          opt => opt.MapFrom(src => src.Course != null ? src.Course.Currency.ToString() : "TL"))
      .ForMember(dest => dest.FormattedPrice,
          opt => opt.MapFrom(src => src.Course != null ? FormatPrice(src.Course.Price, src.Course.Currency) : "0 ₺"));

            CreateMap<CreateEnrollmentDto, Enrollment>()
                .ForMember(dest => dest.Id, opt => opt.Ignore())
                .ForMember(dest => dest.CreatedDate, opt => opt.Ignore())
                .ForMember(dest => dest.UpdatedDate, opt => opt.Ignore())
                .ForMember(dest => dest.IsDeleted, opt => opt.Ignore())
                .ForMember(dest => dest.CreatedBy, opt => opt.Ignore())
                .ForMember(dest => dest.UpdatedBy, opt => opt.Ignore())
                .ForMember(dest => dest.EnrollmentDate, opt => opt.Ignore())
                .ForMember(dest => dest.Status, opt => opt.Ignore())
                .ForMember(dest => dest.CompletionDate, opt => opt.Ignore())
                .ForMember(dest => dest.ProgressPercentage, opt => opt.Ignore())
                .ForMember(dest => dest.CertificateUrl, opt => opt.Ignore())
                .ForMember(dest => dest.CertificateNumber, opt => opt.Ignore())
                .ForMember(dest => dest.CertificateIssuedDate, opt => opt.Ignore())
                .ForMember(dest => dest.LastActivityDate, opt => opt.Ignore());

            // ============ EXAM MAPPINGS ============
            CreateMap<Exam, ExamResponseDto>()
                .ForMember(dest => dest.CourseTitle,
                    opt => opt.MapFrom(src => src.Course.Title))
                .ForMember(dest => dest.QuestionCount,
                    opt => opt.MapFrom(src => src.Questions.Count(q => !q.IsDeleted)))
                .ForMember(dest => dest.TotalPoints,
                    opt => opt.MapFrom(src => src.Questions.Where(q => !q.IsDeleted).Sum(q => q.Points)))
                .ForMember(dest => dest.Questions,
                    opt => opt.Ignore());

            CreateMap<CreateExamDto, Exam>()
                .ForMember(dest => dest.Id, opt => opt.Ignore())
                .ForMember(dest => dest.CreatedDate, opt => opt.Ignore())
                .ForMember(dest => dest.UpdatedDate, opt => opt.Ignore())
                .ForMember(dest => dest.IsDeleted, opt => opt.Ignore())
                .ForMember(dest => dest.CreatedBy, opt => opt.Ignore())
                .ForMember(dest => dest.UpdatedBy, opt => opt.Ignore())
                .ForMember(dest => dest.IsPublished, opt => opt.Ignore())
                .ForMember(dest => dest.Questions, opt => opt.Ignore());

            CreateMap<UpdateExamDto, Exam>()
                .ForMember(dest => dest.Id, opt => opt.Ignore())
                .ForMember(dest => dest.CreatedDate, opt => opt.Ignore())
                .ForMember(dest => dest.CreatedBy, opt => opt.Ignore())
                .ForMember(dest => dest.IsPublished, opt => opt.Ignore())
                .ForMember(dest => dest.Questions, opt => opt.Ignore());

            // ============ QUESTION MAPPINGS ============
            CreateMap<Question, QuestionResponseDto>()
                .ForMember(dest => dest.Answers,
                    opt => opt.MapFrom(src => src.Answers.Where(a => !a.IsDeleted)));

            CreateMap<CreateQuestionDto, Question>()
                .ForMember(dest => dest.Id, opt => opt.Ignore())
                .ForMember(dest => dest.CreatedDate, opt => opt.Ignore())
                .ForMember(dest => dest.UpdatedDate, opt => opt.Ignore())
                .ForMember(dest => dest.IsDeleted, opt => opt.Ignore())
                .ForMember(dest => dest.CreatedBy, opt => opt.Ignore())
                .ForMember(dest => dest.UpdatedBy, opt => opt.Ignore())
                .ForMember(dest => dest.Answers, opt => opt.Ignore());

            CreateMap<UpdateQuestionDto, Question>()
                .ForMember(dest => dest.Id, opt => opt.Ignore())
                .ForMember(dest => dest.CreatedDate, opt => opt.Ignore())
                .ForMember(dest => dest.CreatedBy, opt => opt.Ignore());

            // ============ ANSWER MAPPINGS ============
            CreateMap<Answer, AnswerResponseDto>();
            CreateMap<CreateAnswerDto, Answer>()
                .ForMember(dest => dest.Id, opt => opt.Ignore())
                .ForMember(dest => dest.CreatedDate, opt => opt.Ignore())
                .ForMember(dest => dest.UpdatedDate, opt => opt.Ignore())
                .ForMember(dest => dest.IsDeleted, opt => opt.Ignore())
                .ForMember(dest => dest.CreatedBy, opt => opt.Ignore())
                .ForMember(dest => dest.UpdatedBy, opt => opt.Ignore());

            CreateMap<UpdateAnswerDto, Answer>()
                .ForMember(dest => dest.Id, opt => opt.Ignore())
                .ForMember(dest => dest.CreatedDate, opt => opt.Ignore())
                .ForMember(dest => dest.CreatedBy, opt => opt.Ignore());

            // ============ CERTIFICATE MAPPINGS ============
            CreateMap<Certificate, CertificateResponseDto>()
                .ForMember(dest => dest.StudentName,
                    opt => opt.MapFrom(src =>
                        src.Student != null ? $"{src.Student.FirstName} {src.Student.LastName}" : "Bilinmiyor"))
                .ForMember(dest => dest.StudentEmail,
                    opt => opt.MapFrom(src =>
                        src.Student != null && src.Student.User != null ? src.Student.User.Email : ""))
                .ForMember(dest => dest.CourseTitle,
                    opt => opt.MapFrom(src => src.Course != null ? src.Course.Title : ""));

            // ============ EXAM RESULT MAPPINGS ============
            CreateMap<ExamResult, ExamResultResponseDto>()
                .ForMember(dest => dest.StudentName,
                    opt => opt.MapFrom(src => $"{src.Student.FirstName} {src.Student.LastName}"))
                .ForMember(dest => dest.StudentEmail,
                    opt => opt.MapFrom(src => src.Student.Email))
                .ForMember(dest => dest.ExamTitle,
                    opt => opt.MapFrom(src => src.Exam.Title))
                .ForMember(dest => dest.StudentAnswers,
                    opt => opt.MapFrom(src => DeserializeStudentAnswers(src.StudentAnswers)));

            // ============ INSTRUCTOR MAPPINGS ============
            CreateMap<Instructor, InstructorResponseDto>()
                .ForMember(dest => dest.Email,
                    opt => opt.MapFrom(src => src.User.Email))
                .ForMember(dest => dest.PhoneNumber,
                    opt => opt.MapFrom(src => src.User.PhoneNumber))
                .ForMember(dest => dest.Address,
                    opt => opt.MapFrom(src => src.User.Address))
                .ForMember(dest => dest.FullName,
                    opt => opt.MapFrom(src => $"{src.FirstName} {src.LastName}"))
                .ForMember(dest => dest.CreatedDate,
                    opt => opt.MapFrom(src => src.CreatedDate));

            CreateMap<CreateInstructorDto, Instructor>()
                .ForMember(dest => dest.Id, opt => opt.Ignore())
                .ForMember(dest => dest.CreatedDate, opt => opt.Ignore())
                .ForMember(dest => dest.UpdatedDate, opt => opt.Ignore())
                .ForMember(dest => dest.IsDeleted, opt => opt.Ignore())
                .ForMember(dest => dest.CreatedBy, opt => opt.Ignore())
                .ForMember(dest => dest.UpdatedBy, opt => opt.Ignore())
                .ForMember(dest => dest.UserId, opt => opt.Ignore())
                .ForMember(dest => dest.TotalEarnings, opt => opt.Ignore())
                .ForMember(dest => dest.TotalStudents, opt => opt.Ignore())
                .ForMember(dest => dest.TotalCourses, opt => opt.Ignore())
                .ForMember(dest => dest.AverageRating, opt => opt.Ignore());

            CreateMap<UpdateInstructorDto, Instructor>()
                .ForMember(dest => dest.Id, opt => opt.Ignore())
                .ForMember(dest => dest.CreatedDate, opt => opt.Ignore())
                .ForMember(dest => dest.CreatedBy, opt => opt.Ignore())
                .ForMember(dest => dest.UserId, opt => opt.Ignore())
                .ForMember(dest => dest.TotalEarnings, opt => opt.Ignore())
                .ForMember(dest => dest.TotalStudents, opt => opt.Ignore())
                .ForMember(dest => dest.TotalCourses, opt => opt.Ignore())
                .ForMember(dest => dest.AverageRating, opt => opt.Ignore());

            // ============ STUDENT MAPPINGS ============
            CreateMap<Student, StudentResponseDto>()
                .ForMember(dest => dest.Email,
                    opt => opt.MapFrom(src => src.User.Email))
                .ForMember(dest => dest.FullName,
                    opt => opt.MapFrom(src => $"{src.FirstName} {src.LastName}"))
                .ForMember(dest => dest.CreatedDate,
                    opt => opt.MapFrom(src => src.CreatedDate));

            CreateMap<CreateStudentDto, Student>()
                .ForMember(dest => dest.Id, opt => opt.Ignore())
                .ForMember(dest => dest.CreatedDate, opt => opt.Ignore())
                .ForMember(dest => dest.UpdatedDate, opt => opt.Ignore())
                .ForMember(dest => dest.IsDeleted, opt => opt.Ignore())
                .ForMember(dest => dest.CreatedBy, opt => opt.Ignore())
                .ForMember(dest => dest.UpdatedBy, opt => opt.Ignore())
                .ForMember(dest => dest.UserId, opt => opt.Ignore())
                .ForMember(dest => dest.TotalEnrollments, opt => opt.Ignore())
                .ForMember(dest => dest.CompletedCourses, opt => opt.Ignore())
                .ForMember(dest => dest.AverageProgress, opt => opt.Ignore());

            CreateMap<UpdateStudentDto, Student>()
                .ForMember(dest => dest.Id, opt => opt.Ignore())
                .ForMember(dest => dest.CreatedDate, opt => opt.Ignore())
                .ForMember(dest => dest.CreatedBy, opt => opt.Ignore())
                .ForMember(dest => dest.UserId, opt => opt.Ignore())
                .ForMember(dest => dest.TotalEnrollments, opt => opt.Ignore())
                .ForMember(dest => dest.CompletedCourses, opt => opt.Ignore())
                .ForMember(dest => dest.AverageProgress, opt => opt.Ignore());


            // ============  MAIL CONFIGURATION MAPPINGS  ============
            CreateMap<MailConfiguration, MailConfigurationDto>()
                .ForMember(dest => dest.Password, opt => opt.Ignore())  // Şifreyi dışarı verme
                .ForMember(dest => dest.LastTestDate, opt => opt.MapFrom(src => src.LastTestDate))
                .ForMember(dest => dest.LastTestSuccess, opt => opt.MapFrom(src => src.LastTestSuccess))
                .ForMember(dest => dest.LastTestError, opt => opt.MapFrom(src => src.LastTestError));

            CreateMap<MailConfigurationDto, MailConfiguration>()
                .ForMember(dest => dest.Password, opt => opt.MapFrom(src => src.Password))
                .ForMember(dest => dest.LastTestDate, opt => opt.Ignore())
                .ForMember(dest => dest.LastTestSuccess, opt => opt.Ignore())
                .ForMember(dest => dest.LastTestError, opt => opt.Ignore())
                .ForMember(dest => dest.CreatedDate, opt => opt.Ignore())
                .ForMember(dest => dest.UpdatedDate, opt => opt.Ignore())
                .ForMember(dest => dest.IsDeleted, opt => opt.Ignore());



            // ============ REVIEW MAPPINGS ============
            CreateMap<Review, ReviewResponseDto>()
                .ForMember(dest => dest.UserName,
                    opt => opt.MapFrom(src =>
                        src.User != null ? $"{src.User.FirstName} {src.User.LastName}" : "Bilinmiyor"))
                .ForMember(dest => dest.CourseTitle,
                    opt => opt.MapFrom(src =>
                        src.Course != null ? src.Course.Title : ""));

            CreateMap<CreateReviewDto, Review>()
                .ForMember(dest => dest.Id, opt => opt.Ignore())
                .ForMember(dest => dest.CreatedDate, opt => opt.Ignore())
                .ForMember(dest => dest.UpdatedDate, opt => opt.Ignore())
                .ForMember(dest => dest.IsDeleted, opt => opt.Ignore())
                .ForMember(dest => dest.IsApproved, opt => opt.Ignore())
                .ForMember(dest => dest.ApprovedDate, opt => opt.Ignore())
                .ForMember(dest => dest.ApprovedBy, opt => opt.Ignore())
                .ForMember(dest => dest.User, opt => opt.Ignore())
                .ForMember(dest => dest.Course, opt => opt.Ignore());

            CreateMap<UpdateReviewDto, Review>()
                .ForMember(dest => dest.Id, opt => opt.Ignore())
                .ForMember(dest => dest.CreatedDate, opt => opt.Ignore())
                .ForMember(dest => dest.UpdatedDate, opt => opt.Ignore())
                .ForMember(dest => dest.IsDeleted, opt => opt.Ignore())
                .ForMember(dest => dest.IsApproved, opt => opt.Ignore())
                .ForMember(dest => dest.ApprovedDate, opt => opt.Ignore())
                .ForMember(dest => dest.ApprovedBy, opt => opt.Ignore())
                .ForMember(dest => dest.User, opt => opt.Ignore())
                .ForMember(dest => dest.Course, opt => opt.Ignore());
        }

        // ============ YARDIMCI METODLAR ============
        private static string GetCurrencySymbol(Currency currency)
        {
            return currency switch
            {
                Currency.TL => "₺",
                Currency.USD => "$",
                Currency.EUR => "€",
                Currency.GBP => "£",
                _ => "₺"
            };
        }

        private static string FormatPrice(decimal price, Currency currency)
        {
            var symbol = GetCurrencySymbol(currency);
            return $"{symbol}{price:F2}";
        }

        // ============ ÖZEL METOD ============
        private static Dictionary<int, int>? DeserializeStudentAnswers(string? studentAnswers)
        {
            if (string.IsNullOrEmpty(studentAnswers))
                return null;

            try
            {
                return JsonSerializer.Deserialize<Dictionary<int, int>>(studentAnswers);
            }
            catch
            {
                return null;
            }
        }
    }
}