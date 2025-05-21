import Doctor from '../../models/Doctor.js';
import MedicalRecordDAO from '../../dao/MedicalRecordDAO.js';
import AppointmentDAO from '../../dao/AppointmentDAO.js';
import TestResultDAO from '../../dao/TestResultDAO.js';
import PrescriptionDAO from '../../dao/PrescriptionDAO.js';
import moment from 'moment';

export default {
  /**
   * Create a new medical record for an examination
   * @param {Object} recordData - The medical record data
   * @returns {Promise<number>} - The new record ID
   */
  async createExaminationRecord(recordData) {
    try {
      // Validate required fields
      if (!recordData.appointmentId) {
        throw new Error('appointmentId is required');
      }

      // Verify the appointment exists
      const appointment = await AppointmentDAO.findById(recordData.appointmentId);
      if (!appointment) {
        throw new Error(`Appointment with ID ${recordData.appointmentId} not found`);
      }

      // If doctorId is available in the appointment, verify doctor exists
      if (appointment.doctorId) {
        const doctor = await Doctor.findById(appointment.doctorId);
        if (!doctor) {
          throw new Error(`Doctor with ID ${appointment.doctorId} not found`);
        }
      }

      // Ensure only valid fields are passed to the database
      const validRecord = {
        appointmentId: recordData.appointmentId,
        diagnosis: recordData.diagnosis || '',
        notes: recordData.notes || '',
        recommendations: recordData.recommendations || '',
        followupDate: recordData.followupDate ? moment(recordData.followupDate).format('YYYY-MM-DD') : null,
        createdDate: moment().format('YYYY-MM-DD HH:mm:ss')
      };
      
      // Insert the record using DAO
      return await MedicalRecordDAO.create(validRecord);
    } catch (error) {
      console.error('Error creating examination record:', error);
      throw new Error('Failed to create examination record: ' + error.message);
    }
  },
  
  /**
   * Find a medical record by appointment ID
   * @param {number} appointmentId - The appointment ID
   * @returns {Promise<Object>} - The medical record
   */
  async findByAppointmentId(appointmentId) {
    try {
      return await MedicalRecordDAO.findByAppointmentId(appointmentId);
    } catch (error) {
      console.error(`Error finding medical record for appointment ${appointmentId}:`, error);
      throw new Error('Failed to find medical record: ' + error.message);
    }
  },
  
  /**
   * Get detailed medical record with patient and doctor information
   * @param {number} recordId - The record ID
   * @returns {Promise<Object>} - The detailed record
   */
  async getDetailedRecord(recordId) {
    try {
      // Get the basic record with related information
      const record = await MedicalRecordDAO.getDetailedRecord(recordId);
      
      if (!record) return null;
      
      // Get test results associated with this record
      const testResults = await TestResultDAO.findByRecordId(recordId);
      
      // Get prescriptions associated with this record
      const prescriptions = await PrescriptionDAO.findByRecordId(recordId);
      
      // Format dates and calculate age
      const patientAge = record.patientDob 
        ? moment().diff(moment(record.patientDob), 'years') 
        : 'Unknown';
      
      const formattedDate = moment(record.createdDate).format('MMMM D, YYYY');
      
      return {
        ...record,
        patientAge,
        formattedDate,
        testResults,
        prescriptions
      };
    } catch (error) {
      console.error(`Error getting detailed record ${recordId}:`, error);
      throw new Error('Failed to get detailed medical record: ' + error.message);
    }
  },
  
  /**
   * Update an existing medical record
   * @param {number} recordId - The record ID
   * @param {Object} recordData - The updated record data
   * @returns {Promise<boolean>} - Success status
   */
  async updateRecord(recordId, recordData) {
    try {
      // Validate that the record exists
      const existingRecord = await MedicalRecordDAO.findById(recordId);
      
      if (!existingRecord) {
        throw new Error('Medical record not found');
      }
      
      // Prepare the update data
      const updateData = {
        ...recordData,
        updatedDate: moment().format('YYYY-MM-DD HH:mm:ss')
      };
      
      // Update the record using DAO
      return await MedicalRecordDAO.update(recordId, updateData);
    } catch (error) {
      console.error(`Error updating medical record ${recordId}:`, error);
      throw new Error('Failed to update medical record: ' + error.message);
    }
  },
  
  /**
   * Get a patient's medical history
   * @param {number} patientId - The patient ID
   * @returns {Promise<Array>} - List of medical records
   */
  async getPatientMedicalHistory(patientId) {
    try {
      // Get all medical records for the patient via DAO
      const records = await MedicalRecordDAO.getPatientHistory(patientId);
      
      // Format the records
      const formattedRecords = records.map(record => ({
        ...record,
        formattedDate: moment(record.createdDate).format('MMM D, YYYY'),
        formattedAppointmentDate: moment(record.appointmentDate).format('MMM D, YYYY')
      }));
      
      return formattedRecords;
    } catch (error) {
      console.error(`Error getting medical history for patient ${patientId}:`, error);
      console.error('Error details:', error.message);
      // Return empty array instead of throwing
      return [];
    }
  },
  
  /**
   * Get patient medical records for the API endpoint
   * @param {number} patientId - The patient ID
   * @returns {Promise<Array>} - List of formatted medical records
   */
  async getPatientMedicalRecordsForAPI(patientId) {
    try {
      console.log(`Starting lookup for patient ${patientId}'s medical records`);
      
      // Use DAO to get the medical records with formatted data for API
      const records = await MedicalRecordDAO.getPatientRecordsForAPI(patientId);
      
      return records;
    } catch (error) {
      console.error(`Error getting medical records for API, patient ${patientId}:`, error);
      throw new Error('Failed to get medical records: ' + error.message);
    }
  },
  
  /**
   * Debug function to check medical records in the system
   * @returns {Promise<Object>} - Debug information
   */
  async debugCheckMedicalRecords() {
    try {
      return await MedicalRecordDAO.getDebugInfo();
    } catch (error) {
      console.error('Error checking medical records:', error);
      throw new Error('Failed to check medical records: ' + error.message);
    }
  }
}; 