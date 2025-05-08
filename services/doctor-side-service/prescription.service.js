import db from '../../ultis/db.js';
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
    const trx = await db.transaction();
    
    try {
      // Insert into Prescription table
      const [prescriptionId] = await trx('Prescription').insert({
        recordId: prescription.recordId,
        doctorId: prescription.doctorId,
        prescriptionDate: moment().format('YYYY-MM-DD HH:mm:ss'),
        notes: prescription.notes || '',
        status: 'active'
      });
      
      // Commit the transaction
      await trx.commit();
      
      return prescriptionId;
    } catch (error) {
      // Rollback on error
      await trx.rollback();
      console.error('Error adding prescription:', error);
      throw new Error('Failed to add prescription');
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
    
    const trx = await db.transaction();
    
    try {
      // Prepare the prescription details for bulk insert
      const details = medications.map(med => ({
        prescriptionId,
        medicationId: med.medicationId,
        dosage: med.dosage || null,
        frequency: med.frequency || null,
        duration: med.duration ? `${med.duration} days` : null,
        instructions: med.instructions || null
      }));
      
      // Insert into PrescriptionDetail table
      await trx('PrescriptionDetail').insert(details);
      
      // Commit the transaction
      await trx.commit();
      
      return true;
    } catch (error) {
      // Rollback on error
      await trx.rollback();
      console.error('Error adding prescription details:', error);
      throw new Error('Failed to add prescription medications');
    }
  },
  
  /**
   * Get a prescription by ID
   * @param {number} prescriptionId - The prescription ID
   * @returns {Promise<Object>} - The prescription with details
   */
  async getById(prescriptionId) {
    try {
      // Get the prescription
      const prescription = await db('Prescription')
        .where('prescriptionId', prescriptionId)
        .first();
      
      if (!prescription) {
        return null;
      }
      
      // Get the prescription details
      const details = await db('PrescriptionDetail')
        .join('Medication', 'PrescriptionDetail.medicationId', '=', 'Medication.medicationId')
        .where('prescriptionId', prescriptionId)
        .select(
          'PrescriptionDetail.*',
          'Medication.name as medicationName',
          'Medication.dosage as medicationDosage',
          'Medication.category as medicationCategory',
          'Medication.manufacturer',
          'Medication.sideEffects'
        );
      
      return {
        ...prescription,
        medications: details
      };
    } catch (error) {
      console.error(`Error getting prescription ${prescriptionId}:`, error);
      throw new Error('Failed to get prescription');
    }
  },
  
  /**
   * Get prescriptions for a patient
   * @param {number} patientId - The patient ID
   * @returns {Promise<Array>} - List of prescriptions
   */
  async getByPatientId(patientId) {
    try {
      // Join through MedicalRecord to find prescriptions for the patient's appointments
      const prescriptions = await db('Prescription')
        .join('MedicalRecord', 'Prescription.recordId', '=', 'MedicalRecord.recordId')
        .join('Appointment', 'MedicalRecord.appointmentId', '=', 'Appointment.appointmentId')
        .join('Doctor', 'Prescription.doctorId', '=', 'Doctor.doctorId')
        .join('User', 'Doctor.userId', '=', 'User.userId')
        .where('Appointment.patientId', patientId)
        .select(
          'Prescription.*',
          'User.fullName as doctorName',
          'Appointment.appointmentDate'
        )
        .orderBy('Prescription.prescriptionDate', 'desc');
      
      return prescriptions;
    } catch (error) {
      console.error(`Error getting prescriptions for patient ${patientId}:`, error);
      throw new Error('Failed to get patient prescriptions');
    }
  },
  
  /**
   * Create a medical record and prescription in one operation
   * @param {Object} data - Combined medical record and prescription data
   * @returns {Promise<Object>} - The created record and prescription IDs
   */
  async createWithMedicalRecord(data) {
    const trx = await db.transaction();
    
    try {
      // First, create the medical record
      const [recordId] = await trx('MedicalRecord').insert({
        appointmentId: data.appointmentId,
        diagnosis: data.diagnosis || '',
        notes: data.notes || '',
        recommendations: data.recommendations || '',
        followupDate: data.followupDate || null
      });
      
      // Then create the prescription
      const [prescriptionId] = await trx('Prescription').insert({
        recordId,
        doctorId: data.doctorId,
        notes: data.prescriptionNotes || '',
        status: 'active'
      });
      
      // Finally, add prescription details if provided
      if (data.medications && data.medications.length > 0) {
        const details = data.medications.map(med => ({
          prescriptionId,
          medicationId: med.medicationId,
          dosage: med.dosage || null,
          frequency: med.frequency || null,
          duration: med.duration ? `${med.duration} days` : null,
          instructions: med.instructions || null
        }));
        
        await trx('PrescriptionDetail').insert(details);
      }
      
      // Commit the transaction
      await trx.commit();
      
      return { recordId, prescriptionId };
    } catch (error) {
      // Rollback on error
      await trx.rollback();
      console.error('Error creating medical record and prescription:', error);
      throw new Error('Failed to create prescription');
    }
  }
}; 