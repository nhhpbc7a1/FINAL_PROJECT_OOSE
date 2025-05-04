import db from '../ultis/db.js';

export default {
    async findAll() {
        try {
            return await db('Prescription')
                .join('MedicalRecord', 'Prescription.recordId', '=', 'MedicalRecord.recordId')
                .join('Doctor', 'Prescription.doctorId', '=', 'Doctor.doctorId')
                .join('User', 'Doctor.userId', '=', 'User.userId')
                .select(
                    'Prescription.*',
                    'User.fullName as doctorName'
                )
                .orderBy('Prescription.prescriptionDate', 'desc');
        } catch (error) {
            console.error('Error fetching prescriptions:', error);
            throw new Error('Unable to load prescriptions');
        }
    },

    async findById(prescriptionId) {
        try {
            const prescription = await db('Prescription')
                .join('MedicalRecord', 'Prescription.recordId', '=', 'MedicalRecord.recordId')
                .join('Doctor', 'Prescription.doctorId', '=', 'Doctor.doctorId')
                .join('User as DoctorUser', 'Doctor.userId', '=', 'DoctorUser.userId')
                .join('Appointment', 'MedicalRecord.appointmentId', '=', 'Appointment.appointmentId')
                .join('Patient', 'Appointment.patientId', '=', 'Patient.patientId')
                .join('User as PatientUser', 'Patient.userId', '=', 'PatientUser.userId')
                .select(
                    'Prescription.*',
                    'DoctorUser.fullName as doctorName',
                    'PatientUser.fullName as patientName',
                    'Patient.patientId',
                    'MedicalRecord.recordId',
                    'MedicalRecord.diagnosis'
                )
                .where('Prescription.prescriptionId', prescriptionId)
                .first();
            
            if (!prescription) return null;
            
            // Get prescription details
            const details = await db('PrescriptionDetail')
                .join('Medication', 'PrescriptionDetail.medicationId', '=', 'Medication.medicationId')
                .select(
                    'PrescriptionDetail.*',
                    'Medication.name as medicationName',
                    'Medication.description',
                    'Medication.dosage as recommendedDosage',
                    'Medication.price',
                    'Medication.category',
                    'Medication.manufacturer',
                    'Medication.sideEffects'
                )
                .where('PrescriptionDetail.prescriptionId', prescriptionId);
            
            // Add details to prescription
            prescription.details = details;
            
            return prescription;
        } catch (error) {
            console.error(`Error fetching prescription with ID ${prescriptionId}:`, error);
            throw new Error('Unable to find prescription');
        }
    },

    async findByMedicalRecord(recordId) {
        try {
            const prescriptions = await db('Prescription')
                .join('Doctor', 'Prescription.doctorId', '=', 'Doctor.doctorId')
                .join('User', 'Doctor.userId', '=', 'User.userId')
                .select(
                    'Prescription.*',
                    'User.fullName as doctorName'
                )
                .where('Prescription.recordId', recordId)
                .orderBy('Prescription.prescriptionDate', 'desc');
            
            // Get details for each prescription
            for (const prescription of prescriptions) {
                const details = await db('PrescriptionDetail')
                    .join('Medication', 'PrescriptionDetail.medicationId', '=', 'Medication.medicationId')
                    .select(
                        'PrescriptionDetail.*',
                        'Medication.name as medicationName',
                        'Medication.dosage as recommendedDosage'
                    )
                    .where('PrescriptionDetail.prescriptionId', prescription.prescriptionId);
                
                prescription.details = details;
            }
            
            return prescriptions;
        } catch (error) {
            console.error(`Error fetching prescriptions for medical record ID ${recordId}:`, error);
            throw new Error('Unable to find prescriptions by medical record');
        }
    },

    async findByDoctor(doctorId) {
        try {
            return await db('Prescription')
                .join('MedicalRecord', 'Prescription.recordId', '=', 'MedicalRecord.recordId')
                .join('Appointment', 'MedicalRecord.appointmentId', '=', 'Appointment.appointmentId')
                .join('Patient', 'Appointment.patientId', '=', 'Patient.patientId')
                .join('User', 'Patient.userId', '=', 'User.userId')
                .select(
                    'Prescription.*',
                    'User.fullName as patientName',
                    'MedicalRecord.diagnosis'
                )
                .where('Prescription.doctorId', doctorId)
                .orderBy('Prescription.prescriptionDate', 'desc');
        } catch (error) {
            console.error(`Error fetching prescriptions for doctor ID ${doctorId}:`, error);
            throw new Error('Unable to find prescriptions by doctor');
        }
    },

    async findByPatient(patientId) {
        try {
            return await db('Prescription')
                .join('MedicalRecord', 'Prescription.recordId', '=', 'MedicalRecord.recordId')
                .join('Appointment', 'MedicalRecord.appointmentId', '=', 'Appointment.appointmentId')
                .join('Doctor', 'Prescription.doctorId', '=', 'Doctor.doctorId')
                .join('User', 'Doctor.userId', '=', 'User.userId')
                .select(
                    'Prescription.*',
                    'User.fullName as doctorName',
                    'MedicalRecord.diagnosis',
                    'Appointment.appointmentDate'
                )
                .where('Appointment.patientId', patientId)
                .orderBy('Prescription.prescriptionDate', 'desc');
        } catch (error) {
            console.error(`Error fetching prescriptions for patient ID ${patientId}:`, error);
            throw new Error('Unable to find prescriptions by patient');
        }
    },

    async findByStatus(status) {
        try {
            return await db('Prescription')
                .join('MedicalRecord', 'Prescription.recordId', '=', 'MedicalRecord.recordId')
                .join('Appointment', 'MedicalRecord.appointmentId', '=', 'Appointment.appointmentId')
                .join('Patient', 'Appointment.patientId', '=', 'Patient.patientId')
                .join('User as PatientUser', 'Patient.userId', '=', 'PatientUser.userId')
                .join('Doctor', 'Prescription.doctorId', '=', 'Doctor.doctorId')
                .join('User as DoctorUser', 'Doctor.userId', '=', 'DoctorUser.userId')
                .select(
                    'Prescription.*',
                    'PatientUser.fullName as patientName',
                    'DoctorUser.fullName as doctorName'
                )
                .where('Prescription.status', status)
                .orderBy('Prescription.prescriptionDate', 'desc');
        } catch (error) {
            console.error(`Error fetching prescriptions with status ${status}:`, error);
            throw new Error('Unable to find prescriptions by status');
        }
    },

    async add(prescription) {
        try {
            const [prescriptionId] = await db('Prescription').insert(prescription);
            return prescriptionId;
        } catch (error) {
            console.error('Error adding prescription:', error);
            throw new Error('Unable to add prescription');
        }
    },

    async addPrescriptionWithDetails(prescription, details) {
        try {
            // Start a transaction
            return await db.transaction(async trx => {
                // Insert prescription
                const [prescriptionId] = await trx('Prescription').insert(prescription);
                
                // Add prescription ID to each detail
                const detailsWithPrescriptionId = details.map(detail => ({
                    ...detail,
                    prescriptionId
                }));
                
                // Insert all details
                await trx('PrescriptionDetail').insert(detailsWithPrescriptionId);
                
                return prescriptionId;
            });
        } catch (error) {
            console.error('Error adding prescription with details:', error);
            throw new Error('Unable to add prescription with details');
        }
    },

    async update(prescriptionId, prescription) {
        try {
            const result = await db('Prescription')
                .where('prescriptionId', prescriptionId)
                .update(prescription);
            return result > 0;
        } catch (error) {
            console.error(`Error updating prescription with ID ${prescriptionId}:`, error);
            throw new Error('Unable to update prescription');
        }
    },

    async updateStatus(prescriptionId, status) {
        try {
            const result = await db('Prescription')
                .where('prescriptionId', prescriptionId)
                .update({ status });
            return result > 0;
        } catch (error) {
            console.error(`Error updating status for prescription with ID ${prescriptionId}:`, error);
            throw new Error('Unable to update prescription status');
        }
    },

    async delete(prescriptionId) {
        try {
            // Start a transaction
            return await db.transaction(async trx => {
                // Delete prescription details first
                await trx('PrescriptionDetail')
                    .where('prescriptionId', prescriptionId)
                    .delete();
                
                // Delete prescription
                const result = await trx('Prescription')
                    .where('prescriptionId', prescriptionId)
                    .delete();
                
                return result > 0;
            });
        } catch (error) {
            console.error(`Error deleting prescription with ID ${prescriptionId}:`, error);
            throw new Error('Unable to delete prescription');
        }
    },

    // PrescriptionDetail methods
    async findDetailById(detailId) {
        try {
            const detail = await db('PrescriptionDetail')
                .join('Medication', 'PrescriptionDetail.medicationId', '=', 'Medication.medicationId')
                .select(
                    'PrescriptionDetail.*',
                    'Medication.name as medicationName',
                    'Medication.description',
                    'Medication.dosage as recommendedDosage',
                    'Medication.price',
                    'Medication.sideEffects'
                )
                .where('PrescriptionDetail.detailId', detailId)
                .first();
            return detail || null;
        } catch (error) {
            console.error(`Error fetching prescription detail with ID ${detailId}:`, error);
            throw new Error('Unable to find prescription detail');
        }
    },

    async findDetailsByPrescription(prescriptionId) {
        try {
            return await db('PrescriptionDetail')
                .join('Medication', 'PrescriptionDetail.medicationId', '=', 'Medication.medicationId')
                .select(
                    'PrescriptionDetail.*',
                    'Medication.name as medicationName',
                    'Medication.description',
                    'Medication.dosage as recommendedDosage',
                    'Medication.price',
                    'Medication.category',
                    'Medication.manufacturer',
                    'Medication.sideEffects'
                )
                .where('PrescriptionDetail.prescriptionId', prescriptionId);
        } catch (error) {
            console.error(`Error fetching details for prescription ID ${prescriptionId}:`, error);
            throw new Error('Unable to find prescription details');
        }
    },

    async addDetail(detail) {
        try {
            const [detailId] = await db('PrescriptionDetail').insert(detail);
            return detailId;
        } catch (error) {
            console.error('Error adding prescription detail:', error);
            throw new Error('Unable to add prescription detail');
        }
    },

    async updateDetail(detailId, detail) {
        try {
            const result = await db('PrescriptionDetail')
                .where('detailId', detailId)
                .update(detail);
            return result > 0;
        } catch (error) {
            console.error(`Error updating prescription detail with ID ${detailId}:`, error);
            throw new Error('Unable to update prescription detail');
        }
    },

    async deleteDetail(detailId) {
        try {
            const result = await db('PrescriptionDetail')
                .where('detailId', detailId)
                .delete();
            return result > 0;
        } catch (error) {
            console.error(`Error deleting prescription detail with ID ${detailId}:`, error);
            throw new Error('Unable to delete prescription detail');
        }
    },

    async countByStatus() {
        try {
            return await db('Prescription')
                .select('status')
                .count('prescriptionId as count')
                .groupBy('status');
        } catch (error) {
            console.error('Error counting prescriptions by status:', error);
            throw new Error('Unable to count prescriptions by status');
        }
    },

    async getMostPrescribedMedications(limit = 10) {
        try {
            return await db('PrescriptionDetail')
                .join('Medication', 'PrescriptionDetail.medicationId', '=', 'Medication.medicationId')
                .select(
                    'Medication.medicationId',
                    'Medication.name',
                    'Medication.category'
                )
                .count('PrescriptionDetail.detailId as prescriptionCount')
                .groupBy('PrescriptionDetail.medicationId')
                .orderBy('prescriptionCount', 'desc')
                .limit(limit);
        } catch (error) {
            console.error('Error getting most prescribed medications:', error);
            throw new Error('Unable to get most prescribed medications');
        }
    }
}; 