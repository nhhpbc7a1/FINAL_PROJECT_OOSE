import db from '../ultis/db.js';

/**
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
        try {
            const result = await db('TestResult')
                .where('resultId', resultId)
                .delete();
                
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