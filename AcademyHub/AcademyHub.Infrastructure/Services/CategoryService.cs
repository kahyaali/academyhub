using AcademyHub.Core.Entities;
using AcademyHub.Core.Exceptions;
using AcademyHub.Core.Interfaces;
using AcademyHub.Core.Interfaces.Services;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AcademyHub.Infrastructure.Services
{
    public class CategoryService:ICategoryService
    {
        private readonly IUnitOfWork _unitOfWork;

        public CategoryService(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }

        public async Task<Category> GetCategoryByIdAsync(int id)
        {
            var category = await _unitOfWork.GetRepository<Category>()
                .SingleOrDefaultAsync(c => c.Id == id && !c.IsDeleted);

            if (category == null)
                throw new NotFoundException($"ID {id} olan kategori bulunamadı");

            return category;
        }

        public async Task<IEnumerable<Category>> GetAllCategoriesAsync()
        {
            return await _unitOfWork.GetRepository<Category>()
                .FindAsync(c => !c.IsDeleted);
        }

        public async Task<IEnumerable<Category>> GetMainCategoriesAsync()
        {
            return await _unitOfWork.GetRepository<Category>()
                .FindAsync(c => c.ParentCategoryId == null && !c.IsDeleted);
        }

        public async Task<IEnumerable<Category>> GetSubCategoriesAsync(int parentCategoryId)
        {
            return await _unitOfWork.GetRepository<Category>()
                .FindAsync(c => c.ParentCategoryId == parentCategoryId && !c.IsDeleted);
        }

        public async Task<Category> CreateCategoryAsync(Category category)
        {
            // Kategori adı kontrolü
            if (await CategoryNameExistsAsync(category.Name))
                throw new BusinessRuleException("Bu isimde bir kategori zaten mevcut");

            // Parent kategori kontrolü
            if (category.ParentCategoryId.HasValue)
            {
                var parentExists = await CategoryExistsAsync(category.ParentCategoryId.Value);
                if (!parentExists)
                    throw new NotFoundException("Belirtilen üst kategori bulunamadı");
            }

            category.CreatedDate = DateTime.UtcNow;

            await _unitOfWork.GetRepository<Category>().AddAsync(category);
            await _unitOfWork.SaveChangesAsync();

            return category;
        }

        public async Task<Category> UpdateCategoryAsync(Category category)
        {
            var existingCategory = await GetCategoryByIdAsync(category.Id);

            // Kategori adı kontrolü (kendi hariç)
            var nameExists = await _unitOfWork.GetRepository<Category>()
                .AnyAsync(c => c.Name == category.Name && c.Id != category.Id && !c.IsDeleted);

            if (nameExists)
                throw new BusinessRuleException("Bu isimde bir kategori zaten mevcut");

            existingCategory.Name = category.Name;
            existingCategory.Icon = category.Icon;
            existingCategory.Description = category.Description;
            existingCategory.ParentCategoryId = category.ParentCategoryId;
            existingCategory.DisplayOrder = category.DisplayOrder;
            existingCategory.IsActive = category.IsActive;
            existingCategory.UpdatedDate = DateTime.UtcNow;

            _unitOfWork.GetRepository<Category>().Update(existingCategory);
            await _unitOfWork.SaveChangesAsync();

            return existingCategory;
        }

        public async Task DeleteCategoryAsync(int id)
        {
            var category = await GetCategoryByIdAsync(id);

            // Alt kategori var mı kontrol et
            var hasSubCategories = await _unitOfWork.GetRepository<Category>()
                .AnyAsync(c => c.ParentCategoryId == id && !c.IsDeleted);

            if (hasSubCategories)
                throw new BusinessRuleException("Bu kategoriye ait alt kategoriler var. Önce onları silin.");

            // Bu kategoriye ait kurs var mı kontrol et
            var hasCourses = await _unitOfWork.GetRepository<Course>()
                .AnyAsync(c => c.CategoryId == id && !c.IsDeleted);

            if (hasCourses)
                throw new BusinessRuleException("Bu kategoriye ait kurslar var. Önce onları taşıyın veya silin.");

            category.IsDeleted = true;
            category.UpdatedDate = DateTime.UtcNow;

            _unitOfWork.GetRepository<Category>().Update(category);
            await _unitOfWork.SaveChangesAsync();
        }

        public async Task<bool> CategoryExistsAsync(int id)
        {
            return await _unitOfWork.GetRepository<Category>()
                .AnyAsync(c => c.Id == id && !c.IsDeleted);
        }

        public async Task<bool> CategoryNameExistsAsync(string name)
        {
            return await _unitOfWork.GetRepository<Category>()
                .AnyAsync(c => c.Name == name && !c.IsDeleted);
        }

        public async Task<int> GetCategoryCountAsync()
        {
            return await _unitOfWork.GetRepository<Category>()
                .CountAsync(c => !c.IsDeleted);
        }
    }
}
