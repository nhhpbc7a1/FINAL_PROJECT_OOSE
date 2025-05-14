import db from '../../ultis/db.js';
import moment from 'moment';

// Helper function to build the query with filters
const buildQuery = (query, filters) => {
    if (filters.search) {
        query.where(function() {
            this.where('PatientUser.fullName', 'like', `%${filters.search}%`)
                .orWhere('TestRequest.requestId', 'like', `%${filters.search}%`);
        });
    }
    
    if (filters.testType) {
        query.where('Service.serviceId', filters.testType);
    }
    
    if (filters.status) {
        query.where('TestRequest.status', filters.status);
    }
    
    if (filters.dateFrom) {
        query.where('TestRequest.requestDate', '>=', filters.dateFrom);
    }
    
    if (filters.dateTo) {
        query.where('TestRequest.requestDate', '<=', filters.dateTo);
    }
    
    return query;
};

export default {
    /**
     * Get all test requests with pagination and filtering
     * @param {Object} filters - Filter criteria
     * @param {number} technicianId - The lab technician ID
     * @param {number} specialtyId - The specialty ID of the lab technician
     * @param {number} page - Page number
     * @param {number} limit - Number of items per page
     * @returns {Object} Test requests and pagination data
     */
    async getAll(filters, technicianId, specialtyId, page = 1, limit = 10) {
        try {
            const offset = (page - 1) * limit;
            
            // Build the base query
            let query = db('TestRequest')
                .select(
                    'TestRequest.requestId',
                    'TestRequest.requestDate',
                    'TestRequest.status',
                    'TestRequest.notes',
                    'Service.name as testName',
                    'Service.serviceId',
                    'Doctor.doctorId',
                    'DoctorUser.fullName as doctorName',
                    'Patient.patientId',
                    'PatientUser.fullName as patientName',
                    'Appointment.appointmentId',
                    'Specialty.name as specialtyName',
                )
                .join('Service', 'TestRequest.serviceId', 'Service.serviceId')
                .join('Doctor', 'TestRequest.requestedByDoctorId', 'Doctor.doctorId')
                .join('User as DoctorUser', 'Doctor.userId', 'DoctorUser.userId')
                .join('Appointment', 'TestRequest.appointmentId', 'Appointment.appointmentId')
                .join('Patient', 'Appointment.patientId', 'Patient.patientId')
                .join('User as PatientUser', 'Patient.userId', 'PatientUser.userId')
                .join('Specialty', 'Service.specialtyId', 'Specialty.specialtyId')
                .orderBy('TestRequest.requestDate', 'desc');
            
            // Apply filters if present
            query = buildQuery(query, filters);
            
            console.log(specialtyId);
            
            // If the lab technician has a specialty, filter by that
            if (specialtyId) {
                query.where(function() {
                    this.where('Specialty.specialtyId', specialtyId);
                });
            }
            
            // Count total records for pagination after filtering
            const countQuery = buildQuery(
                db('TestRequest')
                    .count('* as total')
                    .join('Service', 'TestRequest.serviceId', 'Service.serviceId')
                    .join('Doctor', 'TestRequest.requestedByDoctorId', 'Doctor.doctorId')
                    .join('User as DoctorUser', 'Doctor.userId', 'DoctorUser.userId')
                    .join('Appointment', 'TestRequest.appointmentId', 'Appointment.appointmentId')
                    .join('Patient', 'Appointment.patientId', 'Patient.patientId')
                    .join('User as PatientUser', 'Patient.userId', 'PatientUser.userId')
                    .join('Specialty', 'Service.specialtyId', 'Specialty.specialtyId'),
                filters
            );
            
            // If the lab technician has a specialty, apply that filter to the count query too
            if (specialtyId) {
                countQuery.where(function() {
                    this.where('Specialty.specialtyId', specialtyId)
                });
            }
            
            const [totalResults] = await countQuery;
            const total = totalResults ? totalResults.total : 0;
            
            // Apply pagination to the main query
            query.limit(limit).offset(offset);
            
            // Execute the query
            const testRequests = await query;
            
            // Format the data for display
            const formattedRequests = testRequests.map(request => {
                // Map status to a CSS class for styling
                let statusClass = 'pending';
                switch (request.status) {
                    case 'completed':
                        statusClass = 'completed';
                        break;
                    case 'in_progress':
                        statusClass = 'in_progress';
                        break;
                    case 'cancelled':
                        statusClass = 'cancelled';
                        break;
                    default:
                        statusClass = 'pending';
                }
                
                return {
                    ...request,
                    statusClass
                };
            });
            
            // Prepare pagination data
            const totalPages = Math.ceil(total / limit);
            let pagination = null;
            
            if (totalPages > 1) {
                pagination = {
                    currentPage: page,
                    totalPages,
                    hasNextPage: page < totalPages,
                    hasPrevPage: page > 1,
                    nextPage: page + 1,
                    prevPage: page - 1,
                    pages: []
                };
                
                // Generate an array of page numbers to display
                const startPage = Math.max(1, page - 2);
                const endPage = Math.min(totalPages, page + 2);
                
                for (let i = startPage; i <= endPage; i++) {
                    pagination.pages.push(i);
                }
            }
            
            return {
                testRequests: formattedRequests,
                pagination,
                total
            };
        } catch (error) {
            console.error('Error getting test requests:', error);
            throw new Error('Failed to load test requests');
        }
    },
    
    /**
     * Get test request by ID
     * @param {number} requestId - The test request ID
     * @returns {Object} Test request details
     */
    async getById(requestId) {
        try {
            // Get detailed information about the test request
            const testRequest = await db('TestRequest')
                .select(
                    'TestRequest.*',
                    'Service.name as testName',
                    'Service.description as testDescription',
                    'Doctor.doctorId',
                    'DoctorUser.fullName as doctorName',
                    'Patient.patientId',
                    'PatientUser.fullName as patientName',
                    'PatientUser.email as patientEmail',
                    'PatientUser.phoneNumber as patientPhone',
                    'Patient.dob as patientDob',
                    'Patient.gender as patientGender',
                    'Appointment.appointmentId',
                    'Appointment.appointmentDate',
                    'Specialty.name as specialtyName',
                    'Specialty.specialtyId'
                )
                .join('Service', 'TestRequest.serviceId', 'Service.serviceId')
                .join('Doctor', 'TestRequest.requestedByDoctorId', 'Doctor.doctorId')
                .join('User as DoctorUser', 'Doctor.userId', 'DoctorUser.userId')
                .join('Appointment', 'TestRequest.appointmentId', 'Appointment.appointmentId')
                .join('Patient', 'Appointment.patientId', 'Patient.patientId')
                .join('User as PatientUser', 'Patient.userId', 'PatientUser.userId')
                .join('Specialty', 'Service.specialtyId', 'Specialty.specialtyId')
                .where('TestRequest.requestId', requestId)
                .first();
            
            return testRequest;
        } catch (error) {
            console.error(`Error getting test request with ID ${requestId}:`, error);
            throw new Error('Failed to load test request details');
        }
    },
    
    /**
     * Get test result for a request
     * @param {number} requestId - The test request ID
     * @returns {Object} Test result details
     */
    async getTestResult(requestId) {
        try {
            const testResult = await db('TestResult')
                .where('requestId', requestId)
                .first();
            
            return testResult;
        } catch (error) {
            console.error(`Error getting test result for request ${requestId}:`, error);
            throw new Error('Failed to load test result details');
        }
    },
    
    /**
     * Start processing a test request
     * @param {number} requestId - The test request ID
     * @param {number} technicianId - The lab technician ID
     * @returns {boolean} Success status
     */
    async startProcessing(requestId, technicianId) {
        try {
            // Verify the test request exists and is in pending status
            const testRequest = await db('TestRequest')
                .where('requestId', requestId)
                .where('status', 'pending')
                .first();
            
            if (!testRequest) {
                throw new Error('Test request not found or cannot be started');
            }
            
            // Begin a transaction
            await db.transaction(async trx => {
                // Update test request status
                await trx('TestRequest')
                    .where('requestId', requestId)
                    .update({
                        status: 'in_progress'
                    });
                
                // Create a new test result record with in_progress status
                await trx('TestResult').insert({
                    requestId: requestId,
                    appointmentId: testRequest.appointmentId,
                    serviceId: testRequest.serviceId,
                    technicianId: technicianId,
                    status: 'in_progress',
                    resultType: 'pending', // Will be updated when results are entered
                    performedDate: new Date()
                });
            });
            
            return true;
        } catch (error) {
            console.error(`Error starting test processing for request ${requestId}:`, error);
            throw new Error('Failed to start test processing');
        }
    },
    
    /**
     * Get test types for dropdown
     * @returns {Array} List of test types
     */
    async getTestTypes() {
        try {
            return await db('Service')
                .select('serviceId', 'name')
                .where('type', 'test')
                .orderBy('name');
        } catch (error) {
            console.error('Error getting test types:', error);
            throw new Error('Failed to load test types');
        }
    },
    async getTestTypesBySpecialty(id) {
        try {
            return await db('Service')
                .select('serviceId', 'name')
                .where('type', 'test')
                .where('specialtyId', id)
                .orderBy('name');
        } catch (error) {
            console.error('Error getting test types:', error);
            throw new Error('Failed to load test types');
        }
    }

}; 