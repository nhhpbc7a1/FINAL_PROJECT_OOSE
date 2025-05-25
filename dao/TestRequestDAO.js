import db from '../ultis/db.js';

/**
 * Data Access Object for TestRequest-related database operations
 */
class TestRequestDAO {
    /**
     * Find all test requests
     * @returns {Promise<Array>} List of test requests
     */
    static async findAll() {
        try {
            return await db('TestRequest')
                .join('Service', 'TestRequest.serviceId', '=', 'Service.serviceId')
                .join('Appointment', 'TestRequest.appointmentId', '=', 'Appointment.appointmentId')
                .join('Patient', 'Appointment.patientId', '=', 'Patient.patientId')
                .join('User AS PatientUser', 'Patient.userId', '=', 'PatientUser.userId')
                .leftJoin('Doctor', 'TestRequest.requestedByDoctorId', '=', 'Doctor.doctorId')
                .leftJoin('User AS DoctorUser', 'Doctor.userId', '=', 'DoctorUser.userId')
                .select(
                    'TestRequest.*',
                    'Service.name as serviceName',
                    'Service.type as serviceType',
                    'PatientUser.fullName as patientName',
                    'Patient.patientId',
                    'Patient.gender as patientGender',
                    'Patient.dob as patientDob',
                    'DoctorUser.fullName as doctorName',
                    'Appointment.appointmentTime as appointmentDate'
                )
                .orderBy('TestRequest.requestDate', 'desc');
        } catch (error) {
            console.error('Error fetching test requests:', error);
            throw new Error('Unable to load test requests');
        }
    }

    /**
     * Find test request by ID
     * @param {number} requestId - Request ID
     * @returns {Promise<Object|null>} Test request object or null if not found
     */
    static async findById(requestId) {
        try {
            const testRequest = await db('TestRequest')
                .join('Service', 'TestRequest.serviceId', '=', 'Service.serviceId')
                .join('Appointment', 'TestRequest.appointmentId', '=', 'Appointment.appointmentId')
                .join('Patient', 'Appointment.patientId', '=', 'Patient.patientId')
                .join('User AS PatientUser', 'Patient.userId', '=', 'PatientUser.userId')
                .leftJoin('Doctor', 'TestRequest.requestedByDoctorId', '=', 'Doctor.doctorId')
                .leftJoin('User AS DoctorUser', 'Doctor.userId', '=', 'DoctorUser.userId')
                .select(
                    'TestRequest.*',
                    'Service.name as serviceName',
                    'Service.type as serviceType',
                    'Service.description as serviceDescription',
                    'PatientUser.fullName as patientName',
                    'Patient.patientId',
                    'Patient.gender as patientGender',
                    'Patient.dob as patientDob',
                    'DoctorUser.fullName as doctorName',
                    'Appointment.appointmentTime as appointmentDate'
                )
                .where('TestRequest.requestId', requestId)
                .first();
            
            return testRequest || null;
        } catch (error) {
            console.error(`Error fetching test request with ID ${requestId}:`, error);
            throw new Error('Unable to find test request');
        }
    }

