import db from '../ultis/db.js';

/**
 * Data Access Object for test request-related database operations
 */
export default {
    /**
     * Find all test requests
     * @returns {Promise<Array>} List of all test requests
     */
    async findAll() {
        try {
            return await db('TestRequest as tr')
                .leftJoin('Doctor as d', 'tr.requestedByDoctorId', '=', 'd.doctorId')
                .leftJoin('Appointment as a', 'tr.appointmentId', '=', 'a.appointmentId')
                .leftJoin('Patient as p', 'a.patientId', '=', 'p.patientId')
                .leftJoin('Service as s', 'tr.serviceId', '=', 's.serviceId')
                .select(
                    'tr.*',
                    'd.fullName AS doctorName',
                    'p.fullName AS patientName',
                    's.name AS testName'
                )
                .orderBy('tr.requestDate', 'desc');
        } catch (error) {
            console.error('Error retrieving all test requests:', error);
            throw error;
        }
    },
    
    /**
     * Find a test request by its ID
     * @param {number} requestId - ID of the test request to find
     * @returns {Promise<Object|null>} The test request or null if not found
     */
    async findById(requestId) {
        try {
            const result = await db('TestRequest as tr')
                .leftJoin('Doctor as d', 'tr.requestedByDoctorId', '=', 'd.doctorId')
                .leftJoin('Appointment as a', 'tr.appointmentId', '=', 'a.appointmentId')
                .leftJoin('Patient as p', 'a.patientId', '=', 'p.patientId')
                .leftJoin('Service as s', 'tr.serviceId', '=', 's.serviceId')
                .select(
                    'tr.*',
                    'd.fullName AS doctorName',
                    'p.fullName AS patientName',
                    's.name AS testName'
                )
                .where('tr.requestId', requestId)
                .first();
                
            return result || null;
        } catch (error) {
            console.error(`Error retrieving test request with ID ${requestId}:`, error);
            throw error;
        }
    },
    
    /**
     * Find all test requests for a specific appointment
     * @param {number} appointmentId - ID of the appointment
     * @returns {Promise<Array>} List of test requests for the appointment
     */
    async findByAppointment(appointmentId) {
        try {
            return await db('TestRequest as tr')
                .leftJoin('Doctor as d', 'tr.requestedByDoctorId', '=', 'd.doctorId')
                .leftJoin('Appointment as a', 'tr.appointmentId', '=', 'a.appointmentId')
                .leftJoin('Patient as p', 'a.patientId', '=', 'p.patientId')
                .leftJoin('Service as s', 'tr.serviceId', '=', 's.serviceId')
                .select(
                    'tr.*',
                    'd.fullName AS doctorName',
                    'p.fullName AS patientName',
                    's.name AS testName'
                )
                .where('tr.appointmentId', appointmentId)
                .orderBy('tr.requestDate', 'desc');
        } catch (error) {
            console.error(`Error retrieving test requests for appointment ID ${appointmentId}:`, error);
            throw error;
        }
    },
    
    /**
     * Find test requests by their status
     * @param {string} status - Status value to search for
     * @returns {Promise<Array>} List of test requests with the given status
     */
    async findByStatus(status) {
        try {
            return await db('TestRequest as tr')
                .leftJoin('Doctor as d', 'tr.requestedByDoctorId', '=', 'd.doctorId')
                .leftJoin('Appointment as a', 'tr.appointmentId', '=', 'a.appointmentId')
                .leftJoin('Patient as p', 'a.patientId', '=', 'p.patientId')
                .leftJoin('Service as s', 'tr.serviceId', '=', 's.serviceId')
                .select(
                    'tr.*',
                    'd.fullName AS doctorName',
                    'p.fullName AS patientName',
                    's.name AS testName'
                )
                .where('tr.status', status)
                .orderBy('tr.requestDate', 'desc');
        } catch (error) {
            console.error(`Error retrieving test requests with status ${status}:`, error);
            throw error;
        }
    },
    
    /**
     * Add a new test request
     * @param {Object} testRequest - Test request data
     * @returns {Promise<number>} ID of the created test request
     */
    async add(testRequest) {
        try {
            const { 
                appointmentId,
                requestedByDoctorId,
                serviceId,
                requestDate = new Date(),
                status = 'pending',
                notes
            } = testRequest;
            
            const [requestId] = await db('TestRequest').insert({
                appointmentId,
                requestedByDoctorId,
                serviceId,
                requestDate,
                status,
                notes
            });
            
            return requestId;
        } catch (error) {
            console.error('Error adding test request:', error);
            throw error;
        }
    },
    
    /**
     * Update a test request
     * @param {number} requestId - ID of the test request to update
     * @param {Object} testRequest - Updated test request data
     * @returns {Promise<boolean>} Success status
     */
    async update(requestId, testRequest) {
        try {
            const { 
                appointmentId,
                requestedByDoctorId,
                serviceId,
                requestDate,
                status,
                notes
            } = testRequest;
            
            const result = await db('TestRequest')
                .where('requestId', requestId)
                .update({
                    appointmentId,
                    requestedByDoctorId,
                    serviceId,
                    requestDate,
                    status,
                    notes
                });
            
            return result > 0;
        } catch (error) {
            console.error(`Error updating test request with ID ${requestId}:`, error);
            throw error;
        }
    },
    
    /**
     * Update the status of a test request
     * @param {number} requestId - ID of the test request to update
     * @param {string} status - New status value
     * @returns {Promise<boolean>} Success status
     */
    async updateStatus(requestId, status) {
        try {
            const result = await db('TestRequest')
                .where('requestId', requestId)
                .update({ status });
            
            return result > 0;
        } catch (error) {
            console.error(`Error updating status for test request with ID ${requestId}:`, error);
            throw error;
        }
    },
    
    /**
     * Delete a test request
     * @param {number} requestId - ID of the test request to delete
     * @returns {Promise<boolean>} Success status
     */
    async delete(requestId) {
        try {
            const result = await db('TestRequest')
                .where('requestId', requestId)
                .delete();
            
            return result > 0;
        } catch (error) {
            console.error(`Error deleting test request with ID ${requestId}:`, error);
            throw error;
        }
    },
    
    /**
     * Count test requests by status
     * @returns {Promise<Array>} Array of status counts
     */
    async countByStatus() {
        try {
            return await db('TestRequest')
                .select('status')
                .count('requestId as count')
                .groupBy('status')
                .orderByRaw(`
                    CASE 
                        WHEN status = 'pending' THEN 1
                        WHEN status = 'in_progress' THEN 2
                        WHEN status = 'completed' THEN 3
                        WHEN status = 'cancelled' THEN 4
                        ELSE 5
                    END
                `);
        } catch (error) {
            console.error('Error counting test requests by status:', error);
            throw error;
        }
    },
    
    /**
     * Count test requests by doctor
     * @returns {Promise<Array>} Array of doctor counts
     */
    async countByDoctor() {
        try {
            return await db('TestRequest as tr')
                .join('Doctor as d', 'tr.requestedByDoctorId', '=', 'd.doctorId')
                .select(
                    'd.doctorId',
                    'd.fullName AS doctorName'
                )
                .count('tr.requestId as requestCount')
                .groupBy('tr.requestedByDoctorId', 'd.fullName')
                .orderBy('requestCount', 'desc');
        } catch (error) {
            console.error('Error counting test requests by doctor:', error);
            throw error;
        }
    },
    
    /**
     * Count pending test requests by service
     * @returns {Promise<Array>} Array of service counts
     */
    async countPendingByService() {
        try {
            return await db('TestRequest as tr')
                .join('Service as s', 'tr.serviceId', '=', 's.serviceId')
                .select(
                    's.serviceId',
                    's.name as serviceName'
                )
                .count('tr.requestId as pendingCount')
                .where('tr.status', 'pending')
                .groupBy('tr.serviceId', 's.name')
                .orderBy('pendingCount', 'desc');
        } catch (error) {
            console.error('Error counting pending requests by service:', error);
            throw error;
        }
    }
}; 