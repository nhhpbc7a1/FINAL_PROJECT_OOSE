import ISubject from '../interfaces/ISubject.js';

/**
 * Concrete implementation of Subject for handling notifications
 */
class NotificationSubject extends ISubject {
    constructor() {
        super();
        if (NotificationSubject.instance) {
            return NotificationSubject.instance;
        }
        this.observers = new Map();
        NotificationSubject.instance = this;
    }

    /**
     * Attach an observer for a specific notification type
     * @param {IObserver} observer - Observer to attach
     * @param {string} type - Type of notification
     */
    attach(observer, type) {
        if (!this.observers.has(type)) {
            this.observers.set(type, []);
        }
        const observers = this.observers.get(type);
        if (!observers.includes(observer)) {
            observers.push(observer);
        }
    }

    /**
     * Detach an observer from a specific notification type
     * @param {IObserver} observer - Observer to detach
     * @param {string} type - Type of notification
     */
    detach(observer, type) {
        if (!this.observers.has(type)) return;
        
        const observers = this.observers.get(type);
        const index = observers.indexOf(observer);
        if (index !== -1) {
            observers.splice(index, 1);
        }
    }

    /**
     * Notify all observers of a specific type
     * @param {string} type - Type of notification
     * @param {Object} data - Data to send to observers
     */
    notify(type, data) {
        if (!this.observers.has(type)) return;
        
        const observers = this.observers.get(type);
        observers.forEach(observer => {
            observer.update(data);
        });
    }

    /**
     * Get singleton instance
     * @returns {NotificationSubject} Singleton instance
     */
    static getInstance() {
        if (!NotificationSubject.instance) {
            NotificationSubject.instance = new NotificationSubject();
        }
        return NotificationSubject.instance;
    }
}

// Create singleton instance
const notificationSubject = NotificationSubject.getInstance();
export default notificationSubject; 