    /**
     * Get all test requests with filtering and pagination
     * @param {Object} filters - Filter criteria
     * @param {number} technicianId - Lab technician ID (optional)
     * @param {number} specialtyId - Specialty ID (optional)
     * @param {number} page - Page number
     * @param {number} limit - Results per page
     * @returns {Promise<Object>} Object with test requests and total count
     */
    static async getAll(filters, technicianId = null, specialtyId = null, page = 1, limit = 10) {
        try {
            const offset = (page - 1) * limit;
            
            // Start building the query
            let query = db('TestRequest')
                .join('Service', 'TestRequest.serviceId', '=', 'Service.serviceId')
                .join('Appointment', 'TestRequest.appointmentId', '=', 'Appointment.appointmentId')
                .join('Patient', 'Appointment.patientId', '=', 'Patient.patientId')
                .join('User AS PatientUser', 'Patient.userId', '=', 'PatientUser.userId')
                .leftJoin('Doctor', 'TestRequest.requestedByDoctorId', '=', 'Doctor.doctorId')
                .leftJoin('User AS DoctorUser', 'Doctor.userId', '=', 'DoctorUser.userId');
            
            // If specialtyId is provided, filter by specialty
            if (specialtyId) {
                query = query.where('Service.specialtyId', specialtyId);
            }
            
            // Apply filters
            if (filters.search) {
                query = query.where(function() {
                    this.where('PatientUser.fullName', 'like', `%${filters.search}%`)
                        .orWhere('Service.name', 'like', `%${filters.search}%`);
                });
            }
            
            if (filters.testType) {
                query = query.where('Service.serviceId', filters.testType);
            }
            
            if (filters.status) {
                query = query.where('TestRequest.status', filters.status);
            }
            
            if (filters.dateFrom) {
                query = query.where('TestRequest.requestDate', '>=', filters.dateFrom);
            }
            
            if (filters.dateTo) {
                query = query.where('TestRequest.requestDate', '<=', filters.dateTo);
            }
            
            // Get total count
            const countQuery = query.clone();
            const totalResults = await countQuery.count('TestRequest.requestId as count').first();
            const total = totalResults.count;
            
            // Get paginated results
            const testRequests = await query
                .select(
                    'TestRequest.*',
                    'Service.name as serviceName',
                    'Service.type as serviceType',
                    'PatientUser.fullName as patientName',
                    'Patient.patientId',
                    'Patient.gender as patientGender',
                    'Patient.dob as patientDob',
                    'DoctorUser.fullName as doctorName',
                    'Appointment.appointmentTime as appointmentDate'
                )
                .orderBy('TestRequest.requestDate', 'desc')
                .limit(limit)
                .offset(offset);
            
            return { testRequests, total };
        } catch (error) {
            console.error('Error fetching test requests with filters:', error);
            throw new Error('Unable to get test requests with filters');
        }
    }

    /**
     * Get test types by specialty
     * @param {number} specialtyId - Specialty ID
     * @returns {Promise<Array>} List of test types
     */
    static async getTestTypesBySpecialty(specialtyId) {
        try {
            return await db('Service')
                .where('specialtyId', specialtyId)
                .andWhere('type', 'test')
                .select('serviceId', 'name')
                .orderBy('name');
        } catch (error) {
            console.error(`Error fetching test types for specialty ID ${specialtyId}:`, error);
            throw new Error('Unable to get test types by specialty');
        }
    }

    /**
     * Get test result for a request
     * @param {number} requestId - Request ID
     * @returns {Promise<Object|null>} Test result object or null if not found
     */
    static async getTestResult(requestId) {
        try {
            const testResult = await db('TestResult')
                .leftJoin('LabTechnician', 'TestResult.technicianId', '=', 'LabTechnician.technicianId')
                .leftJoin('User', 'LabTechnician.userId', '=', 'User.userId')
                .leftJoin('Room', 'TestResult.roomId', '=', 'Room.roomId')
                .select(
                    'TestResult.*',
                    'User.fullName as technicianName',
                    'Room.roomNumber'
                )
                .where('TestResult.requestId', requestId)
                .first();
            
            return testResult || null;
        } catch (error) {
            console.error(`Error fetching test result for request ID ${requestId}:`, error);
            throw new Error('Unable to get test result for request');
        }
    }

    /**
     * Update test request status
     * @param {number} requestId - Request ID
     * @param {string} status - New status
     * @returns {Promise<boolean>} True if update successful
     */
    static async updateStatus(requestId, status) {
        try {
            const result = await db('TestRequest')
                .where('requestId', requestId)
                .update({ status });
            return result > 0;
        } catch (error) {
            console.error(`Error updating status for test request with ID ${requestId}:`, error);
            throw new Error('Unable to update test request status');
        }
    }

