import db from '../ultis/db.js';

/**
 * Data Access Object for TestRequest-related database operations
 */
class TestRequestDAO {
    /**
     * Find all test requests with detailed information
     * @returns {Promise<Array>} List of all test requests
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
                    'Service.type as serviceType', // Kept from file 2
                    'PatientUser.fullName as patientName',
                    'Patient.patientId', // Kept from file 2
                    'Patient.gender as patientGender', // Kept from file 2
                    'Patient.dob as patientDob', // Kept from file 2
                    'DoctorUser.fullName as doctorName',
                    'Appointment.appointmentTime as appointmentDate' // Kept from file 2
                )
                .orderBy('TestRequest.requestDate', 'desc');
        } catch (error) {
            console.error('Error retrieving all test requests:', error);
            throw new Error('Unable to load test requests');
        }
    }

    /**
     * Find a test request by its ID with detailed information
     * @param {number} requestId - ID of the test request to find
     * @returns {Promise<Object|null>} The test request or null if not found
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
                    'Service.type as serviceType', // Kept from file 2
                    'Service.description as serviceDescription', // Kept from file 2
                    'PatientUser.fullName as patientName',
                    'Patient.patientId', // Kept from file 2
                    'Patient.gender as patientGender', // Kept from file 2
                    'Patient.dob as patientDob', // Kept from file 2
                    'DoctorUser.fullName as doctorName',
                    'Appointment.appointmentTime as appointmentDate' // Kept from file 2
                )
                .where('TestRequest.requestId', requestId)
                .first();

            return testRequest || null;
        } catch (error) {
            console.error(`Error retrieving test request with ID ${requestId}:`, error);
            throw new Error('Unable to find test request');
        }
    }

    /**
     * Find all test requests for a specific appointment
     * @param {number} appointmentId - ID of the appointment
     * @returns {Promise<Array>} List of test requests for the appointment
     */
    static async findByAppointment(appointmentId) {
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
                .where('TestRequest.appointmentId', appointmentId)
                .orderBy('TestRequest.requestDate', 'desc');
        } catch (error) {
            console.error(`Error retrieving test requests for appointment ID ${appointmentId}:`, error);
            throw new Error('Unable to load test requests for appointment');
        }
    }

    /**
     * Find test requests by their status
     * @param {string} status - Status value to search for
     * @returns {Promise<Array>} List of test requests with the given status
     */
    static async findByStatus(status) {
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
                .where('TestRequest.status', status)
                .orderBy('TestRequest.requestDate', 'desc');
        } catch (error) {
            console.error(`Error retrieving test requests with status ${status}:`, error);
            throw new Error('Unable to load test requests by status');
        }
    }

    /**
     * Get all test requests with filtering and pagination
     * @param {Object} filters - Filter criteria { search, testType, status, dateFrom, dateTo }
     * @param {number} [specialtyId=null] - Specialty ID (optional)
     * @param {number} [page=1] - Page number
     * @param {number} [limit=10] - Results per page
     * @returns {Promise<Object>} Object with test requests and total count
     */
    static async getAll(filters = {}, specialtyId = null, page = 1, limit = 10) {
        try {
            const offset = (page - 1) * limit;

            let query = db('TestRequest')
                .join('Service', 'TestRequest.serviceId', '=', 'Service.serviceId')
                .join('Appointment', 'TestRequest.appointmentId', '=', 'Appointment.appointmentId')
                .join('Patient', 'Appointment.patientId', '=', 'Patient.patientId')
                .join('User AS PatientUser', 'Patient.userId', '=', 'PatientUser.userId')
                .leftJoin('Doctor', 'TestRequest.requestedByDoctorId', '=', 'Doctor.doctorId')
                .leftJoin('User AS DoctorUser', 'Doctor.userId', '=', 'DoctorUser.userId');

            if (specialtyId) {
                query = query.where('Service.specialtyId', specialtyId);
            }

            if (filters.search) {
                query = query.where(function() {
                    this.where('PatientUser.fullName', 'like', `%${filters.search}%`)
                        .orWhere('Service.name', 'like', `%${filters.search}%`);
                });
            }
            if (filters.testType) { // Assuming testType is serviceId
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

            const countQuery = query.clone();
            const totalResults = await countQuery.count('TestRequest.requestId as count').first();
            const total = totalResults.count || 0;

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
     * Add a new test request
     * @param {Object} testRequestData - Test request data
     * @param {number} testRequestData.appointmentId
     * @param {number} testRequestData.requestedByDoctorId
     * @param {number} testRequestData.serviceId
     * @param {Date} [testRequestData.requestDate=new Date()]
     * @param {string} [testRequestData.status='pending']
     * @param {string} [testRequestData.notes]
     * @param {number} [testRequestData.recordId] - Optional medical record ID
     * @returns {Promise<number>} ID of the created test request
     */
    static async add(testRequestData) {
        try {
            const {
                appointmentId,
                requestedByDoctorId,
                serviceId,
                requestDate = new Date(),
                status = 'pending', // Default status
                notes,
                recordId // Added from file 2's createTestResult logic
            } = testRequestData;

            const [requestId] = await db('TestRequest').insert({
                appointmentId,
                requestedByDoctorId,
                serviceId,
                requestDate,
                status,
                notes,
                recordId // Ensure this column exists in your TestRequest table
            });

            return requestId;
        } catch (error) {
            console.error('Error adding test request:', error);
            throw new Error('Unable to add test request');
        }
    }

    /**
     * Update a test request
     * @param {number} requestId - ID of the test request to update
     * @param {Object} testRequestData - Updated test request data
     * @returns {Promise<boolean>} Success status
     */
    static async update(requestId, testRequestData) {
        try {
            // Destructure only the fields that are allowed to be updated
            // Or pass testRequestData directly if all fields are updatable
            const {
                appointmentId,
                requestedByDoctorId,
                serviceId,
                requestDate,
                status,
                notes,
                recordId
            } = testRequestData;

            const updateData = {};
            if (appointmentId !== undefined) updateData.appointmentId = appointmentId;
            if (requestedByDoctorId !== undefined) updateData.requestedByDoctorId = requestedByDoctorId;
            if (serviceId !== undefined) updateData.serviceId = serviceId;
            if (requestDate !== undefined) updateData.requestDate = requestDate;
            if (status !== undefined) updateData.status = status;
            if (notes !== undefined) updateData.notes = notes;
            if (recordId !== undefined) updateData.recordId = recordId;


            if (Object.keys(updateData).length === 0) {
                return false; // No data to update
            }

            const result = await db('TestRequest')
                .where('requestId', requestId)
                .update(updateData);

            return result > 0;
        } catch (error) {
            console.error(`Error updating test request with ID ${requestId}:`, error);
            throw new Error('Unable to update test request');
        }
    }

    /**
     * Update the status of a test request
     * @param {number} requestId - ID of the test request to update
     * @param {string} status - New status value
     * @returns {Promise<boolean>} Success status
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
     * Delete a test request
     * @param {number} requestId - ID of the test request to delete
     * @returns {Promise<boolean>} Success status
     */
    static async delete(requestId) {
        try {
            // Consider related data: should TestResult be deleted too?
            // For now, just deleting the request.
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
     * Count test requests by status, ordered logically
     * @returns {Promise<Array>} Array of status counts [{ status: 'pending', count: 5 }, ...]
     */
    static async countByStatus() {
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
            throw new Error('Unable to count test requests by status');
        }
    }

    /**
     * Count test requests by doctor
     * @returns {Promise<Array>} Array of doctor counts [{ doctorId, doctorName, count }, ...]
     */
    static async countByDoctor() {
        try {
            return await db('TestRequest')
                .join('Doctor', 'TestRequest.requestedByDoctorId', '=', 'Doctor.doctorId')
                .join('User AS DoctorUser', 'Doctor.userId', '=', 'DoctorUser.userId')
                .select(
                    'Doctor.doctorId',
                    'DoctorUser.fullName AS doctorName'
                )
                .count('TestRequest.requestId as count')
                .groupBy('Doctor.doctorId', 'DoctorUser.fullName')
                .orderBy('count', 'desc');
        } catch (error) {
            console.error('Error counting test requests by doctor:', error);
            throw new Error('Unable to count test requests by doctor');
        }
    }

    /**
     * Count pending test requests by service
     * @returns {Promise<Array>} Array of service counts for pending requests [{ serviceId, serviceName, category, count }, ...]
     */
    static async countPendingByService() {
        try {
            return await db('TestRequest')
                .join('Service', 'TestRequest.serviceId', '=', 'Service.serviceId')
                .select(
                    'Service.serviceId',
                    'Service.name as serviceName',
                    'Service.category as category' // Assuming Service table has a category
                )
                .count('TestRequest.requestId as count')
                .where('TestRequest.status', 'pending')
                .groupBy('Service.serviceId', 'Service.name', 'Service.category')
                .orderBy('count', 'desc');
        } catch (error) {
            console.error('Error counting pending test requests by service:', error);
            throw new Error('Unable to count pending test requests by service');
        }
    }

    /**
     * Get test types (services) by specialty
     * @param {number} specialtyId - Specialty ID
     * @returns {Promise<Array>} List of test types [{ serviceId, name }, ...]
     */
    static async getTestTypesBySpecialty(specialtyId) {
        try {
            return await db('Service')
                .where('specialtyId', specialtyId)
                .andWhere('type', 'test') // Assuming Service table has a 'type' column
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
                .leftJoin('User AS TechnicianUser', 'LabTechnician.userId', '=', 'TechnicianUser.userId') // Aliased User table
                .leftJoin('Room', 'TestResult.roomId', '=', 'Room.roomId')
                .select(
                    'TestResult.*',
                    'TechnicianUser.fullName as technicianName',
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
     * Create a test result for a request
     * @param {number} requestId - Request ID
     * @param {number} technicianId - Lab technician ID
     * @returns {Promise<number>} New test result ID
     */
    static async createTestResult(requestId, technicianId) {
        try {
            const testRequest = await this.findById(requestId);
            if (!testRequest) {
                throw new Error('Test request not found');
            }

            const existingResult = await this.getTestResult(requestId);
            if (existingResult) {
                return existingResult.resultId; // Return existing if already present
            }

            let recordId = testRequest.recordId; // From the TestRequest table itself

            // Fallback: If recordId is not directly on testRequest, try to get from appointment
            if (!recordId && testRequest.appointmentId) {
                try {
                    const appointment = await db('Appointment')
                        .select('recordId') // Assuming Appointment table has 'recordId' linking to MedicalRecord
                        .where('appointmentId', testRequest.appointmentId)
                        .first();

                    if (appointment && appointment.recordId) {
                        recordId = appointment.recordId;
                    } else {
                         console.warn(`No medical recordId found for appointment ${testRequest.appointmentId} linked to test request ${requestId}`);
                    }
                } catch (err) {
                    console.error(`Error fetching medical recordId from appointment ${testRequest.appointmentId}:`, err);
                }
            }


            const resultData = {
                requestId,
                recordId: recordId, // This might be null if not found
                appointmentId: testRequest.appointmentId,
                serviceId: testRequest.serviceId,
                technicianId,
                status: 'in_progress', // Default status for new result
                resultType: 'text', // Default or determine based on service
                reportedDate: db.fn.now()
            };

            const [resultId] = await db('TestResult').insert(resultData);
            // Optionally, update TestRequest status to 'in_progress'
            await this.updateStatus(requestId, 'in_progress');

            return resultId;
        } catch (error) {
            console.error(`Error creating test result for request ID ${requestId}:`, error);
            throw new Error('Unable to create test result');
        }
    }

    /**
     * Get recent test requests by specialty
     * @param {number} specialtyId - Specialty ID
     * @param {number} [limit=5] - Number of requests to retrieve
     * @returns {Promise<Array>} Recent test requests
     */
    static async getRecentBySpecialty(specialtyId, limit = 5) {
        try {
            return await db('TestRequest')
                .join('Service', 'TestRequest.serviceId', '=', 'Service.serviceId')
                .join('Appointment', 'TestRequest.appointmentId', '=', 'Appointment.appointmentId')
                .join('Patient', 'Appointment.patientId', '=', 'Patient.patientId')
                .join('User AS PatientUser', 'Patient.userId', '=', 'PatientUser.userId')
                .leftJoin('Doctor', 'TestRequest.requestedByDoctorId', '=', 'Doctor.doctorId')
                .leftJoin('User AS DoctorUser', 'Doctor.userId', '=', 'DoctorUser.userId')
                .leftJoin('TestResult', 'TestRequest.requestId', '=', 'TestResult.requestId')
                .select(
                    'TestRequest.*',
                    'Service.name as serviceName',
                    'Service.type as serviceType',
                    'PatientUser.fullName as patientName',
                    'DoctorUser.fullName as doctorName',
                    'TestResult.status as resultStatus' // Status of the test result, if any
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