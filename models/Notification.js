import NotificationDAO from '../dao/NotificationDAO.js';

/**
 * Notification Model Class
 * Represents a notification in the system
 */
class Notification {
    /**
     * Create a new Notification instance
     * @param {Object} notificationData - Notification data
     */
    constructor(notificationData = {}) {
        this.notificationId = notificationData.notificationId || null;
        this.userId = notificationData.userId;
        this.title = notificationData.title || '';
        this.content = notificationData.content || '';
        this.isRead = notificationData.isRead !== undefined ? notificationData.isRead : false;
        this.createdDate = notificationData.createdDate || new Date();
    }

    /**
     * Save the notification
     * @returns {Promise<number>} The notification ID
     */
    async save() {
        try {
            const notificationData = {
                userId: this.userId,
                title: this.title,
                content: this.content,
                isRead: this.isRead,
                createdDate: this.createdDate
            };
            
            if (this.notificationId) {
                // Update existing notification
                await NotificationDAO.update(this.notificationId, notificationData);
                return this.notificationId;
            } else {
                // Create new notification
                this.notificationId = await NotificationDAO.create(notificationData);
                return this.notificationId;
            }
        } catch (error) {
            console.error('Error saving notification:', error);
            throw new Error('Failed to save notification: ' + error.message);
        }
    }

    /**
     * Delete the notification
     * @returns {Promise<boolean>} Success status
     */
    async delete() {
        try {
            if (!this.notificationId) {
                throw new Error('Cannot delete unsaved notification');
            }
            
            return await NotificationDAO.delete(this.notificationId);
        } catch (error) {
            console.error('Error deleting notification:', error);
            throw new Error('Failed to delete notification: ' + error.message);
        }
    }

    /**
     * Find all notifications
     * @returns {Promise<Array<Notification>>} Array of notifications
     */
    static async findAll() {
        try {
            const notifications = await NotificationDAO.findAll();
            return notifications.map(notification => new Notification(notification));
        } catch (error) {
            console.error('Error fetching all notifications:', error);
            throw new Error('Unable to load notifications: ' + error.message);
        }
    }

    /**
     * Find a notification by ID
     * @param {number} notificationId - Notification ID
     * @returns {Promise<Notification|null>} The found notification or null
     */
    static async findById(notificationId) {
        try {
            const notification = await NotificationDAO.findById(notificationId);
            return notification ? new Notification(notification) : null;
        } catch (error) {
            console.error(`Error finding notification with ID ${notificationId}:`, error);
            throw new Error('Unable to find notification: ' + error.message);
        }
    }

    /**
     * Find notifications by user ID
     * @param {number} userId - User ID
     * @returns {Promise<Array<Notification>>} Array of notifications
     */
    static async findByUserId(userId) {
        try {
            const notifications = await NotificationDAO.findByUserId(userId);
            return notifications.map(notification => new Notification(notification));
        } catch (error) {
            console.error(`Error finding notifications for user ${userId}:`, error);
            throw new Error('Unable to find notifications by user: ' + error.message);
        }
    }

    /**
     * Find unread notifications by user ID
     * @param {number} userId - User ID
     * @returns {Promise<Array<Notification>>} Array of unread notifications
     */
    static async findUnreadByUserId(userId) {
        try {
            const notifications = await NotificationDAO.findUnreadByUserId(userId);
            return notifications.map(notification => new Notification(notification));
        } catch (error) {
            console.error(`Error finding unread notifications for user ${userId}:`, error);
            throw new Error('Unable to find unread notifications: ' + error.message);
        }
    }

    /**
     * Count unread notifications by user ID
     * @param {number} userId - User ID
     * @returns {Promise<number>} Count of unread notifications
     */
    static async countUnreadByUserId(userId) {
        try {
            return await NotificationDAO.countUnreadByUserId(userId);
        } catch (error) {
            console.error(`Error counting unread notifications for user ${userId}:`, error);
            return 0;
        }
    }

    /**
     * Mark all notifications for a user as read
     * @param {number} userId - User ID
     * @returns {Promise<boolean>} Success status
     */
    static async markAllAsReadForUser(userId) {
        try {
            return await NotificationDAO.markAllAsReadForUser(userId);
        } catch (error) {
            console.error(`Error marking all notifications as read for user ${userId}:`, error);
            throw new Error('Failed to mark all notifications as read: ' + error.message);
        }
    }

    /**
     * Insert test notifications for testing and demonstration purposes
     * @returns {Promise<boolean>} Success status
     */
    static async createTestNotifications() {
        try {
            return await NotificationDAO.createTestNotifications();
        } catch (error) {
            console.error('Error creating test notifications:', error);
            throw new Error('Failed to create test notifications: ' + error.message);
        }
    }
}

export default Notification; 