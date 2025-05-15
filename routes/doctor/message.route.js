import express from 'express';
import notificationService from '../../services/notification.service.js';
import doctorNotificationService from '../../services/doctor-side-service/doctorNotification.service.js';
import moment from 'moment';

const router = express.Router();

// Middleware for layout and current route
router.use((req, res, next) => {
    res.locals.layout = 'doctor';
    res.locals.active = 'messages'; // Set active menu item
    next();
});

router.get('/', async function (req, res) {
  try {
    // Get the userId from the session
    const userId = req.session.authUser?.userId;
    
    // Check if user is logged in
    if (!userId) {
      return res.redirect('/account/login'); // Redirect to login page if not logged in
    }
    
    console.log(userId);
    
    // Fetch notifications for this user
    const notifications = await notificationService.findByUser(userId);
    
    // Format notifications
    const formattedNotifications = notifications.map(notification => ({
      ...notification,
      formattedDate: moment(notification.createdDate).format('MMM D, YYYY'),
      formattedTime: moment(notification.createdDate).format('hh:mm A'),
      timeAgo: moment(notification.createdDate).fromNow()
    }));
    
    // Get unread count
    const unreadCount = await notificationService.countUnreadByUser(userId);
    
    res.render('vwDoctor/messages', {
      notifications: formattedNotifications,
      hasNotifications: formattedNotifications.length > 0,
      unreadCount
    });
  } catch (error) {
    console.error('Error loading messages:', error);
    res.render('vwDoctor/messages', { error: 'Could not load notifications' });
  }
});

router.post('/mark-read/:id', async function (req, res) {
  try {
    const notificationId = req.params.id;
    console.log(`Attempting to mark notification ${notificationId} as read`);
    const result = await doctorNotificationService.markAsRead(notificationId);
    console.log(`Mark as read result: ${result}`);
    res.redirect('/doctor/messages');
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.redirect('/doctor/messages?error=Could not mark notification as read');
  }
});

router.post('/mark-all-read', async function (req, res) {
  try {
    // Get the userId from the session
    const userId = req.session.authUser?.userId;
    
    // Check if user is logged in
    if (!userId) {
      return res.redirect('/account/login'); // Redirect to login page if not logged in
    }
    
    await doctorNotificationService.markAllAsRead(userId);
    res.redirect('/doctor/messages');
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.redirect('/doctor/messages?error=Could not mark all notifications as read');
  }
});

router.post('/delete/:id', async function (req, res) {
  try {
    const notificationId = req.params.id;
    console.log(`Attempting to delete notification ${notificationId}`);
    const result = await doctorNotificationService.deleteNotification(notificationId);
    console.log(`Delete result: ${result}`);
    res.redirect('/doctor/messages');
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.redirect('/doctor/messages?error=Could not delete notification');
  }
});

export default router; 