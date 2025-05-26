import db from '../ultis/db.js';

/**
 * Data Access Object for Prescription-related database operations
 */
class PrescriptionDAO {
    /**
     * Add a new prescription
     * @param {Object} prescriptionData - Prescription data to add
     * @returns {Promise<number>} ID of the new prescription
     */
    static async add(prescriptionData) {
        const trx = await db.transaction();
        try {
            const [prescriptionId] = await trx('Prescription').insert(prescriptionData);
            await trx.commit();
            return prescriptionId;
        } catch (error) {
            await trx.rollback();
            console.error('Error adding prescription:', error);
            throw new Error('Unable to add prescription: ' + error.message);
        }
    }

    /**
     * Add prescription details (medications)
     * @param {number} prescriptionId - Prescription ID
     * @param {Array<Object>} details - List of prescription details
     * @returns {Promise<boolean>} Success status
     */
    static async addDetails(prescriptionId, details) {
        const trx = await db.transaction();
        try {
            await trx('PrescriptionDetail').insert(details);
            await trx.commit();
            return true;
        } catch (error) {
            await trx.rollback();
            console.error('Error adding prescription details:', error);
            throw new Error('Unable to add prescription details: ' + error.message);
        }
    }

    /**
     * Get a prescription by ID with its details
     * @param {number} prescriptionId - Prescription ID to find
     * @returns {Promise<Object|null>} Prescription with details or null
     */
    static async getById(prescriptionId) {
        try {
            // Get the prescription basic info
            const prescription = await db('Prescription')
                .where('prescriptionId', prescriptionId)
                .first();
            
            if (!prescription) {
                return null;
            }
            
            // Get the prescription details (medications)
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
            throw new Error('Failed to get prescription: ' + error.message);
        }
    }

    /**
     * Find prescriptions for a patient
     * @param {number} patientId - Patient ID
     * @returns {Promise<Array<Object>>} List of prescriptions
     */
    static async findByPatientId(patientId) {
        try {
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

            // For each prescription, get its medications
            for (const prescription of prescriptions) {
                const medications = await db('PrescriptionDetail')
                    .join('Medication', 'PrescriptionDetail.medicationId', '=', 'Medication.medicationId')
                    .where('prescriptionId', prescription.prescriptionId)
                    .select(
                        'Medication.medicationId',
                        'Medication.name',
                        'PrescriptionDetail.dosage',
                        'PrescriptionDetail.frequency',
                        'PrescriptionDetail.duration',
                        'PrescriptionDetail.instructions'
                    );
                
                prescription.medications = medications;
            }
            
            return prescriptions;
        } catch (error) {
            console.error(`Error finding prescriptions for patient ${patientId}:`, error);
            throw new Error('Failed to find prescriptions by patient: ' + error.message);
        }
    }

    /**
     * Find prescriptions associated with a medical record
     * @param {number} recordId - Medical Record ID
     * @returns {Promise<Array<Object>>} List of prescriptions
     */
    static async findByRecordId(recordId) {
        try {
            const prescriptions = await db('Prescription')
                .join('Doctor', 'Prescription.doctorId', '=', 'Doctor.doctorId')
                .join('User', 'Doctor.userId', '=', 'User.userId')
                .where('Prescription.recordId', recordId)
                .select(
                    'Prescription.*',
                    'User.fullName as doctorName'
                );

            // For each prescription, get its medications
            for (const prescription of prescriptions) {
                const medications = await db('PrescriptionDetail')
                    .join('Medication', 'PrescriptionDetail.medicationId', '=', 'Medication.medicationId')
                    .where('prescriptionId', prescription.prescriptionId)
                    .select(
                        'PrescriptionDetail.*',
                        'Medication.name as medicationName',
                        'Medication.category'
                    );
                
                prescription.medications = medications;
            }
            
            return prescriptions;
        } catch (error) {
            console.error(`Error finding prescriptions for record ${recordId}:`, error);
            throw new Error('Failed to find prescriptions by record: ' + error.message);
        }
    }

    /**
     * Create a medical record with prescription in one transaction
     * @param {Object} recordData - Medical record data
     * @param {Object} prescriptionData - Prescription data
     * @param {Array<Object>} medications - List of medications for the prescription
     * @returns {Promise<Object>} Created recordId and prescriptionId
     */
    static async createWithMedicalRecord(recordData, prescriptionData, medications) {
        const trx = await db.transaction();
        
        try {
            // First, create the medical record
            const [recordId] = await trx('MedicalRecord').insert(recordData);
            
            // Then create the prescription with the new record ID
            const [prescriptionId] = await trx('Prescription').insert({
                ...prescriptionData,
                recordId
            });
            
            // Finally, add prescription details if provided
            if (medications && medications.length > 0) {
                const details = medications.map(med => ({
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
            throw new Error('Failed to create prescription: ' + error.message);
        }
    }

    /**
     * Find prescriptions by appointment ID
     * @param {number} appointmentId - Appointment ID
     * @returns {Promise<Array>} Array of prescriptions with medications
     */
    static async findByAppointmentId(appointmentId) {
        try {
            // First get the prescriptions
            const prescriptions = await db('Prescription')
                .join('Doctor', 'Prescription.doctorId', 'Doctor.doctorId')
                .join('User', 'Doctor.userId', 'User.userId')
                .join('MedicalRecord', 'Prescription.recordId', 'MedicalRecord.recordId')
                .select(
                    'Prescription.*',
                    'User.fullName as doctorName',
                    db.raw("DATE_FORMAT(Prescription.prescriptionDate, '%d/%m/%Y') as prescriptionDateFormatted")
                )
                .where('MedicalRecord.appointmentId', appointmentId);

            // For each prescription, get its medications
            for (const prescription of prescriptions) {
                const medications = await db('PrescriptionDetail')
                    .join('Medication', 'PrescriptionDetail.medicationId', 'Medication.medicationId')
                    .select(
                        'PrescriptionDetail.*',
                        'Medication.name',
                        'Medication.description'
                    )
                    .where('PrescriptionDetail.prescriptionId', prescription.prescriptionId);

                prescription.medications = medications;
                prescription.prescriptionDate = prescription.prescriptionDateFormatted;
            }

            return prescriptions;
        } catch (error) {
            console.error(`Error finding prescriptions for appointment ${appointmentId}:`, error);
            throw new Error('Unable to find prescriptions by appointment');
        }
    }
}

export default PrescriptionDAO; 