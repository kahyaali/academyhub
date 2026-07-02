using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AcademyHub.Application.DTOs.Category
{
    public class CategoryResponseDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Icon { get; set; }
        public string? Description { get; set; }
        public int? ParentCategoryId { get; set; }
        public string? ParentCategoryName { get; set; }
        public int DisplayOrder { get; set; }
        public bool IsActive { get; set; }
        public int SubCategoryCount { get; set; }
        public int CourseCount { get; set; }
        public DateTime CreatedDate { get; set; }
    }
}
