import IObserver from '../interfaces/IObserver.js';
import NotificationDAO from '../../dao/NotificationDAO.js';

/**
 * Observer for prescription notifications
 */
class PrescriptionObserver extends IObserver {
    constructor(userId) {
        super();
        this.userId = userId;
    }

    async update(data) {
        const notification = {
            userId: this.userId,
            type: 'prescription',
            title: 'Prescription Updated',
            message: `Your prescription has been updated. ${data.additionalInfo || ''}`,
            status: 'unread',
            createdAt: new Date()
        };

        await NotificationDAO.create(notification);
    }
}

export default PrescriptionObserver; 