    /**
     * Create a test result for a request
     * @param {number} requestId - Request ID
     * @param {number} technicianId - Lab technician ID
     * @returns {Promise<number>} New test result ID
     */
    static async createTestResult(requestId, technicianId) {
        try {
            // Get the test request details
            const testRequest = await this.findById(requestId);
            if (!testRequest) {
                throw new Error('Test request not found');
            }
            
            // Check if a test result already exists
            const existingResult = await this.getTestResult(requestId);
            if (existingResult) {
                return existingResult.resultId;
            }
            
            // Create a new test result
            let recordId = testRequest.recordId;
            
            // If recordId is not set in test request, try to get it from the appointment
            if (!recordId && testRequest.appointmentId) {
                try {
                    const appointmentRecord = await db('Appointment')
                        .select('recordId')
                        .where('appointmentId', testRequest.appointmentId)
                        .first();
                        
                    if (appointmentRecord && appointmentRecord.medicalRecordId) {
                        recordId = appointmentRecord.medicalRecordId;
                        console.log(`Retrieved recordId ${recordId} from appointment ${testRequest.appointmentId} for test request ${requestId}`);
                    } else {
                        console.log(`No medical record found for appointment ${testRequest.appointmentId}`);
                    }
                } catch (error) {
                    console.error(`Error getting medical record for appointment ${testRequest.appointmentId}:`, error);
                }
            }
            
            const resultData = {
                requestId,
                recordId: recordId,
                appointmentId: testRequest.appointmentId,
                serviceId: testRequest.serviceId,
                technicianId,
                status: 'in_progress',
                resultType: 'text',
                reportedDate: db.fn.now()
            };
            
            console.log(`Creating test result with data:`, resultData);
            const [resultId] = await db('TestResult').insert(resultData);
            return resultId;
        } catch (error) {
            console.error(`Error creating test result for request ID ${requestId}:`, error);
            throw new Error('Unable to create test result');
        }
    }

    /**
     * Add a new test request
     * @param {Object} testRequest - Test request data
     * @returns {Promise<number>} New test request ID
     */
    static async add(testRequest) {
        try {
            const [requestId] = await db('TestRequest').insert(testRequest);
            return requestId;
        } catch (error) {
            console.error('Error adding test request:', error);
            throw new Error('Unable to add test request');
        }
    }

    /**
     * Update a test request
     * @param {number} requestId - Test request ID
     * @param {Object} testRequest - Updated test request data
     * @returns {Promise<boolean>} True if update successful
     */
    static async update(requestId, testRequest) {
        try {
            const result = await db('TestRequest')
                .where('requestId', requestId)
                .update(testRequest);
            return result > 0;
        } catch (error) {
            console.error(`Error updating test request with ID ${requestId}:`, error);
            throw new Error('Unable to update test request');
        }
    }

    /**
     * Delete a test request
     * @param {number} requestId - Test request ID
     * @returns {Promise<boolean>} True if deletion successful
     */
    static async delete(requestId) {
        try {
            const result = await db('TestRequest')
                .where('requestId', requestId)
                .delete();
            return result > 0;
        } catch (error) {
            console.error(`Error deleting test request with ID ${requestId}:`, error);
            throw new Error('Unable to delete test request');
        }
    }

    /**
     * Count test requests by status
     * @returns {Promise<Array>} Count of test requests by status
     */
    static async countByStatus() {
        try {
            return await db('TestRequest')
                .select('status')
                .count('requestId as count')
                .groupBy('status');
        } catch (error) {
            console.error('Error counting test requests by status:', error);
            throw new Error('Unable to count test requests by status');
        }
    }

    /**
     * Get recent test requests by specialty
     * @param {number} specialtyId - Specialty ID
     * @param {number} limit - Number of requests to retrieve
     * @returns {Promise<Array>} Recent test requests
     */
    static async getRecentBySpecialty(specialtyId, limit = 5) {
        try {
            return await db('TestRequest')
                .join('Service', 'TestRequest.serviceId', '=', 'Service.serviceId')
                .join('Appointment', 'TestRequest.appointmentId', '=', 'Appointment.appointmentId')
                .join('Patient', 'Appointment.patientId', '=', 'Patient.patientId')
                .join('User', 'Patient.userId', '=', 'User.userId')
                .leftJoin('Doctor', 'TestRequest.requestedByDoctorId', '=', 'Doctor.doctorId')
                .leftJoin('User AS DoctorUser', 'Doctor.userId', '=', 'DoctorUser.userId')
                .leftJoin('TestResult', 'TestRequest.requestId', '=', 'TestResult.requestId')
                .select(
                    'TestRequest.*',
                    'Service.name as serviceName',
                    'User.fullName as patientName',
                    'DoctorUser.fullName as doctorName',
                    'TestResult.status as resultStatus'
                )
                .where('Service.specialtyId', specialtyId)
                .orderBy('TestRequest.requestDate', 'desc')
                .limit(limit);
        } catch (error) {
            console.error(`Error getting recent test requests for specialty ID ${specialtyId}:`, error);
            throw new Error('Unable to get recent test requests by specialty');
        }
    }
}

export default TestRequestDAO; 