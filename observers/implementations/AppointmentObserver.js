import IObserver from '../interfaces/IObserver.js';
import NotificationDAO from '../../dao/NotificationDAO.js';

/**
 * Observer for appointment-related notifications
 */
class AppointmentObserver extends IObserver {
    /**
     * Create appointment observer
     * @param {number} userId - User ID to notify
     */
    constructor(userId) {
        super();
        this.userId = userId;
    }

    /**
     * Handle appointment notification updates
     * @param {Object} data - Appointment notification data
     */
    async update(data) {
        const notification = {
            userId: this.userId,
            type: 'appointment',
            title: 'Appointment Update',
            message: this.createMessage(data),
            status: 'unread',
            createdAt: new Date()
        };

        await NotificationDAO.add(notification);
    }

    /**
     * Create appropriate message based on appointment action
     * @param {Object} data - Appointment data
     * @returns {string} Formatted message
     * @private
     */
    createMessage(data) {
        switch(data.action) {
            case 'confirmed':
                return `Your appointment on ${data.date} has been confirmed`;
            case 'cancelled':
                return `Your appointment on ${data.date} has been cancelled`;
            case 'rescheduled':
                return `Your appointment has been rescheduled to ${data.newDate}`;
            default:
                return `Your appointment status has been updated`;
        }
    }
}

export default AppointmentObserver; 