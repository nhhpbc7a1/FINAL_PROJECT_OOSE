import IObserver from '../interfaces/IObserver.js';
import NotificationDAO from '../../dao/NotificationDAO.js';

/**
 * Observer for test result notifications
 */
class TestResultObserver extends IObserver {
    constructor(userId) {
        super();
        this.userId = userId;
    }

    async update(data) {
        const notification = {
            userId: this.userId,
            type: 'test_result',
            title: 'Test Results Available',
            message: `Your test results have been updated. ${data.additionalInfo || ''}`,
            status: 'unread',
            createdAt: new Date()
        };

        await NotificationDAO.create(notification);
    }
}

export default TestResultObserver; 