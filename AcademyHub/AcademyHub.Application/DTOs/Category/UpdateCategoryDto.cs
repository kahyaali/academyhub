using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AcademyHub.Application.DTOs.Category
{
    public class UpdateCategoryDto
    {
        [Required(ErrorMessage = "Kategori adı gereklidir")]
        [MinLength(2, ErrorMessage = "Kategori adı en az 2 karakter olmalıdır")]
        [MaxLength(100, ErrorMessage = "Kategori adı en fazla 100 karakter olmalıdır")]
        public string Name { get; set; } = string.Empty;

        public string? Icon { get; set; }

        [MaxLength(500, ErrorMessage = "Açıklama en fazla 500 karakter olmalıdır")]
        public string? Description { get; set; }

        public int? ParentCategoryId { get; set; }

        public int DisplayOrder { get; set; }

        public bool IsActive { get; set; }
    }
}
