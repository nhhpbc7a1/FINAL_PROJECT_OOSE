import TestResultDAO from '../dao/TestResultDAO.js';

/**
 * TestResult model representing a test result in the system
 */
class TestResult {
    /**
     * Create a new TestResult instance
     * @param {Object} data - Test result data
     */
    constructor(data = {}) {
        // Các trường từ bảng TestResult
        this.resultId = data.resultId || null;
        this.recordId = data.recordId || null;
        this.appointmentId = data.appointmentId || null;
        this.requestId = data.requestId || null;
        this.serviceId = data.serviceId || null;
        this.technicianId = data.technicianId || null;
        this.roomId = data.roomId || null;
        this.resultText = data.resultText || null;
        this.resultNumeric = data.resultNumeric || null;
        this.resultFileId = data.resultFileId || null;
        this.resultType = data.resultType || 'text';
        this.normalRange = data.normalRange || null;
        this.unit = data.unit || null;
        this.interpretation = data.interpretation || null;
        this.performedDate = data.performedDate || null;
        this.reportedDate = data.reportedDate || null;
        this.status = data.status || 'pending';
        
        // Các trường từ join bảng
        this.serviceName = data.serviceName || data.testName || null;
        this.serviceType = data.serviceType || null;
        this.serviceDescription = data.serviceDescription || data.testDescription || null;
        this.technicianName = data.technicianName || null;
        this.roomNumber = data.roomNumber || null;
        this.roomType = data.roomType || null;
        this.fileName = data.fileName || null;
        this.filePath = data.filePath || null;
        this.fileType = data.fileType || null;
        this.patientName = data.patientName || null;
        this.patientId = data.patientId || null;
    }

    /**
     * Save the test result (create or update)
     * @returns {Promise<number>} Result ID
     */
    async save() {
        try {
            if (this.resultId) {
                // Update existing test result
                const testResultData = {
                    recordId: this.recordId,
                    appointmentId: this.appointmentId,
                    requestId: this.requestId,
                    serviceId: this.serviceId,
                    technicianId: this.technicianId,
                    roomId: this.roomId,
                    resultText: this.resultText,
                    resultNumeric: this.resultNumeric,
                    resultFileId: this.resultFileId,
                    resultType: this.resultType,
                    normalRange: this.normalRange,
                    unit: this.unit,
                    interpretation: this.interpretation,
                    performedDate: this.performedDate,
                    status: this.status
                };
                
                await TestResultDAO.update(this.resultId, testResultData);
                return this.resultId;
            } else {
                // Create new test result
                const testResultData = {
                    recordId: this.recordId,
                    appointmentId: this.appointmentId,
                    requestId: this.requestId,
                    serviceId: this.serviceId,
                    technicianId: this.technicianId,
                    roomId: this.roomId,
                    resultText: this.resultText,
                    resultNumeric: this.resultNumeric,
                    resultFileId: this.resultFileId,
                    resultType: this.resultType,
                    normalRange: this.normalRange,
                    unit: this.unit,
                    interpretation: this.interpretation,
                    performedDate: this.performedDate,
                    status: this.status
                };
                
                this.resultId = await TestResultDAO.add(testResultData);
                return this.resultId;
            }
        } catch (error) {
            console.error('Error saving test result:', error);
            throw new Error('Failed to save test result: ' + error.message);
        }
    }

    /**
     * Save the test result (create or update) with file
     * @param {Object} fileData - File data (optional)
     * @returns {Promise<number>} Result ID
     */
    async saveWithFile(fileData = null) {
        try {
            // Prepare test result data
            const testResultData = {
                recordId: this.recordId,
                appointmentId: this.appointmentId,
                requestId: this.requestId,
                serviceId: this.serviceId,
                technicianId: this.technicianId,
                roomId: this.roomId,
                resultText: this.resultText,
                resultNumeric: this.resultNumeric,
                resultType: this.resultType,
                normalRange: this.normalRange,
                unit: this.unit,
                interpretation: this.interpretation,
                performedDate: this.performedDate,
                status: this.status
            };
            
            if (this.resultId) {
                // Update existing test result
                await TestResultDAO.updateWithFile(this.resultId, testResultData, fileData);
                
                // Update the file-related properties if a new file was uploaded
                if (fileData) {
                    this.resultFileId = testResultData.resultFileId;
                    this.fileName = fileData.fileName;
                    this.filePath = fileData.filePath;
                    this.fileType = fileData.fileType;
                }
                
                return this.resultId;
            } else {
                // Create new test result
                this.resultId = await TestResultDAO.addWithFile(testResultData, fileData);
                
                // Update the file-related properties if a file was uploaded
                if (fileData) {
                    this.resultFileId = testResultData.resultFileId;
                    this.fileName = fileData.fileName;
                    this.filePath = fileData.filePath;
                    this.fileType = fileData.fileType;
                }
                
                return this.resultId;
            }
        } catch (error) {
            console.error('Error saving test result with file:', error);
            throw new Error('Failed to save test result with file: ' + error.message);
        }
    }

