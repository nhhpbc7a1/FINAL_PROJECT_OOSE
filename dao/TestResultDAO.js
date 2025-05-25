import db from '../ultis/db.js';

/**
<<<<<<< HEAD
 * Data Access Object for TestResult-related database operations
 */
class TestResultDAO {
    /**
     * Find all test results with related information
     * @returns {Promise<Array>} List of test results
     */
    static async findAll() {
        try {
            return await db('TestResult')
                .join('MedicalRecord', 'TestResult.recordId', '=', 'MedicalRecord.recordId')
                .join('Service', 'TestResult.serviceId', '=', 'Service.serviceId')
                .leftJoin('LabTechnician', 'TestResult.technicianId', '=', 'LabTechnician.technicianId')
                .leftJoin('User', 'LabTechnician.userId', '=', 'User.userId')
                .leftJoin('Room', 'TestResult.roomId', '=', 'Room.roomId')
                .leftJoin('File', 'TestResult.resultFileId', '=', 'File.fileId')
                .select(
                    'TestResult.*',
                    'Service.name as serviceName',
                    'Service.type as serviceType',
                    'User.fullName as technicianName',
                    'Room.roomNumber',
                    'File.fileName',
                    'File.filePath'
                )
                .orderBy('TestResult.performedDate', 'desc');
        } catch (error) {
            console.error('Error fetching test results:', error);
            throw new Error('Unable to load test results');
        }
    }

    /**
     * Find test result by ID with all related information
     * @param {number} resultId - Result ID
     * @returns {Promise<Object|null>} Test result object or null if not found
     */
    static async findById(resultId) {
        try {
            const result = await db('TestResult')
                .join('TestRequest', 'TestResult.requestId', 'TestRequest.requestId')
                .join('Appointment', 'TestRequest.appointmentId', 'Appointment.appointmentId')
                .join('Patient', 'Appointment.patientId', 'Patient.patientId')
                .join('User as PatientUser', 'Patient.userId', 'PatientUser.userId')
                .join('Service', 'TestRequest.serviceId', 'Service.serviceId')
                .leftJoin('Room', 'TestResult.roomId', 'Room.roomId')
                .leftJoin('LabTechnician', 'TestResult.technicianId', 'LabTechnician.technicianId')
                .leftJoin('User as TechUser', 'LabTechnician.userId', 'TechUser.userId')
                .leftJoin('File', 'TestResult.resultFileId', 'File.fileId')
                .select(
                    'TestResult.*',
                    'Service.name as testName',
                    'Service.description as testDescription',
                    'PatientUser.fullName as patientName',
                    'Patient.patientId',
                    'Patient.gender',
                    'Patient.dob as dateOfBirth',
                    'Room.roomNumber',
                    'Room.roomType',
                    'TechUser.fullName as technicianName',
                    'File.fileName',
                    'File.filePath',
                    'File.fileType'
                )
                .where('TestResult.resultId', resultId)
                .first();
            
            return result || null;
        } catch (error) {
            console.error(`Error fetching test result with ID ${resultId}:`, error);
            throw new Error('Unable to find test result');
        }
    }

    /**
     * Find test results by medical record
     * @param {number} recordId - Medical record ID
     * @returns {Promise<Array>} List of test results for the medical record
     */
    static async findByMedicalRecord(recordId) {
        try {
            return await db('TestResult')
                .join('Service', 'TestResult.serviceId', '=', 'Service.serviceId')
                .leftJoin('LabTechnician', 'TestResult.technicianId', '=', 'LabTechnician.technicianId')
                .leftJoin('User', 'LabTechnician.userId', '=', 'User.userId')
                .leftJoin('Room', 'TestResult.roomId', '=', 'Room.roomId')
                .leftJoin('File', 'TestResult.resultFileId', '=', 'File.fileId')
                .select(
                    'TestResult.*',
                    'Service.name as serviceName',
                    'Service.type as serviceType',
                    'User.fullName as technicianName',
                    'Room.roomNumber',
                    'File.fileName',
                    'File.filePath'
                )
                .where('TestResult.recordId', recordId)
                .orderBy('TestResult.performedDate', 'desc');
        } catch (error) {
            console.error(`Error fetching test results for medical record ID ${recordId}:`, error);
            throw new Error('Unable to find test results by medical record');
        }
    }

