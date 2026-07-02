using AcademyHub.Core.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AcademyHub.Core.Interfaces.Services
{
    public interface INotificationService
    {
        Task<Notification> GetNotificationByIdAsync(int id);
        Task<IEnumerable<Notification>> GetUserNotificationsAsync(int userId);
        Task<IEnumerable<Notification>> GetUnreadNotificationsAsync(int userId);
        Task<Notification> CreateNotificationAsync(int userId, string title, string message, string? type = null, string? link = null, string? icon = null);
        Task MarkAsReadAsync(int notificationId);
        Task MarkAllAsReadAsync(int userId);
        Task DeleteNotificationAsync(int notificationId);
        Task DeleteAllNotificationsAsync(int userId);
        Task<int> GetUnreadCountAsync(int userId);
        Task SendBulkNotificationAsync(IEnumerable<int> userIds, string title, string message, string? type = null);
    }
}
