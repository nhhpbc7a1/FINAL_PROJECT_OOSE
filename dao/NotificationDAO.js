import db from '../ultis/db.js';

/**
 * Data Access Object for notification-related database operations
 */
export default {
  /**
   * Find all notifications
   * @returns {Promise<Array>} List of all notifications
   */
  async findAll() {
    try {
      const rows = await db('Notification').orderBy('createdDate', 'desc');
      return rows;
    } catch (error) {
      console.error('Error retrieving all notifications:', error);
      throw error;
    }
  },
  
  /**
   * Find a notification by its ID
   * @param {number} notificationId - ID of the notification to find
   * @returns {Promise<Object|null>} The notification or null if not found
   */
  async findById(notificationId) {
    try {
      const rows = await db('Notification').where('notificationId', notificationId);
      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      console.error(`Error retrieving notification with ID ${notificationId}:`, error);
      throw error;
    }
  },
  
  /**
   * Find all notifications for a specific user
   * @param {number} userId - The user's ID
   * @returns {Promise<Array>} List of notifications for the user
   */
  async findByUserId(userId) {
    try {
      const rows = await db('Notification')
        .where('userId', userId)
        .orderBy('createdDate', 'desc');
      return rows;
    } catch (error) {
      console.error(`Error retrieving notifications for user ${userId}:`, error);
      throw error;
    }
  },
  
  /**
   * Find all unread notifications for a specific user
   * @param {number} userId - The user's ID
   * @returns {Promise<Array>} List of unread notifications for the user
   */
  async findUnreadByUserId(userId) {
    try {
      const rows = await db('Notification')
        .where('userId', userId)
        .where('isRead', 0)
        .orderBy('createdDate', 'desc');
      return rows;
    } catch (error) {
      console.error(`Error retrieving unread notifications for user ${userId}:`, error);
      throw error;
    }
  },
  
  /**
   * Count unread notifications for a specific user
   * @param {number} userId - The user's ID
   * @returns {Promise<number>} Count of unread notifications
   */
  async countUnreadByUserId(userId) {
    try {
      const result = await db('Notification')
        .count('* as count')
        .where('userId', userId)
        .where('isRead', 0)
        .first();
      return result.count;
    } catch (error) {
      console.error(`Error counting unread notifications for user ${userId}:`, error);
      throw error;
    }
  },
  
  /**
   * Create a new notification
   * @param {Object} notification - Notification data
   * @param {number} notification.userId - User ID to notify
   * @param {string} notification.title - Notification title
   * @param {string} notification.content - Notification content
   * @param {boolean} notification.isRead - Whether notification is read (default: false)
   * @param {Date} notification.createdDate - Creation date (default: now)
   * @returns {Promise<number>} ID of the created notification
   */
  async create(notification) {
    try {
      const { userId, title, content, isRead = false, createdDate = new Date() } = notification;
      
      const [insertId] = await db('Notification').insert({
        userId,
        title,
        content,
        isRead,
        createdDate
      });
      
      return insertId;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  },
  
  /**
   * Update a notification
   * @param {number} notificationId - ID of the notification to update
   * @param {Object} notification - Updated notification data
   * @returns {Promise<boolean>} Success status
   */
  async update(notificationId, notification) {
    try {
      const { userId, title, content, isRead } = notification;
      
      const affectedRows = await db('Notification')
        .where('notificationId', notificationId)
        .update({
          userId,
          title,
          content,
          isRead
        });
      
      return affectedRows > 0;
    } catch (error) {
      console.error(`Error updating notification ${notificationId}:`, error);
      throw error;
    }
  },
  
  /**
   * Mark a notification as read
   * @param {number} notificationId - ID of the notification to mark as read
   * @returns {Promise<boolean>} Success status
   */
  async markAsRead(notificationId) {
    try {
      const affectedRows = await db('Notification')
        .where('notificationId', notificationId)
        .update({ isRead: 1 });
      
      return affectedRows > 0;
    } catch (error) {
      console.error(`Error marking notification ${notificationId} as read:`, error);
      throw error;
    }
  },
  
  /**
   * Mark all notifications for a specific user as read
   * @param {number} userId - The user's ID
   * @returns {Promise<boolean>} Success status
   */
  async markAllAsReadForUser(userId) {
    try {
      const affectedRows = await db('Notification')
        .where('userId', userId)
        .update({ isRead: 1 });
      
      return affectedRows > 0;
    } catch (error) {
      console.error(`Error marking all notifications as read for user ${userId}:`, error);
      throw error;
    }
  },
  
  /**
   * Delete a notification
   * @param {number} notificationId - ID of the notification to delete
   * @returns {Promise<boolean>} Success status
   */
  async delete(notificationId) {
    try {
      const affectedRows = await db('Notification')
        .where('notificationId', notificationId)
        .delete();
      
      return affectedRows > 0;
    } catch (error) {
      console.error(`Error deleting notification ${notificationId}:`, error);
      throw error;
    }
  },
  
  /**
   * Delete all notifications for a specific user
   * @param {number} userId - The user's ID
   * @returns {Promise<boolean>} Success status
   */
  async deleteAllForUser(userId) {
    try {
      const affectedRows = await db('Notification')
        .where('userId', userId)
        .delete();
      
      return affectedRows > 0;
    } catch (error) {
      console.error(`Error deleting all notifications for user ${userId}:`, error);
      throw error;
    }
  }
}; 