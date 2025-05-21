import Doctor from '../../models/Doctor.js';
import TestRequestDAO from '../../dao/TestRequestDAO.js';
import ServiceDAO from '../../dao/ServiceDAO.js';
import TestResultDAO from '../../dao/TestResultDAO.js';
import PatientDAO from '../../dao/PatientDAO.js';

export default {
    async findAll() {
        try {
            return await TestRequestDAO.findAll();
        } catch (error) {
            console.error('Error fetching test requests:', error);
            throw new Error('Unable to load test requests: ' + error.message);
        }
    },

    async findById(requestId) {
        try {
            const result = await TestRequestDAO.findById(requestId);
            return result || null;
        } catch (error) {
            console.error(`Error fetching test request with ID ${requestId}:`, error);
            throw new Error('Unable to find test request: ' + error.message);
        }
    },

    async findByAppointment(appointmentId) {
        try {
            return await TestRequestDAO.findByAppointment(appointmentId);
        } catch (error) {
            console.error(`Error fetching test requests for appointment ID ${appointmentId}:`, error);
            throw new Error('Unable to find test requests by appointment: ' + error.message);
        }
    },

    async findByStatus(status) {
        try {
            return await TestRequestDAO.findByStatus(status);
        } catch (error) {
            console.error(`Error fetching test requests with status ${status}:`, error);
            throw new Error('Unable to find test requests by status: ' + error.message);
        }
    },

    async add(testRequest) {
        try {
            // Validate doctor if provided
            if (testRequest.requestedByDoctorId) {
                const doctor = await Doctor.findById(testRequest.requestedByDoctorId);
                if (!doctor) {
                    throw new Error(`Doctor with ID ${testRequest.requestedByDoctorId} not found`);
                }
            }
            
            // Convert testServiceId to serviceId if needed
            if (testRequest.testServiceId && !testRequest.serviceId) {
                testRequest.serviceId = testRequest.testServiceId;
                delete testRequest.testServiceId;
            }
            
            return await TestRequestDAO.add(testRequest);
        } catch (error) {
            console.error('Error adding test request:', error);
            throw new Error('Unable to add test request: ' + error.message);
        }
    },

    async update(requestId, testRequest) {
        try {
            // Validate test request exists
            const existingRequest = await TestRequestDAO.findById(requestId);
            if (!existingRequest) {
                throw new Error(`Test request with ID ${requestId} not found`);
            }
            
            // Validate doctor if changed
            if (testRequest.requestedByDoctorId && 
                testRequest.requestedByDoctorId !== existingRequest.requestedByDoctorId) {
                const doctor = await Doctor.findById(testRequest.requestedByDoctorId);
                if (!doctor) {
                    throw new Error(`Doctor with ID ${testRequest.requestedByDoctorId} not found`);
                }
            }
            
            // Convert testServiceId to serviceId if needed
            if (testRequest.testServiceId && !testRequest.serviceId) {
                testRequest.serviceId = testRequest.testServiceId;
                delete testRequest.testServiceId;
            }
            
            return await TestRequestDAO.update(requestId, testRequest);
        } catch (error) {
            console.error(`Error updating test request with ID ${requestId}:`, error);
            throw new Error('Unable to update test request: ' + error.message);
        }
    },

    async updateStatus(requestId, status) {
        try {
            // Validate test request exists
            const existingRequest = await TestRequestDAO.findById(requestId);
            if (!existingRequest) {
                throw new Error(`Test request with ID ${requestId} not found`);
            }
            
            return await TestRequestDAO.updateStatus(requestId, status);
        } catch (error) {
            console.error(`Error updating status for test request with ID ${requestId}:`, error);
            throw new Error('Unable to update test request status: ' + error.message);
        }
    },

    async delete(requestId) {
        try {
            // First check if there are any test results linked to this request
            const testResults = await TestResultDAO.countByRequestId(requestId);
            
            if (testResults > 0) {
                throw new Error('Cannot delete request with linked test results. Please delete the results first.');
            }
            
            return await TestRequestDAO.delete(requestId);
        } catch (error) {
            console.error(`Error deleting test request with ID ${requestId}:`, error);
            throw new Error(error.message || 'Unable to delete test request');
        }
    },

    async countByStatus() {
        try {
            return await TestRequestDAO.countByStatus();
        } catch (error) {
            console.error('Error counting test requests by status:', error);
            throw new Error('Unable to count test requests by status: ' + error.message);
        }
    },

    async countByDoctor() {
        try {
            return await TestRequestDAO.countByDoctor();
        } catch (error) {
            console.error('Error counting test requests by doctor:', error);
            throw new Error('Unable to count test requests by doctor: ' + error.message);
        }
    },

    async getPendingRequestsByService() {
        try {
            return await TestRequestDAO.countPendingByService();
        } catch (error) {
            console.error('Error counting pending requests by service:', error);
            throw new Error('Unable to count pending requests by service: ' + error.message);
        }
    },

    /**
     * Lấy tất cả các test đang hoạt động, nhóm theo category
     * @returns {Promise<Object>} - { category: [service, ...], ... }
     */
    async getAllActiveTestsByCategory() {
        try {
            // Get all active services of type 'test'
            const tests = await ServiceDAO.findActiveByType('test');
            
            // Nhóm theo category
            const grouped = {};
            for (const test of tests) {
                if (!grouped[test.category]) grouped[test.category] = [];
                grouped[test.category].push(test);
            }
            return grouped;
        } catch (error) {
            console.error('Error fetching active tests by category:', error);
            throw new Error('Unable to load active tests: ' + error.message);
        }
    }
}; 