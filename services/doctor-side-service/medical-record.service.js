import db from '../../ultis/db.js';
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

      // Ensure only valid fields are passed to the database
      const validRecord = {
        appointmentId: recordData.appointmentId,
        diagnosis: recordData.diagnosis || '',
        notes: recordData.notes || '',
        recommendations: recordData.recommendations || '',
        followupDate: recordData.followupDate ? moment(recordData.followupDate).format('YYYY-MM-DD') : null,
        createdDate: moment().format('YYYY-MM-DD HH:mm:ss')
      };
      
      // Insert the record
      const [recordId] = await db('MedicalRecord').insert(validRecord);
      
      return recordId;
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
      const record = await db('MedicalRecord')
        .where('appointmentId', appointmentId)
        .first();
        
      return record || null;
    } catch (error) {
      console.error(`Error finding medical record for appointment ${appointmentId}:`, error);
      throw new Error('Failed to find medical record');
    }
  },
  
  /**
   * Get detailed medical record with patient and doctor information
   * @param {number} recordId - The record ID
   * @returns {Promise<Object>} - The detailed record
   */
  async getDetailedRecord(recordId) {
    try {
      // Get the record with related information
      const record = await db('MedicalRecord')
        .join('Appointment', 'MedicalRecord.appointmentId', '=', 'Appointment.appointmentId')
        .join('Patient', 'Appointment.patientId', '=', 'Patient.patientId')
        .join('User as PatientUser', 'Patient.userId', '=', 'PatientUser.userId')
        .leftJoin('Doctor', 'Appointment.doctorId', '=', 'Doctor.doctorId')
        .leftJoin('User as DoctorUser', 'Doctor.userId', '=', 'DoctorUser.userId')
        .select(
          'MedicalRecord.*',
          'Appointment.appointmentDate',
          'Appointment.reason',
          'PatientUser.fullName as patientName',
          'PatientUser.phoneNumber as patientPhone',
          'PatientUser.email as patientEmail',
          'Patient.gender as patientGender',
          'Patient.dob as patientDob',
          'Patient.patientId',
          'DoctorUser.fullName as doctorName'
        )
        .where('MedicalRecord.recordId', recordId)
        .first();
      
      if (!record) return null;
      
      // Get test results associated with this record
      const testResults = await db('TestResult')
        .join('Service', 'TestResult.serviceId', '=', 'Service.serviceId')
        .leftJoin('LabTechnician', 'TestResult.technicianId', '=', 'LabTechnician.technicianId')
        .leftJoin('User', 'LabTechnician.userId', '=', 'User.userId')
        .select(
          'TestResult.*',
          'Service.name as serviceName',
          'User.fullName as technicianName'
        )
        .where('TestResult.recordId', recordId);
      
      // Get prescriptions associated with this record
      const prescriptions = await db('Prescription')
        .where('recordId', recordId)
        .select('*');
      
      // Get medications for each prescription
      for (const prescription of prescriptions) {
        const medications = await db('PrescriptionDetail')
          .join('Medication', 'PrescriptionDetail.medicationId', '=', 'Medication.medicationId')
          .where('prescriptionId', prescription.prescriptionId)
          .select(
            'Medication.name as medicationName',
            'Medication.dosage',
            'PrescriptionDetail.frequency',
            'PrescriptionDetail.duration'
          );
        
        prescription.medications = medications;
      }
      
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
      throw new Error('Failed to get detailed medical record');
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
      const existingRecord = await db('MedicalRecord')
        .where('recordId', recordId)
        .first();
      
      if (!existingRecord) {
        throw new Error('Medical record not found');
      }
      
      // Prepare the update data
      const updateData = {
        ...recordData,
        updatedDate: moment().format('YYYY-MM-DD HH:mm:ss')
      };
      
      // Update the record
      const result = await db('MedicalRecord')
        .where('recordId', recordId)
        .update(updateData);
      
      return result > 0;
    } catch (error) {
      console.error(`Error updating medical record ${recordId}:`, error);
      throw new Error('Failed to update medical record');
    }
  },
  
  /**
   * Get a patient's medical history
   * @param {number} patientId - The patient ID
   * @returns {Promise<Array>} - List of medical records
   */
  async getPatientMedicalHistory(patientId) {
    try {
      // Get all medical records for the patient via appointments
      const records = await db('MedicalRecord')
        .join('Appointment', 'MedicalRecord.appointmentId', '=', 'Appointment.appointmentId')
        .join('Doctor', 'Appointment.doctorId', '=', 'Doctor.doctorId')
        .join('User', 'Doctor.userId', '=', 'User.userId')
        .join('Specialty', 'Doctor.specialtyId', '=', 'Specialty.specialtyId')
        .where('Appointment.patientId', patientId)
        .select(
          'MedicalRecord.*',
          'Appointment.appointmentDate',
          'User.fullName as doctorName',
          'Specialty.name as specialtyName'
        )
        .orderBy('MedicalRecord.createdDate', 'desc');
      
      // Format the records
      const formattedRecords = records.map(record => ({
        ...record,
        formattedDate: moment(record.createdDate).format('MMM D, YYYY'),
        formattedAppointmentDate: moment(record.appointmentDate).format('MMM D, YYYY')
      }));
      
      return formattedRecords;
    } catch (error) {
      console.error(`Error getting medical history for patient ${patientId}:`, error);
      throw new Error('Failed to get patient medical history');
    }
  }
}; 