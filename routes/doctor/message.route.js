import express from 'express';
import Notification from '../../models/Notification.js';
import moment from 'moment';

const router = express.Router();

// Middleware for layout and current route
router.use((req, res, next) => {
    res.locals.layout = 'doctor';
    res.locals.currentRoute = 'messages';
    next();
});

// GET: Messages list page
router.get('/', async (req, res) => {
  try {
        // Get user ID from session
    const userId = req.session.authUser?.userId;
    
    if (!userId) {
            return res.redirect('/account/login'); // Redirect to login if not logged in
    }
    
    // Fetch notifications for this user
        const notifications = await Notification.findByUserId(userId);
    
    // Format notifications
    const formattedNotifications = notifications.map(notification => ({
      ...notification,
      formattedDate: moment(notification.createdDate).format('MMM D, YYYY'),
            timeAgo: moment(notification.createdDate).fromNow(),
            cssClass: notification.isRead ? 'read' : 'unread',
            icon: _getNotificationIcon(notification.title)
    }));
    
    // Get unread count
        const unreadCount = await Notification.countUnreadByUserId(userId);
    
    res.render('vwDoctor/messages', {
      notifications: formattedNotifications,
      unreadCount
    });
  } catch (error) {
    console.error('Error loading messages:', error);
        res.render('vwDoctor/messages', { error: 'Failed to load messages' });
  }
});

// POST: Mark notification as read
router.post('/mark-read/:id', async (req, res) => {
  try {
    const notificationId = req.params.id;
        if (!notificationId) {
            return res.status(400).json({ success: false, message: 'Notification ID is required' });
        }
        
        const notification = await Notification.findById(notificationId);
        if (!notification) {
            return res.status(404).json({ success: false, message: 'Notification not found' });
        }
        
        notification.isRead = true;
        await notification.save();
        
        res.json({ success: true });
  } catch (error) {
    console.error('Error marking notification as read:', error);
        res.status(500).json({ success: false, message: 'Failed to mark notification as read' });
  }
});

// POST: Mark all notifications as read
router.post('/mark-all-read', async (req, res) => {
  try {
    const userId = req.session.authUser?.userId;
    if (!userId) {
            return res.status(401).json({ success: false, message: 'Authentication required' });
    }
    
        await Notification.markAllAsReadForUser(userId);
        
        res.json({ success: true });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
        res.status(500).json({ success: false, message: 'Failed to mark all notifications as read' });
  }
});

// POST: Delete notification
router.post('/delete/:id', async (req, res) => {
  try {
    const notificationId = req.params.id;
        if (!notificationId) {
            return res.status(400).json({ success: false, message: 'Notification ID is required' });
        }
        
        const notification = await Notification.findById(notificationId);
        if (!notification) {
            return res.json({ success: true }); // Already deleted, consider it success
        }
        
        await notification.delete();
        
        res.json({ success: true });
  } catch (error) {
    console.error('Error deleting notification:', error);
        res.status(500).json({ success: false, message: 'Failed to delete notification' });
    }
});

// Helper function to get appropriate icon based on notification title
function _getNotificationIcon(title) {
    title = title.toLowerCase();
    
    if (title.includes('appointment')) return 'fa-calendar-check';
    if (title.includes('test') || title.includes('lab')) return 'fa-flask';
    if (title.includes('prescription')) return 'fa-pills';
    if (title.includes('examination') || title.includes('medical')) return 'fa-stethoscope';
    if (title.includes('message')) return 'fa-envelope';
    if (title.includes('payment')) return 'fa-dollar-sign';
    
    // Default icon
    return 'fa-bell';
}

export default router; 