    /**
     * Find test results by lab technician
     * @param {number} technicianId - Lab technician ID
     * @returns {Promise<Array>} List of test results for the lab technician
     */
    static async findByTechnician(technicianId) {
        try {
            return await db('TestResult')
                .join('Service', 'TestResult.serviceId', '=', 'Service.serviceId')
                .leftJoin('Room', 'TestResult.roomId', '=', 'Room.roomId')
                .leftJoin('File', 'TestResult.resultFileId', '=', 'File.fileId')
                .select(
                    'TestResult.*',
                    'Service.name as serviceName',
                    'Service.type as serviceType',
                    'Room.roomNumber',
                    'File.fileName',
                    'File.filePath'
                )
                .where('TestResult.technicianId', technicianId)
                .orderBy('TestResult.performedDate', 'desc');
        } catch (error) {
            console.error(`Error fetching test results for technician ID ${technicianId}:`, error);
            throw new Error('Unable to find test results by technician');
        }
    }

    /**
     * Get recent test results by technician
     * @param {number} technicianId - Lab technician ID
     * @param {number} limit - Number of results to return
     * @returns {Promise<Array>} List of recent test results
     */
    static async getRecentByTechnician(technicianId, limit = 5) {
        try {
            return await db('TestResult')
                .join('Service', 'TestResult.serviceId', '=', 'Service.serviceId')
                .leftJoin('TestRequest', 'TestResult.requestId', '=', 'TestRequest.requestId')
                .leftJoin('Appointment', 'TestRequest.appointmentId', '=', 'Appointment.appointmentId')
                .leftJoin('Patient', 'Appointment.patientId', '=', 'Patient.patientId')
                .leftJoin('User', 'Patient.userId', '=', 'User.userId')
                .select(
                    'TestResult.*',
                    'Service.name as serviceName',
                    'User.fullName as patientName'
                )
                .where('TestResult.technicianId', technicianId)
                .orderBy('TestResult.performedDate', 'desc')
                .limit(limit);
        } catch (error) {
            console.error(`Error fetching recent test results for technician ID ${technicianId}:`, error);
            throw new Error('Unable to get recent test results');
        }
    }

