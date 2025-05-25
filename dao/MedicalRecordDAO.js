import db from '../ultis/db.js';

/**
 * Data Access Object for MedicalRecord-related database operations
 */
class MedicalRecordDAO {
    /**
     * Create a new medical record
     * @param {Object} recordData - Medical record data
     * @returns {Promise<number>} ID of the new record
     */
    static async create(recordData) {
        try {
            const [recordId] = await db('MedicalRecord').insert(recordData);
            return recordId;
        } catch (error) {
            console.error('Error creating medical record:', error);
            throw new Error('Failed to create medical record: ' + error.message);
        }
    }

    /**
     * Find a medical record by ID
     * @param {number} recordId - Record ID
     * @returns {Promise<Object|null>} Medical record or null
     */
    static async findById(recordId) {
        try {
            const record = await db('MedicalRecord')
                .where('recordId', recordId)
                .first();
            return record || null;
        } catch (error) {
            console.error(`Error finding medical record ${recordId}:`, error);
            throw new Error('Failed to find medical record: ' + error.message);
        }
    }

    /**
     * Find a medical record by appointment ID
     * @param {number} appointmentId - Appointment ID
     * @returns {Promise<Object|null>} Medical record or null
     */
    static async findByAppointmentId(appointmentId) {
        try {
            const record = await db('MedicalRecord')
                .where('appointmentId', appointmentId)
                .first();
            return record || null;
        } catch (error) {
            console.error(`Error finding medical record for appointment ${appointmentId}:`, error);
            throw new Error('Failed to find medical record: ' + error.message);
        }
    }

    /**
     * Update a medical record
     * @param {number} recordId - Record ID
     * @param {Object} recordData - Updated record data
     * @returns {Promise<boolean>} Success status
     */
    static async update(recordId, recordData) {
        try {
            const result = await db('MedicalRecord')
                .where('recordId', recordId)
                .update(recordData);
            return result > 0;
        } catch (error) {
            console.error(`Error updating medical record ${recordId}:`, error);
            throw new Error('Failed to update medical record: ' + error.message);
        }
    }

    /**
     * Get detailed medical record with patient and doctor information
     * @param {number} recordId - Record ID
     * @returns {Promise<Object|null>} Detailed record or null
     */
    static async getDetailedRecord(recordId) {
        try {
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
            return record || null;
        } catch (error) {
            console.error(`Error getting detailed record ${recordId}:`, error);
            throw new Error('Failed to get detailed medical record: ' + error.message);
        }
    }

    /**
     * Get patient's medical history
     * @param {number} patientId - Patient ID
     * @returns {Promise<Array<Object>>} List of medical records
     */
    static async getPatientHistory(patientId) {
        try {
            return await db('MedicalRecord')
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
        } catch (error) {
            console.error(`Error getting medical history for patient ${patientId}:`, error);
            throw new Error('Failed to get medical history: ' + error.message);
        }
    }

    /**
     * Get patient medical records for API endpoint
     * @param {number} patientId - Patient ID
     * @returns {Promise<Array<Object>>} List of formatted medical records
     */
    static async getPatientRecordsForAPI(patientId) {
        try {
            console.log(`[DAO] Finding records for patient ${patientId}`);

            // First check if the patient has any appointments that are "examined"
            const examinedAppointments = await db('Appointment')
                .where('patientId', patientId)
                .where('patientAppointmentStatus', 'examined')
                .select('appointmentId')
                .orderBy('appointmentDate', 'desc');
            
            console.log(`[DAO] Found ${examinedAppointments.length} examined appointments.`);
            
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
            
            console.log(`[DAO] Found ${records.length} records for patient ${patientId}.`);
            return records;
        } catch (error) {
            console.error(`Error getting patient records for API (patient ${patientId}):`, error);
            throw new Error('Failed to get patient records: ' + error.message);
        }
    }

    /**
     * Get debug information about medical records
     * @returns {Promise<Object>} Debug information
     */
    static async getDebugInfo() {
        try {
            // Get a sample of medical records
            const records = await db('MedicalRecord')
                .select('*')
                .limit(5);
            
            // Get total count
            const [countResult] = await db('MedicalRecord').count('* as total');
            const totalRecords = countResult.total;
            
            return {
                sampleRecords: records,
                totalRecords
            };
        } catch (error) {
            console.error('Error checking medical records:', error);
            throw new Error('Failed to debug medical records: ' + error.message);
        }
    }

    /**
     * Create a new medical record or update if it already exists
     * @param {Object} recordData - Medical record data
     * @returns {Promise<number>} ID of the new or updated record
     */
    static async createOrUpdate(recordData) {
        try {
            // Check if a record already exists for this appointment
            const existingRecord = await this.findByAppointmentId(recordData.appointmentId);
            
            if (existingRecord) {
                // Update the existing record
                console.log(`Medical record already exists for appointment ${recordData.appointmentId}, updating instead of creating`);
                await db('MedicalRecord')
                    .where('appointmentId', recordData.appointmentId)
                    .update({
                        diagnosis: recordData.diagnosis,
                        notes: recordData.notes,
                        recommendations: recordData.recommendations,
                        followupDate: recordData.followupDate,
                        updatedDate: db.fn.now()
                    });
                return existingRecord.recordId;
            } else {
                // Create a new record
                const [recordId] = await db('MedicalRecord').insert(recordData);
                return recordId;
            }
        } catch (error) {
            console.error('Error creating or updating medical record:', error);
            throw new Error('Failed to create or update medical record: ' + error.message);
        }
    }
}

export default MedicalRecordDAO; 