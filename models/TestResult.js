import TestResultDAO from '../dao/TestResultDAO.js';

/**
 * TestResult Model Class
 * Represents a test result in the system
 */
class TestResult {
    /**
     * Create a new TestResult instance
     * @param {Object} resultData - Test result data
     */
    constructor(resultData = {}) {
        this.resultId = resultData.resultId || null;
        this.requestId = resultData.requestId;
        this.recordId = resultData.recordId;
        this.conductedBy = resultData.conductedBy;
        this.value = resultData.value || '';
        this.normalRange = resultData.normalRange || '';
        this.unit = resultData.unit || '';
        this.result = resultData.result || '';
        this.interpretation = resultData.interpretation || '';
        this.status = resultData.status || 'pending';
        this.conductedDate = resultData.conductedDate;
        this.completionDate = resultData.completionDate;
        
        // Related data from joins
        this.testName = resultData.testName;
        this.patientId = resultData.patientId;
        this.patientName = resultData.patientName;
        this.technicianName = resultData.technicianName;
    }

    /**
     * Save the test result
     * @returns {Promise<number>} The result ID
     */
    async save() {
        try {
            const resultData = {
                requestId: this.requestId,
                recordId: this.recordId,
                conductedBy: this.conductedBy,
                value: this.value,
                normalRange: this.normalRange,
                unit: this.unit,
                result: this.result,
                interpretation: this.interpretation,
                status: this.status
            };
            
            if (this.resultId) {
                // Update existing result
                await TestResultDAO.update(this.resultId, resultData);
                return this.resultId;
            } else {
                // Create new result
                this.resultId = await TestResultDAO.add(resultData);
                return this.resultId;
            }
        } catch (error) {
            console.error('Error saving test result:', error);
            throw new Error('Failed to save test result: ' + error.message);
        }
    }

    /**
     * Delete the test result
     * @returns {Promise<boolean>} Success status
     */
    async delete() {
        try {
            if (!this.resultId) {
                throw new Error('Cannot delete unsaved test result');
            }
            
            return await TestResultDAO.delete(this.resultId);
        } catch (error) {
            console.error('Error deleting test result:', error);
            throw new Error('Failed to delete test result: ' + error.message);
        }
    }

    /**
     * Find all test results
     * @returns {Promise<Array<TestResult>>} Array of test results
     */
    static async findAll() {
        try {
            const results = await TestResultDAO.findAll();
            return results.map(result => new TestResult(result));
        } catch (error) {
            console.error('Error fetching all test results:', error);
            throw new Error('Unable to load test results: ' + error.message);
        }
    }

    /**
     * Find a test result by ID
     * @param {number} resultId - Result ID
     * @returns {Promise<TestResult|null>} The found result or null
     */
    static async findById(resultId) {
        try {
            const result = await TestResultDAO.findById(resultId);
            return result ? new TestResult(result) : null;
        } catch (error) {
            console.error(`Error finding test result with ID ${resultId}:`, error);
            throw new Error('Unable to find test result: ' + error.message);
        }
    }

    /**
     * Find test results by request ID
     * @param {number} requestId - Request ID
     * @returns {Promise<Array<TestResult>>} Array of test results
     */
    static async findByRequestId(requestId) {
        try {
            const results = await TestResultDAO.findByRequestId(requestId);
            return results.map(result => new TestResult(result));
        } catch (error) {
            console.error(`Error finding test results for request ${requestId}:`, error);
            throw new Error('Unable to find test results by request: ' + error.message);
        }
    }

    /**
     * Find test results by medical record ID
     * @param {number} recordId - Medical record ID
     * @returns {Promise<Array<TestResult>>} Array of test results
     */
    static async findByRecordId(recordId) {
        try {
            const results = await TestResultDAO.findByRecordId(recordId);
            return results.map(result => new TestResult(result));
        } catch (error) {
            console.error(`Error finding test results for record ${recordId}:`, error);
            throw new Error('Unable to find test results by record: ' + error.message);
        }
    }

    /**
     * Find test results by patient ID
     * @param {number} patientId - Patient ID
     * @returns {Promise<Array<TestResult>>} Array of test results
     */
    static async findByPatientId(patientId) {
        try {
            const results = await TestResultDAO.findByPatientId(patientId);
            return results.map(result => new TestResult(result));
        } catch (error) {
            console.error(`Error finding test results for patient ${patientId}:`, error);
            throw new Error('Unable to find test results by patient: ' + error.message);
        }
    }

    /**
     * Count completed test results by doctor in the last N days
     * @param {number} doctorId - Doctor ID
     * @param {number} days - Number of days to look back
     * @returns {Promise<number>} Count of completed test results
     */
    static async countCompletedByDoctor(doctorId, days = 7) {
        try {
            return await TestResultDAO.countCompletedByDoctor(doctorId, days);
        } catch (error) {
            console.error(`Error counting completed test results for doctor ${doctorId}:`, error);
            throw new Error('Unable to count completed test results: ' + error.message);
        }
    }
}

export default TestResult; 