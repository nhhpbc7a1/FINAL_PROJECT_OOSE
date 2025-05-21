import Doctor from '../../models/Doctor.js';
import NotificationDAO from '../../dao/NotificationDAO.js';
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
      // Validate that the doctor exists if possible (if we have doctorId)
      if (userId) {
        const doctor = await Doctor.findByUserId(userId);
        if (doctor) {
          console.log(`Found doctor with ID ${doctor.doctorId} for user ${userId}`);
        }
      }
      
      return await NotificationDAO.findByUserId(userId);
    } catch (error) {
      console.error('Error getting doctor notifications:', error);
      throw new Error('Failed to get notifications: ' + error.message);
    }
  },
  
  /**
   * Get unread notifications count for a doctor
   * @param {number} userId - Doctor's user ID
   * @returns {Promise<number>} Count of unread notifications
   */
  async getUnreadNotificationsCount(userId) {
    try {
      return await NotificationDAO.countUnreadByUserId(userId);
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
      return await NotificationDAO.findUnreadByUserId(userId);
    } catch (error) {
      console.error('Error getting unread notifications:', error);
      throw new Error('Failed to get unread notifications: ' + error.message);
    }
  },
  
  /**
   * Mark a notification as read
   * @param {number} notificationId - ID of the notification
   * @returns {Promise<boolean>} Success status
   */
  async markAsRead(notificationId) {
    try {
      return await NotificationDAO.markAsRead(notificationId);
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw new Error('Failed to mark notification as read: ' + error.message);
    }
  },
  
  /**
   * Mark all notifications for a doctor as read
   * @param {number} userId - Doctor's user ID
   * @returns {Promise<boolean>} Success status
   */
  async markAllAsRead(userId) {
    try {
      return await NotificationDAO.markAllAsReadForUser(userId);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw new Error('Failed to mark all notifications as read: ' + error.message);
    }
  },
  
  /**
   * Delete a notification
   * @param {number} notificationId - ID of the notification
   * @returns {Promise<boolean>} Success status
   */
  async deleteNotification(notificationId) {
    try {
      return await NotificationDAO.delete(notificationId);
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw new Error('Failed to delete notification: ' + error.message);
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
      
      await NotificationDAO.create(techNotification);
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
        
        await NotificationDAO.create(patientNotification);
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
        
        await NotificationDAO.create(notification);
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
        
        await NotificationDAO.create(notification);
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
      
      await NotificationDAO.create(notification);
      console.log('New appointment notification sent to doctor');
    } catch (error) {
      console.error('Error creating new appointment notification:', error);
    }
  },
  
  /**
   * Send a notification to a specific user
   * @param {number} userId - User ID to send notification to
   * @param {string} title - Notification title
   * @param {string} content - Notification content
   * @returns {Promise<number>} ID of the created notification
   */
  async sendNotification(userId, title, content) {
    try {
      const notification = {
        userId,
        title,
        content,
        isRead: false,
        createdDate: new Date()
      };
      
      const notificationId = await NotificationDAO.create(notification);
      console.log(`Notification sent to user ${userId}`);
      return notificationId;
    } catch (error) {
      console.error('Error sending notification:', error);
      throw new Error(`Failed to send notification: ${error.message}`);
    }
  },
  
  /**
   * Insert test notifications for testing and demonstration purposes
   */
  async insertTestNotifications() {
    try {
      console.log('Inserting test notifications...');
      // Use DAO to insert test notifications
      await NotificationDAO.createTestNotifications();
    } catch (error) {
      console.error('Error inserting test notifications:', error);
    }
  }
}; 