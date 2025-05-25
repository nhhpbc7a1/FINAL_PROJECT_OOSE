import MedicalRecordDAO from '../dao/MedicalRecordDAO.js';
import moment from 'moment';

/**
 * MedicalRecord Model Class
 * Represents a medical record in the system
 */
class MedicalRecord {
    /**
     * Create a new MedicalRecord instance
     * @param {Object} recordData - Medical record data
     */
    constructor(recordData = {}) {
        this.recordId = recordData.recordId || null;
        this.appointmentId = recordData.appointmentId;
        this.diagnosis = recordData.diagnosis || '';
        this.notes = recordData.notes || '';
        this.recommendations = recordData.recommendations || '';
        this.followupDate = recordData.followupDate || null;
        this.createdDate = recordData.createdDate || moment().format('YYYY-MM-DD HH:mm:ss');
        this.updatedDate = recordData.updatedDate;
        
        // Additional fields from joined tables
        this.patientId = recordData.patientId;
        this.patientName = recordData.patientName;
        this.patientDob = recordData.patientDob;
        this.doctorId = recordData.doctorId;
        this.doctorName = recordData.doctorName;
        this.specialtyName = recordData.specialtyName;
        this.appointmentDate = recordData.appointmentDate;
    }

    /**
     * Save or update the medical record
     * @returns {Promise<number>} The record ID
     */
    async save() {
        try {
            const recordData = {
                appointmentId: this.appointmentId,
                diagnosis: this.diagnosis,
                notes: this.notes,
                recommendations: this.recommendations,
                followupDate: this.followupDate,
                updatedDate: moment().format('YYYY-MM-DD HH:mm:ss')
            };

            if (this.recordId) {
                // Update existing record
                await MedicalRecordDAO.update(this.recordId, recordData);
                return this.recordId;
            } else {
                // Create new record
                this.recordId = await MedicalRecordDAO.create(recordData);
                return this.recordId;
            }
        } catch (error) {
            console.error('Error saving medical record:', error);
            throw new Error('Failed to save medical record: ' + error.message);
        }
    }

    /**
     * Save or update based on appointment ID
     * @returns {Promise<number>} The record ID
     */
    async saveOrUpdate() {
        try {
            // Use the DAO's createOrUpdate method directly
            const recordData = {
                appointmentId: this.appointmentId,
                diagnosis: this.diagnosis,
                notes: this.notes,
                recommendations: this.recommendations,
                followupDate: this.followupDate,
                updatedDate: moment().format('YYYY-MM-DD HH:mm:ss')
            };
            
            this.recordId = await MedicalRecordDAO.createOrUpdate(recordData);
            return this.recordId;
        } catch (error) {
            console.error('Error saving/updating medical record:', error);
            throw new Error('Failed to save/update medical record: ' + error.message);
        }
    }

    /**
     * Delete the medical record
     * @returns {Promise<boolean>} True if deletion was successful
     */
    async delete() {
        try {
            if (!this.recordId) {
                throw new Error('Cannot delete unsaved medical record');
            }
            
            return await MedicalRecordDAO.delete(this.recordId);
        } catch (error) {
            console.error('Error deleting medical record:', error);
            throw new Error('Failed to delete medical record: ' + error.message);
        }
    }

    /**
     * Find a medical record by ID
     * @param {number} recordId - The record ID
     * @returns {Promise<MedicalRecord|null>} The found record or null
     */
    static async findById(recordId) {
        try {
            const recordData = await MedicalRecordDAO.findById(recordId);
            return recordData ? new MedicalRecord(recordData) : null;
        } catch (error) {
            console.error(`Error finding medical record with ID ${recordId}:`, error);
            throw new Error('Failed to find medical record: ' + error.message);
        }
    }

    /**
     * Find a medical record by appointment ID
     * @param {number} appointmentId - The appointment ID
     * @returns {Promise<MedicalRecord|null>} The found record or null
     */
    static async findByAppointmentId(appointmentId) {
        try {
            const recordData = await MedicalRecordDAO.findByAppointmentId(appointmentId);
            return recordData ? new MedicalRecord(recordData) : null;
        } catch (error) {
            console.error(`Error finding medical record for appointment ${appointmentId}:`, error);
            throw new Error('Failed to find medical record: ' + error.message);
        }
    }

    /**
     * Get a detailed medical record with related information
     * @param {number} recordId - The record ID
     * @returns {Promise<Object|null>} The detailed record or null
     */
    static async getDetailedRecord(recordId) {
        try {
            const recordData = await MedicalRecordDAO.getDetailedRecord(recordId);
            if (!recordData) return null;
            
            // Calculate age and format dates
            const patientAge = recordData.patientDob 
                ? moment().diff(moment(recordData.patientDob), 'years') 
                : 'Unknown';
            const formattedDate = moment(recordData.createdDate).format('MMMM D, YYYY');
            
            return {
                ...recordData,
                patientAge,
                formattedDate
            };
        } catch (error) {
            console.error(`Error getting detailed record ${recordId}:`, error);
            throw new Error('Failed to get detailed medical record: ' + error.message);
        }
    }

    /**
     * Get patient's medical history
     * @param {number} patientId - The patient ID
     * @returns {Promise<Array>} List of medical records
     */
    static async getPatientHistory(patientId) {
        try {
            const records = await MedicalRecordDAO.getPatientHistory(patientId);
            
            // Format the records with formatted dates
            return records.map(record => ({
                ...record,
                formattedDate: moment(record.createdDate).format('MMM D, YYYY'),
                formattedAppointmentDate: moment(record.appointmentDate).format('MMM D, YYYY')
            }));
        } catch (error) {
            console.error(`Error getting medical history for patient ${patientId}:`, error);
            return [];
        }
    }

    /**
     * Get patient medical records formatted for API
     * @param {number} patientId - The patient ID
     * @returns {Promise<Array>} Formatted records
     */
    static async getPatientRecordsForAPI(patientId) {
        try {
            return await MedicalRecordDAO.getPatientRecordsForAPI(patientId);
        } catch (error) {
            console.error(`Error getting medical records for API, patient ${patientId}:`, error);
            throw new Error('Failed to get medical records: ' + error.message);
        }
    }

    /**
     * Get debug information about medical records
     * @returns {Promise<Object>} Debug information
     */
    static async getDebugInfo() {
        try {
            return await MedicalRecordDAO.getDebugInfo();
        } catch (error) {
            console.error('Error checking medical records:', error);
            throw new Error('Failed to check medical records: ' + error.message);
        }
    }
}

export default MedicalRecord; 