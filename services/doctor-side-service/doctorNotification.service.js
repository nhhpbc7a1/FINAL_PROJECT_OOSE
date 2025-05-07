import db from '../../ultis/db.js';
import moment from 'moment';

/**
 * Doctor-specific notification service
 * Handles retrieving, creating, and managing notifications for doctors
 */
export default {
  /**
   * Get all notifications for a doctor
   * @param {number} userId - Doctor's user ID
   * @returns {Promise<Array>} List of notifications
   */
  async getNotificationsForDoctor(userId) {
    try {
      return await db('Notification')
        .where('userId', userId)
        .orderBy('createdDate', 'desc');
    } catch (error) {
      console.error('Error getting doctor notifications:', error);
      throw new Error('Failed to get notifications');
    }
  },
  
  /**
   * Get unread notifications count for a doctor
   * @param {number} userId - Doctor's user ID
   * @returns {Promise<number>} Count of unread notifications
   */
  async getUnreadNotificationsCount(userId) {
    try {
      const result = await db('Notification')
        .where({
          userId: userId,
          isRead: false
        })
        .count('notificationId as count')
        .first();
        
      return result ? result.count : 0;
    } catch (error) {
      console.error('Error counting unread notifications:', error);
      return 0;
    }
  },
  
  /**
   * Get unread notifications for a doctor
   * @param {number} userId - Doctor's user ID
   * @returns {Promise<Array>} List of unread notifications
   */
  async getUnreadNotifications(userId) {
    try {
      return await db('Notification')
        .where({
          userId: userId,
          isRead: false
        })
        .orderBy('createdDate', 'desc');
    } catch (error) {
      console.error('Error getting unread notifications:', error);
      throw new Error('Failed to get unread notifications');
    }
  },
  
  /**
   * Mark a notification as read
   * @param {number} notificationId - ID of the notification
   * @returns {Promise<boolean>} Success status
   */
  async markAsRead(notificationId) {
    try {
      const result = await db('Notification')
        .where('notificationId', notificationId)
        .update({ isRead: true });
        
      return result > 0;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw new Error('Failed to mark notification as read');
    }
  },
  
  /**
   * Mark all notifications for a doctor as read
   * @param {number} userId - Doctor's user ID
   * @returns {Promise<boolean>} Success status
   */
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
      console.error('Error marking all notifications as read:', error);
      throw new Error('Failed to mark all notifications as read');
    }
  },
  
  /**
   * Delete a notification
   * @param {number} notificationId - ID of the notification
   * @returns {Promise<boolean>} Success status
   */
  async deleteNotification(notificationId) {
    try {
      const result = await db('Notification')
        .where('notificationId', notificationId)
        .delete();
        
      return result > 0;
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw new Error('Failed to delete notification');
    }
  },
  
  /**
   * Create a new notification when a test request is made
   * @param {Object} testData - Test request data
   * @param {Object} doctorData - Doctor data
   * @param {Object} patientData - Patient data
   */
  async createTestRequestNotification(testData, doctorData, patientData) {
    try {
      // Create notification for lab technician
      const techNotification = {
        userId: 6, // Lab technician user ID - in production this would be determined dynamically
        title: 'New test request',
        content: `Dr. ${doctorData.fullName} has requested a ${testData.testName} test for patient ${patientData.fullName}.`,
        isRead: false,
        createdDate: new Date()
      };
      
      await db('Notification').insert(techNotification);
      console.log('Test request notification sent to lab technician');
      
      // Create notification for patient if we have their userId
      if (patientData.userId) {
        const patientNotification = {
          userId: patientData.userId,
          title: 'New lab test requested',
          content: `Your doctor has requested a ${testData.testName} test. The lab team will process your request shortly.`,
          isRead: false,
          createdDate: new Date()
        };
        
        await db('Notification').insert(patientNotification);
        console.log('Test request notification sent to patient');
      }
    } catch (error) {
      console.error('Error creating test request notifications:', error);
      // We don't want to throw here as it would disrupt the main flow
    }
  },
  
  /**
   * Create a new notification when a prescription is created
   * @param {Object} prescriptionData - Prescription data
   * @param {Object} doctorData - Doctor data
   * @param {Object} patientData - Patient data
   */
  async createPrescriptionNotification(prescriptionData, doctorData, patientData) {
    try {
      if (patientData.userId) {
        const medicationSummary = Array.isArray(prescriptionData.medications) 
          ? (prescriptionData.medications.length === 1 
            ? prescriptionData.medications[0].name 
            : `${prescriptionData.medications.length} medications`)
          : 'a new prescription';
          
        const notification = {
          userId: patientData.userId,
          title: 'New prescription available',
          content: `Dr. ${doctorData.fullName} has prescribed ${medicationSummary} for you. Please check your prescriptions.`,
          isRead: false,
          createdDate: new Date()
        };
        
        await db('Notification').insert(notification);
        console.log('Prescription notification sent to patient');
      }
    } catch (error) {
      console.error('Error creating prescription notification:', error);
      // We don't want to throw here as it would disrupt the main flow
    }
  },
  
  /**
   * Create a new notification when an examination is completed
   * @param {Object} examinationData - Examination data
   * @param {Object} doctorData - Doctor data
   * @param {Object} patientData - Patient data
   */
  async createExaminationNotification(examinationData, appointmentData, patientData) {
    try {
      if (patientData.userId) {
        const formattedDate = moment(appointmentData.appointmentDate).format('MMMM D, YYYY');
        
        const notification = {
          userId: patientData.userId,
          title: 'Medical examination completed',
          content: `Your examination on ${formattedDate} has been completed. Please check your medical records.`,
          isRead: false,
          createdDate: new Date()
        };
        
        await db('Notification').insert(notification);
        console.log('Examination completion notification sent to patient');
      }
    } catch (error) {
      console.error('Error creating examination notification:', error);
      // We don't want to throw here as it would disrupt the main flow
    }
  },
  
  /**
   * Send a notification to a doctor about new appointments
   * @param {number} doctorUserId - Doctor's user ID
   * @param {Object} appointmentData - Appointment data
   */
  async notifyDoctorOfNewAppointment(doctorUserId, appointmentData) {
    try {
      const notification = {
        userId: doctorUserId,
        title: 'New appointment scheduled',
        content: `You have a new appointment with patient ${appointmentData.patientName} on ${moment(appointmentData.appointmentDate).format('MMMM D, YYYY')} at ${moment(appointmentData.estimatedTime, 'HH:mm:ss').format('h:mm A')}.`,
        isRead: false,
        createdDate: new Date()
      };
      
      await db('Notification').insert(notification);
      console.log('New appointment notification sent to doctor');
    } catch (error) {
      console.error('Error creating new appointment notification:', error);
    }
  },
  
  /**
   * Insert test notifications for testing and demonstration purposes
   */
  async insertTestNotifications() {
    try {
      console.log('Inserting test notifications...');
      
      // First, check if we already have notifications in the database
      const existingNotifications = await db('Notification').count('notificationId as count').first();
      
      if (existingNotifications.count > 0) {
        console.log(`Found ${existingNotifications.count} existing notifications. Skipping insertion.`);
        console.log('To add more test notifications, clear the existing ones first.');
        return false;
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
      
      // Insert notifications into the database
      await db('Notification').insert(doctorNotifications);
      
      console.log(`Successfully inserted ${doctorNotifications.length} test notifications for doctor.`);
      return true;
    } catch (error) {
      console.error('Error inserting test notifications:', error);
      return false;
    }
  }
}; 