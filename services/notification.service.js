import db from '../ultis/db.js';

export default {
    async findAll() {
        try {
            return await db('Notification')
                .join('User', 'Notification.userId', '=', 'User.userId')
                .select(
                    'Notification.*',
                    'User.fullName'
                )
                .orderBy('Notification.createdDate', 'desc');
        } catch (error) {
            console.error('Error fetching notifications:', error);
            throw new Error('Unable to load notifications');
        }
    },

    async findById(notificationId) {
        try {
            const notification = await db('Notification')
                .join('User', 'Notification.userId', '=', 'User.userId')
                .select(
                    'Notification.*',
                    'User.fullName'
                )
                .where('Notification.notificationId', notificationId)
                .first();
            return notification || null;
        } catch (error) {
            console.error(`Error fetching notification with ID ${notificationId}:`, error);
            throw new Error('Unable to find notification');
        }
    },

    async findByUser(userId) {
        try {
            return await db('Notification')
                .where('userId', userId)
                .orderBy('createdDate', 'desc');
        } catch (error) {
            console.error(`Error fetching notifications for user ID ${userId}:`, error);
            throw new Error('Unable to find notifications by user');
        }
    },

    async findUnreadByUser(userId) {
        try {
            return await db('Notification')
                .where({
                    userId: userId,
                    isRead: false
                })
                .orderBy('createdDate', 'desc');
        } catch (error) {
            console.error(`Error fetching unread notifications for user ID ${userId}:`, error);
            throw new Error('Unable to find unread notifications');
        }
    },

    async add(notification) {
        try {
            const [notificationId] = await db('Notification').insert(notification);
            return notificationId;
        } catch (error) {
            console.error('Error adding notification:', error);
            throw new Error('Unable to add notification');
        }
    },

    async markAsRead(notificationId) {
        try {
            const result = await db('Notification')
                .where('notificationId', notificationId)
                .update({ isRead: true });
            return result > 0;
        } catch (error) {
            console.error(`Error marking notification with ID ${notificationId} as read:`, error);
            throw new Error('Unable to mark notification as read');
        }
    },

    async markAllAsRead(userId) {
        try {
            const result = await db('Notification')
                .where({
                    userId: userId,
                    isRead: false
                })
                .update({ isRead: true });
            return result > 0;
        } catch (error) {
            console.error(`Error marking all notifications as read for user ID ${userId}:`, error);
            throw new Error('Unable to mark all notifications as read');
        }
    },

    async delete(notificationId) {
        try {
            const result = await db('Notification')
                .where('notificationId', notificationId)
                .delete();
            return result > 0;
        } catch (error) {
            console.error(`Error deleting notification with ID ${notificationId}:`, error);
            throw new Error('Unable to delete notification');
        }
    },

    async deleteAllForUser(userId) {
        try {
            const result = await db('Notification')
                .where('userId', userId)
                .delete();
            return result > 0;
        } catch (error) {
            console.error(`Error deleting all notifications for user ID ${userId}:`, error);
            throw new Error('Unable to delete all notifications');
        }
    },

    async countUnreadByUser(userId) {
        try {
            const [result] = await db('Notification')
                .where({
                    userId: userId,
                    isRead: false
                })
                .count('notificationId as count');
            return result.count;
        } catch (error) {
            console.error(`Error counting unread notifications for user ID ${userId}:`, error);
            throw new Error('Unable to count unread notifications');
        }
    }
}; 