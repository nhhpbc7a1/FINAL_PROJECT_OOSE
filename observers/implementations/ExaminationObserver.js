import IObserver from '../interfaces/IObserver.js';
import NotificationDAO from '../../dao/NotificationDAO.js';

/**
 * Observer for examination completion notifications
 */
class ExaminationObserver extends IObserver {
    constructor(userId) {
        super();
        this.userId = userId;
    }

    async update(data) {
        const notification = {
            userId: this.userId,
            type: 'examination',
            title: 'Examination Completed',
            message: `Your examination has been completed. ${data.additionalInfo || ''}`,
            status: 'unread',
            createdAt: new Date()
        };

        await NotificationDAO.create(notification);
    }
}

export default ExaminationObserver; 