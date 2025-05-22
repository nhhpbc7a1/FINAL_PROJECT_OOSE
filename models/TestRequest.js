import TestRequestDAO from '../dao/TestRequestDAO.js';

/**
 * TestRequest Model Class
 * Represents a test request in the system
 */
class TestRequest {
    /**
     * Create a new TestRequest instance
     * @param {Object} requestData - Test request data
     */
    constructor(requestData = {}) {
        this.requestId = requestData.requestId || null;
        this.appointmentId = requestData.appointmentId;
        this.serviceId = requestData.serviceId;
        this.requestedByDoctorId = requestData.requestedByDoctorId;
        this.notes = requestData.notes || '';
        this.status = requestData.status || 'pending';
        this.priority = requestData.priority || 'normal';
        this.requestDate = requestData.requestDate;
        this.completionDate = requestData.completionDate;
        
        // Related data from joins
        this.testName = requestData.testName;
        this.testType = requestData.testType;
        this.patientId = requestData.patientId;
        this.patientName = requestData.patientName;
        this.doctorName = requestData.doctorName;
        this.specialtyName = requestData.specialtyName;
    }

    /**
     * Save the test request
     * @returns {Promise<number>} The request ID
     */
    async save() {
        try {
            const requestData = {
                appointmentId: this.appointmentId,
                serviceId: this.serviceId,
                requestedByDoctorId: this.requestedByDoctorId,
                notes: this.notes,
                status: this.status,
                priority: this.priority
            };
            
            if (this.requestId) {
                // Update existing request
                await TestRequestDAO.update(this.requestId, requestData);
                return this.requestId;
            } else {
                // Create new request
                this.requestId = await TestRequestDAO.add(requestData);
                return this.requestId;
            }
        } catch (error) {
            console.error('Error saving test request:', error);
            throw new Error('Failed to save test request: ' + error.message);
        }
    }

    /**
     * Delete the test request
     * @returns {Promise<boolean>} Success status
     */
    async delete() {
        try {
            if (!this.requestId) {
                throw new Error('Cannot delete unsaved test request');
            }
            
            return await TestRequestDAO.delete(this.requestId);
        } catch (error) {
            console.error('Error deleting test request:', error);
            throw new Error('Failed to delete test request: ' + error.message);
        }
    }

    /**
     * Find all test requests
     * @returns {Promise<Array<TestRequest>>} Array of test requests
     */
    static async findAll() {
        try {
            const requests = await TestRequestDAO.findAll();
            return requests.map(request => new TestRequest(request));
        } catch (error) {
            console.error('Error fetching all test requests:', error);
            throw new Error('Unable to load test requests: ' + error.message);
        }
    }

    /**
     * Find a test request by ID
     * @param {number} requestId - Request ID
     * @returns {Promise<TestRequest|null>} The found request or null
     */
    static async findById(requestId) {
        try {
            const request = await TestRequestDAO.findById(requestId);
            return request ? new TestRequest(request) : null;
        } catch (error) {
            console.error(`Error finding test request with ID ${requestId}:`, error);
            throw new Error('Unable to find test request: ' + error.message);
        }
    }

    /**
     * Find test requests by appointment
     * @param {number} appointmentId - Appointment ID
     * @returns {Promise<Array<TestRequest>>} Array of test requests
     */
    static async findByAppointment(appointmentId) {
        try {
            const requests = await TestRequestDAO.findByAppointment(appointmentId);
            return requests.map(request => new TestRequest(request));
        } catch (error) {
            console.error(`Error finding test requests for appointment ${appointmentId}:`, error);
            throw new Error('Unable to find test requests by appointment: ' + error.message);
        }
    }

    /**
     * Find test requests by status
     * @param {string} status - Request status
     * @returns {Promise<Array<TestRequest>>} Array of test requests
     */
    static async findByStatus(status) {
        try {
            const requests = await TestRequestDAO.findByStatus(status);
            return requests.map(request => new TestRequest(request));
        } catch (error) {
            console.error(`Error finding test requests with status ${status}:`, error);
            throw new Error('Unable to find test requests by status: ' + error.message);
        }
    }

    /**
     * Count test requests by status
     * @returns {Promise<Object>} Count by status
     */
    static async countByStatus() {
        try {
            return await TestRequestDAO.countByStatus();
        } catch (error) {
            console.error('Error counting test requests by status:', error);
            throw new Error('Unable to count test requests by status: ' + error.message);
        }
    }

    /**
     * Count test requests by doctor
     * @returns {Promise<Array>} Count by doctor
     */
    static async countByDoctor() {
        try {
            return await TestRequestDAO.countByDoctor();
        } catch (error) {
            console.error('Error counting test requests by doctor:', error);
            throw new Error('Unable to count test requests by doctor: ' + error.message);
        }
    }

    /**
     * Count pending requests by service
     * @returns {Promise<Array>} Count by service
     */
    static async countPendingByService() {
        try {
            return await TestRequestDAO.countPendingByService();
        } catch (error) {
            console.error('Error counting pending requests by service:', error);
            throw new Error('Unable to count pending requests by service: ' + error.message);
        }
    }
}

export default TestRequest; 