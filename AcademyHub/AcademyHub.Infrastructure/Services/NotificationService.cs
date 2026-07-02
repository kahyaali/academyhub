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
    public class NotificationService: INotificationService
    {
        private readonly IUnitOfWork _unitOfWork;

        public NotificationService(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }

        public async Task<Notification> GetNotificationByIdAsync(int id)
        {
            var notification = await _unitOfWork.GetRepository<Notification>()
                .SingleOrDefaultAsync(n => n.Id == id && !n.IsDeleted);

            if (notification == null)
                throw new NotFoundException($"ID {id} olan bildirim bulunamadı");

            return notification;
        }

        public async Task<IEnumerable<Notification>> GetUserNotificationsAsync(int userId)
        {
            return await _unitOfWork.GetRepository<Notification>()
                .FindAsync(n => n.UserId == userId && !n.IsDeleted);
        }

        public async Task<IEnumerable<Notification>> GetUnreadNotificationsAsync(int userId)
        {
            return await _unitOfWork.GetRepository<Notification>()
                .FindAsync(n => n.UserId == userId && !n.IsRead && !n.IsDeleted);
        }

        public async Task<Notification> CreateNotificationAsync(int userId, string title, string message, string? type = null, string? link = null, string? icon = null)
        {
            var user = await _unitOfWork.GetRepository<User>()
                .GetByIdAsync(userId);

            if (user == null || user.IsDeleted)
                throw new NotFoundException("Geçerli bir kullanıcı bulunamadı");

            var notification = new Notification
            {
                UserId = userId,
                Title = title,
                Message = message,
                Type = type ?? "System",
                Link = link,
                Icon = icon ?? "📢",
                IsRead = false,
                CreatedDate = DateTime.UtcNow
            };

            await _unitOfWork.GetRepository<Notification>().AddAsync(notification);
            await _unitOfWork.SaveChangesAsync();

            return notification;
        }

        public async Task MarkAsReadAsync(int notificationId)
        {
            var notification = await GetNotificationByIdAsync(notificationId);

            notification.IsRead = true;
            notification.ReadDate = DateTime.UtcNow;
            notification.UpdatedDate = DateTime.UtcNow;

            _unitOfWork.GetRepository<Notification>().Update(notification);
            await _unitOfWork.SaveChangesAsync();
        }

        public async Task MarkAllAsReadAsync(int userId)
        {
            var notifications = await _unitOfWork.GetRepository<Notification>()
                .FindAsync(n => n.UserId == userId && !n.IsRead && !n.IsDeleted);

            foreach (var notification in notifications)
            {
                notification.IsRead = true;
                notification.ReadDate = DateTime.UtcNow;
                notification.UpdatedDate = DateTime.UtcNow;
                _unitOfWork.GetRepository<Notification>().Update(notification);
            }

            await _unitOfWork.SaveChangesAsync();
        }

        public async Task DeleteNotificationAsync(int notificationId)
        {
            var notification = await GetNotificationByIdAsync(notificationId);

            notification.IsDeleted = true;
            notification.UpdatedDate = DateTime.UtcNow;

            _unitOfWork.GetRepository<Notification>().Update(notification);
            await _unitOfWork.SaveChangesAsync();
        }

        public async Task DeleteAllNotificationsAsync(int userId)
        {
            var notifications = await _unitOfWork.GetRepository<Notification>()
                .FindAsync(n => n.UserId == userId && !n.IsDeleted);

            foreach (var notification in notifications)
            {
                notification.IsDeleted = true;
                notification.UpdatedDate = DateTime.UtcNow;
                _unitOfWork.GetRepository<Notification>().Update(notification);
            }

            await _unitOfWork.SaveChangesAsync();
        }

        public async Task<int> GetUnreadCountAsync(int userId)
        {
            return await _unitOfWork.GetRepository<Notification>()
                .CountAsync(n => n.UserId == userId && !n.IsRead && !n.IsDeleted);
        }

        public async Task SendBulkNotificationAsync(IEnumerable<int> userIds, string title, string message, string? type = null)
        {
            var notifications = userIds.Select(userId => new Notification
            {
                UserId = userId,
                Title = title,
                Message = message,
                Type = type ?? "System",
                IsRead = false,
                CreatedDate = DateTime.UtcNow,
                Icon = "📢"
            }).ToList();

            await _unitOfWork.GetRepository<Notification>().AddRangeAsync(notifications);
            await _unitOfWork.SaveChangesAsync();
        }
    }
}