    /**
     * Update the result data (text, file, interpretation)
     * @param {string} resultText - Text result
     * @param {number|null} resultFileId - File ID
     * @param {string|null} interpretation - Interpretation text
     * @returns {Promise<boolean>} True if successful
     */
    async updateResultData(resultText, resultFileId = null, interpretation = null) {
        try {
            if (!this.resultId) {
                throw new Error('Cannot update an unsaved test result');
            }
            
            const success = await TestResultDAO.updateResultData(
                this.resultId, 
                resultText,
                resultFileId,
                interpretation
            );
            
            if (success) {
                this.resultText = resultText;
                if (resultFileId) this.resultFileId = resultFileId;
                if (interpretation) this.interpretation = interpretation;
                this.status = 'completed';
                this.performedDate = new Date();
            }
            
            return success;
        } catch (error) {
            console.error('Error updating test result data:', error);
            throw new Error('Failed to update test result data: ' + error.message);
        }
    }

    /**
     * Delete the test result
     * @returns {Promise<boolean>} True if successful
     */
    async delete() {
        try {
            if (!this.resultId) {
                throw new Error('Cannot delete an unsaved test result');
            }
            
            return await TestResultDAO.delete(this.resultId);
        } catch (error) {
            console.error('Error deleting test result:', error);
            throw new Error('Failed to delete test result: ' + error.message);
        }
    }

    /**
     * Find all test results
     * @returns {Promise<TestResult[]>} Array of test results
     */
    static async findAll() {
        try {
            const testResults = await TestResultDAO.findAll();
            return testResults.map(result => new TestResult(result));
        } catch (error) {
            console.error('Error finding all test results:', error);
            throw new Error('Failed to find all test results: ' + error.message);
        }
    }

    /**
     * Find test result by ID
     * @param {number} resultId - Result ID
     * @returns {Promise<TestResult|null>} Test result or null
     */
    static async findById(resultId) {
        try {
            const testResult = await TestResultDAO.findById(resultId);
            return testResult ? new TestResult(testResult) : null;
        } catch (error) {
            console.error(`Error finding test result with ID ${resultId}:`, error);
            throw new Error('Failed to find test result: ' + error.message);
        }
    }

    /**
     * Find test results by medical record
     * @param {number} recordId - Medical record ID
     * @returns {Promise<TestResult[]>} Array of test results
     */
    static async findByMedicalRecord(recordId) {
        try {
            const testResults = await TestResultDAO.findByMedicalRecord(recordId);
            return testResults.map(result => new TestResult(result));
        } catch (error) {
            console.error(`Error finding test results for medical record ${recordId}:`, error);
            throw new Error('Failed to find test results by medical record: ' + error.message);
        }
    }

    /**
     * Find test results by lab technician
     * @param {number} technicianId - Lab technician ID
     * @returns {Promise<TestResult[]>} Array of test results
     */
    static async findByTechnician(technicianId) {
        try {
            const testResults = await TestResultDAO.findByTechnician(technicianId);
            return testResults.map(result => new TestResult(result));
        } catch (error) {
            console.error(`Error finding test results for technician ${technicianId}:`, error);
            throw new Error('Failed to find test results by technician: ' + error.message);
        }
    }

    /**
     * Get recent test results by technician
     * @param {number} technicianId - Lab technician ID
     * @param {number} limit - Number of results to return
     * @returns {Promise<TestResult[]>} Array of recent test results
     */
    static async getRecentByTechnician(technicianId, limit = 5) {
        try {
            const testResults = await TestResultDAO.getRecentByTechnician(technicianId, limit);
            return testResults.map(result => new TestResult(result));
        } catch (error) {
            console.error(`Error getting recent test results for technician ${technicianId}:`, error);
            throw new Error('Failed to get recent test results: ' + error.message);
        }
    }

    /**
     * Get all test results with filtering and pagination
     * @param {Object} filters - Filter criteria
     * @param {number} technicianId - Lab technician ID
     * @param {number} page - Page number
     * @param {number} limit - Results per page
     * @returns {Promise<Object>} Object with test results, pagination info, and total count
     */
    static async getAll(filters, technicianId, page = 1, limit = 10) {
        try {
            const { testResults, total } = await TestResultDAO.getAll(filters, technicianId, page, limit);
            
            // Calculate pagination
            const pagination = {
                page,
                limit,
                totalPages: Math.ceil(total / limit),
                hasNext: page < Math.ceil(total / limit),
                hasPrev: page > 1
            };
            
            return {
                testResults: testResults.map(result => new TestResult(result)),
                pagination,
                total
            };
        } catch (error) {
            console.error('Error getting all test results with filters:', error);
            throw new Error('Failed to get test results: ' + error.message);
        }
    }

