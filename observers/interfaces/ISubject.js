/**
 * Interface for Subject in the Observer Pattern
 */
class ISubject {
    /**
     * Attach an observer to the subject
     * @param {IObserver} observer - Observer to attach
     * @param {string} type - Type of notification
     */
    attach(observer, type) {
        throw new Error('Method attach() must be implemented');
    }

    /**
     * Detach an observer from the subject
     * @param {IObserver} observer - Observer to detach
     * @param {string} type - Type of notification
     */
    detach(observer, type) {
        throw new Error('Method detach() must be implemented');
    }

    /**
     * Notify all observers about an event
     * @param {string} type - Type of notification
     * @param {Object} data - Data to send to observers
     */
    notify(type, data) {
        throw new Error('Method notify() must be implemented');
    }
}

export default ISubject; 