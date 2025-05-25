import TestRequestDAO from '../dao/TestRequestDAO.js';

/**
<<<<<<< HEAD
 * TestRequest model representing a test request in the system
=======
 * TestRequest Model Class
 * Represents a test request in the system
>>>>>>> 1b35a7e990adc481ac2b9f5ec39584dd701f494e
 */
class TestRequest {
    /**
     * Create a new TestRequest instance
<<<<<<< HEAD
     * @param {Object} data - Test request data
     */
    constructor(data = {}) {
        // Các trường từ bảng TestRequest
        this.requestId = data.requestId || null;
        this.appointmentId = data.appointmentId || null;
        this.serviceId = data.serviceId || null;
        this.requestDate = data.requestDate || null;
        this.status = data.status || 'pending';
        this.notes = data.notes || null;
        this.requestedByDoctorId = data.requestedByDoctorId || data.doctorId || null;
        this.priority = data.priority || 'normal';
        this.instructions = data.instructions || null;

        // Trường cho quan hệ với medical record
        this.recordId = data.recordId || null;
        
        // Các trường từ join bảng
        this.serviceName = data.serviceName || null;
        this.serviceType = data.serviceType || null;
        this.patientId = data.patientId || null;
        this.patientName = data.patientName || null;
        this.patientDob = data.patientDob || null;
        this.patientGender = data.patientGender || null;
        this.doctorName = data.doctorName || null;
        this.appointmentDate = data.appointmentDate || null;
    }

    /**
     * Save the test request (create or update)
     * @returns {Promise<number>} Request ID
     */
    async save() {
        try {
            if (this.requestId) {
                // Update existing test request
                const testRequestData = {
                    appointmentId: this.appointmentId,
                    recordId: this.recordId,
                    serviceId: this.serviceId,
                    requestedByDoctorId: this.requestedByDoctorId,
                    instructions: this.instructions,
                    requestDate: this.requestDate,
                    status: this.status,
                    priority: this.priority,
                    notes: this.notes
                };
                
                await TestRequestDAO.update(this.requestId, testRequestData);
                return this.requestId;
            } else {
                // Create new test request
                const testRequestData = {
                    appointmentId: this.appointmentId,
                    recordId: this.recordId,
                    serviceId: this.serviceId,
                    requestedByDoctorId: this.requestedByDoctorId,
                    instructions: this.instructions,
                    requestDate: this.requestDate || new Date(),
                    status: this.status,
                    priority: this.priority,
                    notes: this.notes
                };
                
                this.requestId = await TestRequestDAO.add(testRequestData);
=======
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
>>>>>>> 1b35a7e990adc481ac2b9f5ec39584dd701f494e
                return this.requestId;
            }
        } catch (error) {
            console.error('Error saving test request:', error);
            throw new Error('Failed to save test request: ' + error.message);
        }
    }

    /**
     * Delete the test request
<<<<<<< HEAD
     * @returns {Promise<boolean>} True if successful
=======
     * @returns {Promise<boolean>} Success status
>>>>>>> 1b35a7e990adc481ac2b9f5ec39584dd701f494e
     */
    async delete() {
        try {
            if (!this.requestId) {
<<<<<<< HEAD
                throw new Error('Cannot delete an unsaved test request');
=======
                throw new Error('Cannot delete unsaved test request');
>>>>>>> 1b35a7e990adc481ac2b9f5ec39584dd701f494e
            }
            
            return await TestRequestDAO.delete(this.requestId);
        } catch (error) {
            console.error('Error deleting test request:', error);
            throw new Error('Failed to delete test request: ' + error.message);
        }
    }

    /**
<<<<<<< HEAD
     * Start processing the test request
     * @param {number} technicianId - Lab technician ID
     * @returns {Promise<number>} Test result ID
     */
    async startProcessing(technicianId) {
        try {
            if (!this.requestId) {
                throw new Error('Cannot start processing an unsaved test request');
            }
            
            // Update status to in_progress
            this.status = 'in_progress';
            await TestRequestDAO.updateStatus(this.requestId, 'in_progress');
            
            // Create a test result
            const resultId = await TestRequestDAO.createTestResult(this.requestId, technicianId);
            return resultId;
        } catch (error) {
            console.error('Error starting test processing:', error);
            throw new Error('Failed to start test processing: ' + error.message);
        }
    }