    /**
     * Get all test results with filtering and pagination
     * @param {Object} filters - Filter criteria
     * @param {number} technicianId - Lab technician ID
     * @param {number} page - Page number
     * @param {number} limit - Results per page
     * @returns {Promise<Object>} Object with test results and total count
     */
    static async getAll(filters, technicianId, page = 1, limit = 10) {
        try {
            const offset = (page - 1) * limit;
            
            // Start building the query
            let query = db('TestResult')
                .join('TestRequest', 'TestResult.requestId', '=', 'TestRequest.requestId')
                .join('Appointment', 'TestRequest.appointmentId', '=', 'Appointment.appointmentId')
                .join('Patient', 'Appointment.patientId', '=', 'Patient.patientId')
                .join('User as PatientUser', 'Patient.userId', '=', 'PatientUser.userId')
                .join('Service', 'TestRequest.serviceId', '=', 'Service.serviceId')
                .leftJoin('Room', 'TestResult.roomId', '=', 'Room.roomId')
                .leftJoin('File', 'TestResult.resultFileId', '=', 'File.fileId')
                .where('TestResult.technicianId', technicianId);
            
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
            
            if (filters.resultType) {
                query = query.where('TestResult.resultType', filters.resultType);
            }
            
            if (filters.dateFrom) {
                query = query.where('TestResult.performedDate', '>=', filters.dateFrom);
            }
            
            if (filters.dateTo) {
                query = query.where('TestResult.performedDate', '<=', filters.dateTo);
            }
            
            // Get total count
            const countQuery = query.clone();
            const totalResults = await countQuery.count('TestResult.resultId as count').first();
            const total = totalResults.count;
            
            // Get paginated results
            const testResults = await query
                .select(
                    'TestResult.*',
                    'Service.name as serviceName',
                    'Service.type as serviceType',
                    'PatientUser.fullName as patientName',
                    'Patient.patientId',
                    'Room.roomNumber',
                    'File.fileName',
                    'File.filePath'
                )
                .orderBy('TestResult.performedDate', 'desc')
                .limit(limit)
                .offset(offset);
            
            return { testResults, total };
        } catch (error) {
            console.error('Error fetching test results with filters:', error);
            throw new Error('Unable to get test results with filters');
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
     * Check if a lab technician has an active schedule
     * @param {number} technicianId - Lab technician ID
     * @returns {Promise<boolean>} True if technician has an active schedule
     */
    static async hasActiveSchedule(technicianId) {
        try {
            const now = new Date();
            const currentDate = now.toISOString().split('T')[0]; // YYYY-MM-DD
            const currentTime = now.toTimeString().split(' ')[0]; // HH:MM:SS
            
            console.log(`Checking schedule for technician ${technicianId} on ${currentDate} at ${currentTime}`);
            
            // First try to get any schedule for today
            let schedules = await db('Schedule')
                .where('labTechnicianId', technicianId)
                .select('*');
            
            console.log(`Found ${schedules.length} total schedules for technician ${technicianId}`);
            
            // Manually filter to handle date format issues
            schedules = schedules.filter(schedule => {
                // Convert workDate to string in YYYY-MM-DD format
                let scheduleDate;
                if (schedule.workDate instanceof Date) {
                    scheduleDate = schedule.workDate.toISOString().split('T')[0];
                } else if (typeof schedule.workDate === 'string') {
                    // Handle string format that might include time part
                    scheduleDate = schedule.workDate.split('T')[0];
                } else {
                    // Try to create a date object
                    const dateObj = new Date(schedule.workDate);
                    scheduleDate = dateObj.toISOString().split('T')[0];
                }
                
                // Check if the dates match
                const datesMatch = scheduleDate === currentDate;
                
                // Check time range
                const timeInRange = schedule.startTime <= currentTime && schedule.endTime >= currentTime;
                
                // Check status
                const validStatus = schedule.status === 'active' || schedule.status === 'available';
                
                console.log(`Schedule ID ${schedule.scheduleId}: date=${scheduleDate}, currentDate=${currentDate}, datesMatch=${datesMatch}, timeInRange=${timeInRange}, status=${schedule.status}, validStatus=${validStatus}`);
                
                return datesMatch && timeInRange && validStatus;
            });
            
            console.log(`Found ${schedules.length} active/available schedules for technician ${technicianId} covering current time`);
            
            return schedules.length > 0;
        } catch (error) {
            console.error(`Error checking active schedule for technician ID ${technicianId}:`, error);
            throw new Error('Unable to check active schedule');
        }
    }

    /**
     * Get lab rooms
     * @returns {Promise<Array>} List of lab rooms
     */
    static async getLabRooms() {
        try {
            return await db('Room')
                .where('roomType', 'lab')
                .select('roomId', 'roomNumber', 'roomType')
                .orderBy('roomNumber');
        } catch (error) {
            console.error('Error fetching lab rooms:', error);
            throw new Error('Unable to get lab rooms');
        }
    }

    /**
     * Add a new test result
     * @param {Object} testResult - Test result data
     * @returns {Promise<number>} New test result ID
     */
    static async add(testResult) {
        try {
            const [resultId] = await db('TestResult').insert(testResult);
            return resultId;
        } catch (error) {
            console.error('Error adding test result:', error);
            throw new Error('Unable to add test result');
        }
    }

    /**
     * Update a test result
     * @param {number} resultId - Test result ID
     * @param {Object} testResult - Updated test result data
     * @returns {Promise<boolean>} True if update successful
     */
    static async update(resultId, testResult) {
        try {
            const result = await db('TestResult')
                .where('resultId', resultId)
                .update(testResult);
            return result > 0;
        } catch (error) {
            console.error(`Error updating test result with ID ${resultId}:`, error);
            throw new Error('Unable to update test result');
        }
    }

    /**
     * Update result data (text, file, interpretation)
     * @param {number} resultId - Test result ID
     * @param {string} resultText - Result text
     * @param {number|null} resultFileId - File ID
     * @param {string|null} interpretation - Interpretation text
     * @returns {Promise<boolean>} True if update successful
     */
    static async updateResultData(resultId, resultText, resultFileId = null, interpretation = null) {
        try {
            const updateData = {
                resultText,
                interpretation,
                status: 'completed',
                performedDate: db.fn.now()
            };
            
            if (resultFileId) {
                updateData.resultFileId = resultFileId;
            }
            
            const result = await db('TestResult')
                .where('resultId', resultId)
                .update(updateData);
            return result > 0;
        } catch (error) {
            console.error(`Error updating result data for test result with ID ${resultId}:`, error);
            throw new Error('Unable to update test result data');
        }
    }

    /**
     * Delete a test result
     * @param {number} resultId - Test result ID
     * @returns {Promise<boolean>} True if deletion successful
     */
    static async delete(resultId) {
=======
 * Data Access Object for test result-related database operations
 */
export default {
    /**
     * Find all test results
     * @returns {Promise<Array>} List of all test results
     */
    async findAll() {
        try {
            return await db('TestResult as tr')
                .leftJoin('TestRequest as req', 'tr.requestId', '=', 'req.requestId')
                .leftJoin('Doctor as d', 'req.requestedByDoctorId', '=', 'd.doctorId')
                .leftJoin('User as du', 'd.userId', '=', 'du.userId')
                .leftJoin('Appointment as a', 'req.appointmentId', '=', 'a.appointmentId')
                .leftJoin('Patient as p', 'a.patientId', '=', 'p.patientId')
                .leftJoin('User as pu', 'p.userId', '=', 'pu.userId')
                .leftJoin('Service as s', 'req.serviceId', '=', 's.serviceId')
                .select(
                    'tr.*',
                    'req.requestId',
                    'du.fullName AS doctorName',
                    'pu.fullName AS patientName',
                    's.name AS testName'
                )
                .orderBy('tr.performedDate', 'desc');
        } catch (error) {
            console.error('Error retrieving all test results:', error);
            throw error;
        }
    },
    
    /**
     * Find a test result by its ID
     * @param {number} resultId - ID of the test result to find
     * @returns {Promise<Object|null>} The test result or null if not found
     */
    async findById(resultId) {
        try {
            const result = await db('TestResult as tr')
                .leftJoin('TestRequest as req', 'tr.requestId', '=', 'req.requestId')
                .leftJoin('Doctor as d', 'req.requestedByDoctorId', '=', 'd.doctorId')
                .leftJoin('User as du', 'd.userId', '=', 'du.userId')
                .leftJoin('Appointment as a', 'req.appointmentId', '=', 'a.appointmentId')
                .leftJoin('Patient as p', 'a.patientId', '=', 'p.patientId')
                .leftJoin('User as pu', 'p.userId', '=', 'pu.userId')
                .leftJoin('Service as s', 'req.serviceId', '=', 's.serviceId')
                .select(
                    'tr.*',
                    'req.requestId',
                    'du.fullName AS doctorName',
                    'pu.fullName AS patientName',
                    's.name AS testName'
                )
                .where('tr.resultId', resultId)
                .first();
                
            return result || null;
        } catch (error) {
            console.error(`Error retrieving test result with ID ${resultId}:`, error);
            throw error;
        }
    },
    
    /**
     * Find all test results for a specific request
     * @param {number} requestId - ID of the test request
     * @returns {Promise<Array>} List of test results for the request
     */
    async findByRequestId(requestId) {
        try {
            return await db('TestResult as tr')
                .leftJoin('TestRequest as req', 'tr.requestId', '=', 'req.requestId')
                .leftJoin('Doctor as d', 'req.requestedByDoctorId', '=', 'd.doctorId')
                .leftJoin('User as du', 'd.userId', '=', 'du.userId')
                .leftJoin('Appointment as a', 'req.appointmentId', '=', 'a.appointmentId')
                .leftJoin('Patient as p', 'a.patientId', '=', 'p.patientId')
                .leftJoin('User as pu', 'p.userId', '=', 'pu.userId')
                .leftJoin('Service as s', 'req.serviceId', '=', 's.serviceId')
                .select(
                    'tr.*',
                    'req.requestId',
                    'du.fullName AS doctorName',
                    'pu.fullName AS patientName',
                    's.name AS testName'
                )
                .where('tr.requestId', requestId)
                .orderBy('tr.performedDate', 'desc');
        } catch (error) {
            console.error(`Error retrieving test results for request ID ${requestId}:`, error);
            throw error;
        }
    },
    
    /**
     * Find all test results for a specific patient
     * @param {number} patientId - ID of the patient
     * @returns {Promise<Array>} List of test results for the patient
     */
    async findByPatientId(patientId) {
        try {
            return await db('TestResult as tr')
                .join('TestRequest as req', 'tr.requestId', '=', 'req.requestId')
                .leftJoin('Doctor as d', 'req.requestedByDoctorId', '=', 'd.doctorId')
                .leftJoin('User as du', 'd.userId', '=', 'du.userId')
                .leftJoin('Appointment as a', 'req.appointmentId', '=', 'a.appointmentId')
                .leftJoin('Patient as p', 'a.patientId', '=', 'p.patientId')
                .leftJoin('User as pu', 'p.userId', '=', 'pu.userId')
                .leftJoin('Service as s', 'req.serviceId', '=', 's.serviceId')
                .select(
                    'tr.*',
                    'req.requestId',
                    'du.fullName AS doctorName',
                    'pu.fullName AS patientName',
                    's.name AS testName'
                )
                .where('a.patientId', patientId)
                .orderBy('tr.performedDate', 'desc');
        } catch (error) {
            console.error(`Error retrieving test results for patient ID ${patientId}:`, error);
            throw error;
        }
    },
    
    /**
     * Find all test results for a specific doctor's patients
     * @param {number} doctorId - ID of the doctor
     * @returns {Promise<Array>} List of test results for the doctor's patients
     */
    async findByDoctorId(doctorId) {
        try {
            return await db('TestResult as tr')
                .join('TestRequest as req', 'tr.requestId', '=', 'req.requestId')
                .leftJoin('Doctor as d', 'req.requestedByDoctorId', '=', 'd.doctorId')
                .leftJoin('User as du', 'd.userId', '=', 'du.userId')
                .leftJoin('Appointment as a', 'req.appointmentId', '=', 'a.appointmentId')
                .leftJoin('Patient as p', 'a.patientId', '=', 'p.patientId')
                .leftJoin('User as pu', 'p.userId', '=', 'pu.userId')
                .leftJoin('Service as s', 'req.serviceId', '=', 's.serviceId')
                .select(
                    'tr.*',
                    'req.requestId',
                    'du.fullName AS doctorName',
                    'pu.fullName AS patientName',
                    's.name AS testName'
                )
                .where('req.requestedByDoctorId', doctorId)
                .orderBy('tr.performedDate', 'desc');
        } catch (error) {
            console.error(`Error retrieving test results for doctor ID ${doctorId}:`, error);
            throw error;
        }
    },
    
    /**
     * Count the number of results linked to a specific request
     * @param {number} requestId - ID of the test request
     * @returns {Promise<number>} Count of test results
     */
    async countByRequestId(requestId) {
        try {
            const result = await db('TestResult')
                .where('requestId', requestId)
                .count('resultId as count')
                .first();
            
            return result ? result.count : 0;
        } catch (error) {
            console.error(`Error counting test results for request ID ${requestId}:`, error);
            throw error;
        }
    },
    
    /**
     * Count completed test results requested by a specific doctor in the last N days
     * @param {number} doctorId - ID of the doctor
     * @param {number} days - Number of days to look back
     * @returns {Promise<number>} Count of completed test results
     */
    async countCompletedByDoctor(doctorId, days = 7) {
        try {
            const result = await db('TestResult as tr')
                .join('TestRequest as req', 'tr.requestId', '=', 'req.requestId')
                .where('req.requestedByDoctorId', doctorId)
                .whereRaw('tr.performedDate >= DATE_SUB(CURRENT_DATE(), INTERVAL ? DAY)', [days])
                .count('tr.resultId as count')
                .first();
            
            return result ? result.count : 0;
        } catch (error) {
            console.error(`Error counting completed test results for doctor ID ${doctorId}:`, error);
            return 0;
        }
    },
    
    /**
     * Add a new test result
     * @param {Object} testResult - Test result data
     * @returns {Promise<number>} ID of the created test result
     */
    async add(testResult) {
        try {
            const { 
                requestId,
                performedByLabTechnicianId,
                resultValue,
                resultUnit,
                normalRange,
                interpretation,
                performedDate = new Date(),
                attachmentUrl,
                comments
            } = testResult;
            
            // Use transaction for both operations
            const trx = await db.transaction();
            
            try {
                // Add test result
                const [resultId] = await trx('TestResult').insert({
                    requestId,
                    performedByLabTechnicianId,
                    resultValue,
                    resultUnit,
                    normalRange,
                    interpretation,
                    performedDate,
                    attachmentUrl,
                    comments
                });
                
                // Update test request status
                await trx('TestRequest')
                    .where('requestId', requestId)
                    .update({ status: 'completed' });
                
                await trx.commit();
                return resultId;
            } catch (error) {
                await trx.rollback();
                throw error;
            }
        } catch (error) {
            console.error('Error adding test result:', error);
            throw error;
        }
    },
    
    /**
     * Update a test result
     * @param {number} resultId - ID of the test result to update
     * @param {Object} testResult - Updated test result data
     * @returns {Promise<boolean>} Success status
     */
    async update(resultId, testResult) {
        try {
            const { 
                performedByLabTechnicianId,
                resultValue,
                resultUnit,
                normalRange,
                interpretation,
                performedDate,
                attachmentUrl,
                comments
            } = testResult;
            
            const result = await db('TestResult')
                .where('resultId', resultId)
                .update({
                    performedByLabTechnicianId,
                    resultValue,
                    resultUnit,
                    normalRange,
                    interpretation,
                    performedDate,
                    attachmentUrl,
                    comments
                });
            
            return result > 0;
        } catch (error) {
            console.error(`Error updating test result with ID ${resultId}:`, error);
            throw error;
        }
    },
    
    /**
     * Delete a test result
     * @param {number} resultId - ID of the test result to delete
     * @returns {Promise<boolean>} Success status
     */
    async delete(resultId) {
>>>>>>> 1b35a7e990adc481ac2b9f5ec39584dd701f494e
        try {
            const result = await db('TestResult')
                .where('resultId', resultId)
                .delete();
<<<<<<< HEAD
            return result > 0;
        } catch (error) {
            console.error(`Error deleting test result with ID ${resultId}:`, error);
            throw new Error('Unable to delete test result');
        }
    }

    /**
     * Count test results by result type
     * @returns {Promise<Array>} Count of test results by result type
     */
    static async countByResultType() {
        try {
            return await db('TestResult')
                .select('resultType')
                .count('resultId as count')
                .groupBy('resultType');
        } catch (error) {
            console.error('Error counting test results by result type:', error);
            throw new Error('Unable to count test results by result type');
        }
    }

    /**
     * Count test results by status for a specific technician
     * @param {number} technicianId - Lab technician ID
     * @returns {Promise<Array>} Count of test results by status
     */
    static async countByStatus(technicianId) {
        try {
            return await db('TestResult')
                .where('technicianId', technicianId)
                .select('status')
                .count('resultId as count')
                .groupBy('status');
        } catch (error) {
            console.error(`Error counting test results by status for technician ${technicianId}:`, error);
            throw new Error('Unable to count test results by status');
        }
    }

    /**
     * Get medical record ID from an appointment
     * @param {number} appointmentId - Appointment ID
     * @returns {Promise<number|null>} Medical record ID or null if not found
     */
    static async getMedicalRecordIdFromAppointment(appointmentId) {
        try {
            const record = await db('Appointment')
                .select('medicalRecordId')
                .where('appointmentId', appointmentId)
                .first();
            
            return record ? record.medicalRecordId : null;
        } catch (error) {
            console.error(`Error getting medical record ID for appointment ${appointmentId}:`, error);
            return null;
        }
    }

    /**
     * Add a test result with file upload
     * @param {Object} testResult - Test result data
     * @param {Object} fileData - File data (if provided)
     * @returns {Promise<number>} New test result ID
     */
    static async addWithFile(testResult, fileData = null) {
        const trx = await db.transaction();
        
        try {
            let resultFileId = null;
            
            // If file data is provided, insert it first
            if (fileData) {
                const [fileId] = await trx('File').insert(fileData);
                resultFileId = fileId;
                testResult.resultFileId = fileId;
                
                console.log(`Created file record with ID ${fileId}`);
            }
            
            // Insert the test result
            const [resultId] = await trx('TestResult').insert(testResult);
            
            // Commit the transaction
            await trx.commit();
            
            console.log(`Created test result with ID ${resultId}`);
            return resultId;
        } catch (error) {
            // Rollback the transaction on error
            await trx.rollback();
            console.error('Error adding test result with file:', error);
            throw new Error('Unable to add test result with file: ' + error.message);
        }
    }
    
    /**
     * Update a test result with file upload
     * @param {number} resultId - Test result ID
     * @param {Object} testResult - Updated test result data
     * @param {Object} fileData - File data (if provided)
     * @returns {Promise<boolean>} True if update successful
     */
    static async updateWithFile(resultId, testResult, fileData = null) {
        const trx = await db.transaction();
        
        try {
            // If file data is provided, insert it first
            if (fileData) {
                const [fileId] = await trx('File').insert(fileData);
                testResult.resultFileId = fileId;
                
                console.log(`Created file record with ID ${fileId} for test result ${resultId}`);
            }
            
            // Update the test result
            const result = await trx('TestResult')
                .where('resultId', resultId)
                .update(testResult);
            
            // Commit the transaction
            await trx.commit();
            
            console.log(`Updated test result with ID ${resultId}`);
            return result > 0;
        } catch (error) {
            // Rollback the transaction on error
            await trx.rollback();
            console.error(`Error updating test result with ID ${resultId} with file:`, error);
            throw new Error('Unable to update test result with file: ' + error.message);
        }
    }
}

export default TestResultDAO; 
=======
                
            return result > 0;
        } catch (error) {
            console.error(`Error deleting test result with ID ${resultId}:`, error);
            throw error;
        }
    },
    
    /**
     * Get test results for a patient's medical record
     * @param {number} patientId - ID of the patient
     * @param {number} limit - Maximum number of results to return
     * @returns {Promise<Array>} List of test results for the patient's medical record
     */
    async getResultsForMedicalRecord(patientId, limit = 20) {
        try {
            return await db('TestResult as tr')
                .join('TestRequest as req', 'tr.requestId', '=', 'req.requestId')
                .leftJoin('Appointment as a', 'req.appointmentId', '=', 'a.appointmentId')
                .leftJoin('Doctor as d', 'req.requestedByDoctorId', '=', 'd.doctorId')
                .leftJoin('User as du', 'd.userId', '=', 'du.userId')
                .leftJoin('Service as s', 'req.serviceId', '=', 's.serviceId')
                .select(
                    'tr.resultId',
                    'tr.performedDate',
                    'tr.resultValue',
                    'tr.resultUnit',
                    'tr.normalRange',
                    'tr.interpretation',
                    'tr.attachmentUrl',
                    's.name as testName',
                    'du.fullName as doctorName'
                )
                .where('a.patientId', patientId)
                .orderBy('tr.performedDate', 'desc')
                .limit(limit);
        } catch (error) {
            console.error(`Error retrieving test results for medical record of patient ID ${patientId}:`, error);
            throw error;
        }
    }
}; 
>>>>>>> 1b35a7e990adc481ac2b9f5ec39584dd701f494e