    /**
     * Get test types by specialty
     * @param {number} specialtyId - Specialty ID
     * @returns {Promise<Array>} Array of test types
     */
    static async getTestTypesBySpecialty(specialtyId) {
        try {
            return await TestResultDAO.getTestTypesBySpecialty(specialtyId);
        } catch (error) {
            console.error(`Error getting test types for specialty ${specialtyId}:`, error);
            throw new Error('Failed to get test types: ' + error.message);
        }
    }

    /**
     * Check if a lab technician has an active schedule
     * @param {number} technicianId - Lab technician ID
     * @returns {Promise<boolean>} True if technician has an active schedule
     */
    static async hasActiveSchedule(technicianId) {
        try {
            return await TestResultDAO.hasActiveSchedule(technicianId);
        } catch (error) {
            console.error(`Error checking active schedule for technician ${technicianId}:`, error);
            throw new Error('Failed to check active schedule: ' + error.message);
        }
    }

    /**
     * Get lab rooms
     * @returns {Promise<Array>} Array of lab rooms
     */
    static async getLabRooms() {
        try {
            return await TestResultDAO.getLabRooms();
        } catch (error) {
            console.error('Error getting lab rooms:', error);
            throw new Error('Failed to get lab rooms: ' + error.message);
        }
    }

    /**
     * Count test results by status for a specific technician
     * @param {number} technicianId - Lab technician ID
     * @returns {Promise<Object>} Object with counts by status
     */
    static async countByStatus(technicianId) {
        try {
            const resultsData = await TestResultDAO.countByStatus(technicianId);
            
            // Initialize counters
            let pendingCount = 0;
            let inProgressCount = 0;
            let completedCount = 0;
            let totalCount = 0;
            
            // Process the results
            resultsData.forEach(item => {
                if (item.status === 'pending') {
                    pendingCount = parseInt(item.count);
                } else if (item.status === 'in_progress') {
                    inProgressCount = parseInt(item.count);
                } else if (item.status === 'completed') {
                    completedCount = parseInt(item.count);
                }
                totalCount += parseInt(item.count);
            });
            
            return {
                pendingCount,
                inProgressCount,
                completedCount,
                totalCount
            };
        } catch (error) {
            console.error(`Error counting test results by status for technician ${technicianId}:`, error);
            throw new Error('Failed to count test results by status: ' + error.message);
        }
    }

    /**
     * Generate printable view data for a test result
     * @param {number} resultId - Test result ID
     * @returns {Promise<Object>} Printable view data
     */
    static async generatePrintableView(resultId) {
        try {
            // Get the test result with all details
            const testResult = await TestResultDAO.findById(resultId);
            
            if (!testResult) {
                return null;
            }
            
            // Format dates for display
            const performedDate = testResult.performedDate ? new Date(testResult.performedDate) : null;
            const reportedDate = testResult.reportedDate ? new Date(testResult.reportedDate) : null;
            const patientDob = testResult.dateOfBirth ? new Date(testResult.dateOfBirth) : null;
            
            // Format data for the print view
            return {
                result: testResult,
                formattedDates: {
                    performedDate: performedDate ? performedDate.toLocaleDateString() : 'N/A',
                    reportedDate: reportedDate ? reportedDate.toLocaleDateString() : 'N/A',
                    patientDob: patientDob ? patientDob.toLocaleDateString() : 'N/A'
                },
                isAbnormal: testResult.resultNumeric && testResult.normalRange ? 
                    isAbnormal(testResult.resultNumeric, testResult.normalRange) : false
            };
        } catch (error) {
            console.error(`Error generating printable view for test result ${resultId}:`, error);
            throw new Error('Failed to generate printable view: ' + error.message);
        }
    }

    /**
     * Synchronize recordId from appointmentId
     * This method ensures that the test result has a valid recordId
     * by fetching it from the appointment if needed
     * @returns {Promise<boolean>} True if sync was successful
     */
    async syncRecordIdFromAppointment() {
        try {
            if (this.recordId) {
                return true; // Already has a recordId
            }
            
            if (!this.appointmentId) {
                return false; // No appointmentId to sync from
            }
            
            const recordId = await TestResultDAO.getMedicalRecordIdFromAppointment(this.appointmentId);
            
            if (recordId) {
                this.recordId = recordId;
                // Update the database with the new recordId
                await TestResultDAO.update(this.resultId, { recordId: recordId });
                console.log(`Synchronized recordId ${recordId} for test result ${this.resultId} from appointment ${this.appointmentId}`);
                return true;
            }
            
            return false;
        } catch (error) {
            console.error(`Error synchronizing recordId for test result ${this.resultId}:`, error);
            return false;
        }
    }
}

/**
 * Helper function to determine if a result is abnormal
 * @param {number} resultNumeric - Numeric result value
 * @param {string} normalRange - Normal range string (e.g., "10-20")
 * @returns {boolean} True if abnormal
 */
function isAbnormal(resultNumeric, normalRange) {
    if (!resultNumeric || !normalRange) return false;
    
    const [min, max] = normalRange.split('-').map(val => parseFloat(val.trim()));
    return resultNumeric < min || resultNumeric > max;
}

export default TestResult; 