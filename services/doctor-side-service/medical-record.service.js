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
        .leftJoin('Doctor', 'Appointment.doctorId', '=', 'Doctor.doctorId')
        .leftJoin('User', 'Doctor.userId', '=', 'User.userId')
        .leftJoin('Specialty', 'Appointment.specialtyId', '=', 'Specialty.specialtyId')
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
      
      // First check if the patient has any appointments that are "examined"
      const examinedAppointments = await db('Appointment')
        .where('patientId', patientId)
        .where('patientAppointmentStatus', 'examined')
        .select('appointmentId')
        .orderBy('appointmentDate', 'desc');
      
      console.log(`Found ${examinedAppointments.length} examined appointments for patient ${patientId}:`);
      console.log(examinedAppointments);
      
      // Log all appointmentIds that have medical records
      const medicalRecordsCheck = await db('MedicalRecord')
        .join('Appointment', 'MedicalRecord.appointmentId', '=', 'Appointment.appointmentId')
        .where('Appointment.patientId', patientId)
        .select('MedicalRecord.recordId', 'MedicalRecord.appointmentId')
        .orderBy('MedicalRecord.createdDate', 'desc');
      
      console.log(`Found ${medicalRecordsCheck.length} medical records for patient ${patientId}:`);
      console.log(medicalRecordsCheck);
      
      // Get all medical records for the patient via appointments
      const records = await db('MedicalRecord')
        .join('Appointment', 'MedicalRecord.appointmentId', '=', 'Appointment.appointmentId')
        .leftJoin('Doctor', 'Appointment.doctorId', '=', 'Doctor.doctorId')
        .leftJoin('User', 'Doctor.userId', '=', 'User.userId')
        .leftJoin('Specialty', 'Appointment.specialtyId', '=', 'Specialty.specialtyId')
        .where('Appointment.patientId', patientId)
        .select(
          'MedicalRecord.recordId as id',
          'MedicalRecord.diagnosis',
          'MedicalRecord.notes',
          'MedicalRecord.recommendations',
          'MedicalRecord.createdDate as createdAt',
          'Appointment.appointmentDate',
          'Appointment.reason as title',
          'User.fullName as doctorName',
          'Specialty.name as specialtyName'
        )
        .orderBy('MedicalRecord.createdDate', 'desc');
      
      // Add debugging to see what's coming back
      console.log(`Found ${records.length} formatted medical records for patient ${patientId}`);
      if (records.length > 0) {
        console.log('First record:', records[0]);
      }
      
      return records;
    } catch (error) {
      console.error(`Error fetching medical records for patient ID ${patientId}:`, error);
      console.error('Error details:', error.message);
      // Return empty array instead of throwing
      return [];
    }
  },
  
  /**
   * Debug function to check if MedicalRecord table has data
   * @returns {Promise<Array>} - Sample medical records
   */
  async debugCheckMedicalRecords() {
    try {
      // Get a sample of medical records
      const records = await db('MedicalRecord')
        .select('*')
        .limit(5);
      
      console.log(`Found ${records.length} sample medical records:`);
      console.log(records);
      
      // Get total count
      const [countResult] = await db('MedicalRecord').count('* as total');
      const totalRecords = countResult.total;
      
      console.log(`Total medical records in database: ${totalRecords}`);
      
      return {
        sampleRecords: records,
        totalRecords
      };
    } catch (error) {
      console.error('Error checking medical records:', error);
      return {
        error: error.message,
        sampleRecords: [],
        totalRecords: 0
      };
    }
  }
}; 