    /**
     * Find all test requests
     * @returns {Promise<TestRequest[]>} Array of test requests
     */
    static async findAll() {
        try {
            const testRequests = await TestRequestDAO.findAll();
            return testRequests.map(request => new TestRequest(request));
        } catch (error) {
            console.error('Error finding all test requests:', error);
            throw new Error('Failed to find all test requests: ' + error.message);
=======
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
>>>>>>> 1b35a7e990adc481ac2b9f5ec39584dd701f494e
        }
    }

    /**
<<<<<<< HEAD
     * Find test request by ID with all details
     * @param {number} requestId - Request ID
     * @returns {Promise<TestRequest|null>} Test request or null
     */
    static async findById(requestId) {
        try {
            const testRequest = await TestRequestDAO.findById(requestId);
            return testRequest ? new TestRequest(testRequest) : null;
        } catch (error) {
            console.error(`Error finding test request with ID ${requestId}:`, error);
            throw new Error('Failed to find test request: ' + error.message);
=======
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
>>>>>>> 1b35a7e990adc481ac2b9f5ec39584dd701f494e
        }
    }

    /**
<<<<<<< HEAD
     * Get all test requests with filtering and pagination
     * @param {Object} filters - Filter criteria
     * @param {number} technicianId - Lab technician ID (optional)
     * @param {number} specialtyId - Specialty ID (optional)
     * @param {number} page - Page number
     * @param {number} limit - Results per page
     * @returns {Promise<Object>} Object with test requests, pagination info, and total count
     */
    static async getAll(filters, technicianId = null, specialtyId = null, page = 1, limit = 10) {
        try {
            const { testRequests, total } = await TestRequestDAO.getAll(
                filters, 
                technicianId, 
                specialtyId, 
                page, 
                limit
            );
            
            // Calculate pagination
            const pagination = {
                page,
                limit,
                totalPages: Math.ceil(total / limit),
                hasNext: page < Math.ceil(total / limit),
                hasPrev: page > 1
            };
            
            return {
                testRequests: testRequests.map(request => new TestRequest(request)),
                pagination,
                total
            };
        } catch (error) {
            console.error('Error getting all test requests with filters:', error);
            throw new Error('Failed to get test requests: ' + error.message);
        }
    }

    /**
     * Get test types by specialty
     * @param {number} specialtyId - Specialty ID
     * @returns {Promise<Array>} Array of test types
     */
    static async getTestTypesBySpecialty(specialtyId) {
        try {
            return await TestRequestDAO.getTestTypesBySpecialty(specialtyId);
        } catch (error) {
            console.error(`Error getting test types for specialty ${specialtyId}:`, error);
            throw new Error('Failed to get test types: ' + error.message);
        }
    }

    /**
     * Get test result for a request
     * @param {number} requestId - Request ID
     * @returns {Promise<Object|null>} Test result or null
     */
    static async getTestResult(requestId) {
        try {
            return await TestRequestDAO.getTestResult(requestId);
        } catch (error) {
            console.error(`Error getting test result for request ${requestId}:`, error);
            throw new Error('Failed to get test result: ' + error.message);
        }
    }
    
    /**
     * Get recent test requests by specialty
     * @param {number} specialtyId - Specialty ID
     * @param {number} limit - Number of requests to retrieve
     * @returns {Promise<TestRequest[]>} Array of recent test requests
     */
    static async getRecentBySpecialty(specialtyId, limit = 5) {
        try {
            const requests = await TestRequestDAO.getRecentBySpecialty(specialtyId, limit);
            return requests.map(request => new TestRequest(request));
        } catch (error) {
            console.error(`Error getting recent test requests for specialty ${specialtyId}:`, error);
            throw new Error('Failed to get recent test requests: ' + error.message);
=======
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
>>>>>>> 1b35a7e990adc481ac2b9f5ec39584dd701f494e
        }
    }
}

export default TestRequest; 