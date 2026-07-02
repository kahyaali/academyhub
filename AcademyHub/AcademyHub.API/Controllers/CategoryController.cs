using AcademyHub.Application.DTOs.Category;
using AcademyHub.Core.Entities;
using AcademyHub.Core.Exceptions;
using AcademyHub.Core.Interfaces.Services;
using AutoMapper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using AcademyHub.Application.DTOs.Common;

namespace AcademyHub.API.Controllers
{
    [Route("api/v1/[controller]")]
    [ApiController]
    [Authorize]
    public class CategoryController : ControllerBase
    {
        private readonly ICategoryService _categoryService;
        private readonly IMapper _mapper;
        private readonly ILogger<CategoryController> _logger;

        public CategoryController(ICategoryService categoryService,IMapper mapper,ILogger<CategoryController> logger)
        {
            _categoryService = categoryService;
            _mapper = mapper;
            _logger = logger;
        }

        // ============ GET: api/v1/category ============
        [HttpGet]
        [AllowAnonymous]
        public async Task<ActionResult<PagedResponse<CategoryResponseDto>>> GetCategories(
            [FromQuery] int pageNumber = 1,
            [FromQuery] int pageSize = 10,
            [FromQuery] bool onlyMain = false)
        {
            try
            {
                IEnumerable<Category> categories;

                if (onlyMain)
                    categories = await _categoryService.GetMainCategoriesAsync();
                else
                    categories = await _categoryService.GetAllCategoriesAsync();

                var totalCount = categories.Count();
                var pagedItems = categories
                    .Skip((pageNumber - 1) * pageSize)
                    .Take(pageSize)
                    .ToList();

                var response = _mapper.Map<IEnumerable<CategoryResponseDto>>(pagedItems);

                var result = new PagedResponse<CategoryResponseDto>
                {
                    Items = response,
                    TotalCount = totalCount,
                    PageNumber = pageNumber,
                    PageSize = pageSize
                };

                return Ok(new { success = true, data = result });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Kategoriler listelenirken hata oluştu");
                return StatusCode(500, new { success = false, message = "Kategoriler listelenirken bir hata oluştu" });
            }
        }

        // ============ GET: api/v1/category/{id} ============
        [HttpGet("{id}")]
        [AllowAnonymous]
        public async Task<ActionResult<CategoryResponseDto>> GetCategory(int id)
        {
            try
            {
                var category = await _categoryService.GetCategoryByIdAsync(id);
                var response = _mapper.Map<CategoryResponseDto>(category);

                return Ok(new { success = true, data = response });
            }
            catch (NotFoundException ex)
            {
                return NotFound(new { success = false, message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Kategori detayı alınırken hata oluştu - ID: {id}");
                return StatusCode(500, new { success = false, message = "Kategori detayı alınırken bir hata oluştu" });
            }
        }

        // ============ GET: api/v1/category/{id}/subcategories ============
        [HttpGet("{id}/subcategories")]
        [AllowAnonymous]
        public async Task<ActionResult<IEnumerable<CategoryResponseDto>>> GetSubCategories(int id)
        {
            try
            {
                var categories = await _categoryService.GetSubCategoriesAsync(id);
                var response = _mapper.Map<IEnumerable<CategoryResponseDto>>(categories);

                return Ok(new { success = true, data = response });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Alt kategoriler listelenirken hata oluştu - ParentId: {id}");
                return StatusCode(500, new { success = false, message = "Alt kategoriler listelenirken bir hata oluştu" });
            }
        }

        // ============ POST: api/v1/category ============
        [HttpPost]
        [Authorize(Roles = "Admin,Instructor")]
        public async Task<ActionResult<CategoryResponseDto>> CreateCategory([FromBody] CreateCategoryDto request)
        {
            try
            {
                var category = _mapper.Map<Category>(request);
                var createdCategory = await _categoryService.CreateCategoryAsync(category);
                var response = _mapper.Map<CategoryResponseDto>(createdCategory);

                _logger.LogInformation($"Yeni kategori oluşturuldu - ID: {createdCategory.Id}, İsim: {createdCategory.Name}");
                return CreatedAtAction(nameof(GetCategory), new { id = createdCategory.Id }, new { success = true, data = response });
            }
            catch (BusinessRuleException ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
            catch (NotFoundException ex)
            {
                return NotFound(new { success = false, message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Kategori oluşturulurken hata oluştu");
                return StatusCode(500, new { success = false, message = "Kategori oluşturulurken bir hata oluştu" });
            }
        }

        // ============ PUT: api/v1/category/{id} ============
        [HttpPut("{id}")]
        [Authorize(Roles = "Admin,Instructor")]
        public async Task<ActionResult<CategoryResponseDto>> UpdateCategory(int id, [FromBody] UpdateCategoryDto request)
        {
            try
            {
                var category = _mapper.Map<Category>(request);
                category.Id = id;

                var updatedCategory = await _categoryService.UpdateCategoryAsync(category);
                var response = _mapper.Map<CategoryResponseDto>(updatedCategory);

                _logger.LogInformation($"Kategori güncellendi - ID: {id}, İsim: {updatedCategory.Name}");
                return Ok(new { success = true, data = response });
            }
            catch (NotFoundException ex)
            {
                return NotFound(new { success = false, message = ex.Message });
            }
            catch (BusinessRuleException ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Kategori güncellenirken hata oluştu - ID: {id}");
                return StatusCode(500, new { success = false, message = "Kategori güncellenirken bir hata oluştu" });
            }
        }

        // ============ DELETE: api/v1/category/{id} ============
        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin,Instructor")]
        public async Task<IActionResult> DeleteCategory(int id)
        {
            try
            {
                await _categoryService.DeleteCategoryAsync(id);

                _logger.LogInformation($"Kategori silindi - ID: {id}");
                return Ok(new { success = true, message = "Kategori başarıyla silindi" });
            }
            catch (NotFoundException ex)
            {
                return NotFound(new { success = false, message = ex.Message });
            }
            catch (BusinessRuleException ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Kategori silinirken hata oluştu - ID: {id}");
                return StatusCode(500, new { success = false, message = "Kategori silinirken bir hata oluştu" });
            }
        }
    }
}
