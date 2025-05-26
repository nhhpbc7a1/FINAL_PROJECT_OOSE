import IObserver from '../interfaces/IObserver.js';
import NotificationDAO from '../../dao/NotificationDAO.js';

/**
 * Observer for test request notifications
 */
class TestRequestObserver extends IObserver {
    constructor(userId) {
        super();
        this.userId = userId;
    }

    async update(data) {
        const notification = {
            userId: this.userId,
            type: 'test_request',
            title: 'New Test Request',
            content: `A new test request has been created for ${data.testType}. ${data.additionalInfo || ''}`,
            isRead: false,
            createdDate: new Date()
        };

        await NotificationDAO.create(notification);
    }
}

export default TestRequestObserver; 