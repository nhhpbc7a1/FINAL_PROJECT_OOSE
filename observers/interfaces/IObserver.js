/**
 * Interface for Observer in the Observer Pattern
 */
class IObserver {
    /**
     * Update method to be called when subject notifies
     * @param {Object} data - Notification data
     */
    update(data) {
        throw new Error('Method update() must be implemented');
    }
}

export default IObserver; 