import express from 'express';
import notificationService from '../../services/notification.service.js';
import moment from 'moment';

const router = express.Router();

// Get unread notifications for the current user
router.get('/unread', async function (req, res) {
  try {
    // Get the userId from session
    const userId = req.session.authUser?.userId;
    
    if (!userId) {
      console.error('No userId found in session:', req.session);
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }
    
    console.log(`Fetching unread notifications for userId: ${userId}`);
    
    // Get unread notifications
    const notifications = await notificationService.findUnreadByUser(userId);
    console.log(`Found ${notifications.length} unread notifications`);
    
    // Format notifications
    const formattedNotifications = notifications.map(notification => ({
      ...notification,
      formattedDate: moment(notification.createdDate).format('MMM D, YYYY'),
      formattedTime: moment(notification.createdDate).format('hh:mm A'),
      timeAgo: moment(notification.createdDate).fromNow()
    }));
    
    res.json({
      success: true,
      notifications: formattedNotifications
    });
  } catch (error) {
    console.error('Error fetching unread notifications:', error);
    res.status(500).json({
      success: false,
      error: 'Could not fetch notifications'
    });
  }
});

// Get notification count for the current user
router.get('/count', async function (req, res) {
  try {
    // Get the userId from session
    const userId = req.session.authUser?.userId;
    
    if (!userId) {
      console.error('No userId found in session:', req.session);
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }
    
    console.log(`Fetching notification count for userId: ${userId}`);
    
    // Get unread count
    const count = await notificationService.countUnreadByUser(userId);
    console.log(`Found ${count} unread notifications`);
    
    res.json({
      success: true,
      count
    });
  } catch (error) {
    console.error('Error fetching notification count:', error);
    res.status(500).json({
      success: false,
      error: 'Could not fetch notification count'
    });
  }
});

export default router; 