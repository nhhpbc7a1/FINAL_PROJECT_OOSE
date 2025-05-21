import Doctor from '../../models/Doctor.js';
import PrescriptionDAO from '../../dao/PrescriptionDAO.js';
import MedicalRecordDAO from '../../dao/MedicalRecordDAO.js';
import moment from 'moment';

export default {
  /**
   * Add a new prescription
   * @param {Object} prescription - The prescription data
   * @param {number} prescription.recordId - The medical record ID
   * @param {number} prescription.doctorId - The doctor ID
   * @param {string} prescription.notes - Notes for the prescription
   * @returns {Promise<number>} - The new prescription ID
   */
  async add(prescription) {
    try {
      // Validate doctor exists
      const doctor = await Doctor.findById(prescription.doctorId);
      if (!doctor) {
        throw new Error(`Doctor with ID ${prescription.doctorId} not found`);
      }
      
      // Validate medical record exists
      const record = await MedicalRecordDAO.findById(prescription.recordId);
      if (!record) {
        throw new Error(`Medical record with ID ${prescription.recordId} not found`);
      }
      
      // Prepare prescription data
      const prescriptionData = {
        recordId: prescription.recordId,
        doctorId: prescription.doctorId,
        prescriptionDate: moment().format('YYYY-MM-DD HH:mm:ss'),
        notes: prescription.notes || '',
        status: 'active'
      };
      
      // Use DAO to add prescription
      return await PrescriptionDAO.add(prescriptionData);
    } catch (error) {
      console.error('Error adding prescription:', error);
      throw new Error('Failed to add prescription: ' + error.message);
    }
  },
  
  /**
   * Add prescription medications (details)
   * @param {number} prescriptionId - The prescription ID
   * @param {Array} medications - List of medication details
   * @returns {Promise<boolean>} - Success status
   */
  async addPrescriptionDetails(prescriptionId, medications) {
    if (!Array.isArray(medications) || medications.length === 0) {
      throw new Error('No medications provided');
    }
    
    try {
      // Validate prescription exists
      const prescription = await PrescriptionDAO.getById(prescriptionId);
      if (!prescription) {
        throw new Error(`Prescription with ID ${prescriptionId} not found`);
      }
      
      // Prepare the prescription details
      const details = medications.map(med => ({
        prescriptionId,
        medicationId: med.medicationId,
        dosage: med.dosage || null,
        frequency: med.frequency || null,
        duration: med.duration ? `${med.duration} days` : null,
        instructions: med.instructions || null
      }));
      
      // Use DAO to add prescription details
      return await PrescriptionDAO.addDetails(prescriptionId, details);
    } catch (error) {
      console.error('Error adding prescription details:', error);
      throw new Error('Failed to add prescription medications: ' + error.message);
    }
  },
  
  /**
   * Get a prescription by ID
   * @param {number} prescriptionId - The prescription ID
   * @returns {Promise<Object>} - The prescription with details
   */
  async getById(prescriptionId) {
    try {
      // Use DAO to get prescription with details
      return await PrescriptionDAO.getById(prescriptionId);
    } catch (error) {
      console.error(`Error getting prescription ${prescriptionId}:`, error);
      throw new Error('Failed to get prescription: ' + error.message);
    }
  },
  
  /**
   * Get prescriptions for a patient
   * @param {number} patientId - The patient ID
   * @returns {Promise<Array>} - List of prescriptions
   */
  async getByPatientId(patientId) {
    try {
      // Use DAO to get patient's prescriptions
      return await PrescriptionDAO.findByPatientId(patientId);
    } catch (error) {
      console.error(`Error getting prescriptions for patient ${patientId}:`, error);
      throw new Error('Failed to get patient prescriptions: ' + error.message);
    }
  },
  
  /**
   * Create a medical record and prescription in one operation
   * @param {Object} data - Combined medical record and prescription data
   * @returns {Promise<Object>} - The created record and prescription IDs
   */
  async createWithMedicalRecord(data) {
    try {
      // Validate doctor exists
      const doctor = await Doctor.findById(data.doctorId);
      if (!doctor) {
        throw new Error(`Doctor with ID ${data.doctorId} not found`);
      }
      
      // Prepare medical record data
      const recordData = {
        appointmentId: data.appointmentId,
        diagnosis: data.diagnosis || '',
        notes: data.notes || '',
        recommendations: data.recommendations || '',
        followupDate: data.followupDate || null
      };
      
      // Prepare prescription data
      const prescriptionData = {
        doctorId: data.doctorId,
        notes: data.prescriptionNotes || '',
        status: 'active'
      };
      
      // Prepare medications if available
      const medications = data.medications || [];
      
      // Use DAO to create medical record with prescription in transaction
      return await PrescriptionDAO.createWithMedicalRecord(recordData, prescriptionData, medications);
    } catch (error) {
      console.error('Error creating medical record and prescription:', error);
      throw new Error('Failed to create prescription: ' + error.message);
    }
  }
}; 