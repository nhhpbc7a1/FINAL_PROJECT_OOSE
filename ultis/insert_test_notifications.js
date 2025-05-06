import db from '../ultis/db.js';

/**
 * Insert test notifications for demonstrating the notification feature
 */
async function insertTestNotifications() {
  try {
    console.log('Inserting test notifications...');
    
    // First, check if we already have notifications in the database
    const existingNotifications = await db('Notification').count('notificationId as count').first();
    
    if (existingNotifications.count > 0) {
      console.log(`Found ${existingNotifications.count} existing notifications. Skipping insertion.`);
      console.log('To add more test notifications, clear the existing ones first.');
      return;
    }
    
    // Sample notifications for doctors (userId 4 corresponds to doctorId 2)
    const doctorNotifications = [
      {
        userId: 4, // Doctor with doctorId 2
        title: 'New appointment scheduled',
        content: 'You have a new appointment with patient John Doe on Monday at 10:00 AM.',
        isRead: false,
        createdDate: new Date(Date.now() - 1000 * 60 * 30) // 30 minutes ago
      },
      {
        userId: 4,
        title: 'Lab results ready',
        content: 'Lab results for patient Jane Smith are now available for review.',
        isRead: false,
        createdDate: new Date(Date.now() - 1000 * 60 * 60 * 2) // 2 hours ago
      },
      {
        userId: 4,
        title: 'Appointment reminder',
        content: 'You have 3 appointments scheduled for tomorrow.',
        isRead: true,
        createdDate: new Date(Date.now() - 1000 * 60 * 60 * 24) // 1 day ago
      },
      {
        userId: 4,
        title: 'New message from administrator',
        content: 'Please review the updated hospital policies regarding patient care documentation.',
        isRead: false,
        createdDate: new Date(Date.now() - 1000 * 60 * 60 * 5) // 5 hours ago
      },
      {
        userId: 4,
        title: 'Schedule change',
        content: 'Your schedule for next week has been updated. Please check the calendar.',
        isRead: false,
        createdDate: new Date(Date.now() - 1000 * 60 * 45) // 45 minutes ago
      }
    ];
    
    // Sample notifications for other userId values (just for demonstration)
    const otherNotifications = [
      {
        userId: 2, // patient
        title: 'Appointment confirmed',
        content: 'Your appointment has been confirmed for Friday at 2:00 PM.',
        isRead: false,
        createdDate: new Date(Date.now() - 1000 * 60 * 60 * 3) // 3 hours ago
      },
      {
        userId: 6, // lab technician
        title: 'New test request',
        content: 'You have new test requests to process. Please check your dashboard.',
        isRead: false,
        createdDate: new Date(Date.now() - 1000 * 60 * 15) // 15 minutes ago
      }
    ];
    
    // System notifications (no specific user)
    const systemNotifications = [
      {
        userId: null,
        title: 'System maintenance',
        content: 'The system will be down for maintenance on Sunday from 2:00 AM to 4:00 AM.',
        isRead: false,
        createdDate: new Date(Date.now() - 1000 * 60 * 60 * 12) // 12 hours ago
      }
    ];
    
    // Combine all notifications
    const allNotifications = [
      ...doctorNotifications,
      ...otherNotifications,
      ...systemNotifications
    ];
    
    // Insert notifications into the database
    await db('Notification').insert(allNotifications);
    
    console.log(`Successfully inserted ${allNotifications.length} test notifications.`);
    
  } catch (error) {
    console.error('Error inserting test notifications:', error);
  } finally {
    // Close the database connection
    await db.destroy();
  }
}

// Execute the function
insertTestNotifications()
  .then(() => console.log('Done'))
  .catch(err => console.error('Failed:', err)); 