import db from '../ultis/db.js';

export default {
    async findAll() {
        try {
            return await db('MedicalRecord')
                .join('Appointment', 'MedicalRecord.appointmentId', '=', 'Appointment.appointmentId')
                .join('Patient', 'Appointment.patientId', '=', 'Patient.patientId')
                .join('User as PatientUser', 'Patient.userId', '=', 'PatientUser.userId')
                .join('Doctor', 'Appointment.doctorId', '=', 'Doctor.doctorId')
                .join('User as DoctorUser', 'Doctor.userId', '=', 'DoctorUser.userId')
                .join('Specialty', 'Appointment.specialtyId', '=', 'Specialty.specialtyId')
                .select(
                    'MedicalRecord.*',
                    'Appointment.appointmentDate',
                    'PatientUser.fullName as patientName',
                    'DoctorUser.fullName as doctorName',
                    'Specialty.name as specialtyName'
                )
                .orderBy('MedicalRecord.createdDate', 'desc');
        } catch (error) {
            console.error('Error fetching medical records:', error);
            throw new Error('Unable to load medical records');
        }
    },

    async findById(recordId) {
        try {
            const record = await db('MedicalRecord')
                .join('Appointment', 'MedicalRecord.appointmentId', '=', 'Appointment.appointmentId')
                .join('Patient', 'Appointment.patientId', '=', 'Patient.patientId')
                .join('User as PatientUser', 'Patient.userId', '=', 'PatientUser.userId')
                .join('Doctor', 'Appointment.doctorId', '=', 'Doctor.doctorId')
                .join('User as DoctorUser', 'Doctor.userId', '=', 'DoctorUser.userId')
                .join('Specialty', 'Appointment.specialtyId', '=', 'Specialty.specialtyId')
                .select(
                    'MedicalRecord.*',
                    'Appointment.appointmentDate',
                    'Appointment.appointmentId',
                    'Appointment.reason',
                    'Patient.patientId',
                    'PatientUser.fullName as patientName',
                    'Patient.gender as patientGender',
                    'Patient.dob as patientDob',
                    'Doctor.doctorId',
                    'DoctorUser.fullName as doctorName',
                    'Specialty.name as specialtyName'
                )
                .where('MedicalRecord.recordId', recordId)
                .first();
            return record || null;
        } catch (error) {
            console.error(`Error fetching medical record with ID ${recordId}:`, error);
            throw new Error('Unable to find medical record');
        }
    },

    async findByAppointment(appointmentId) {
        try {
            const record = await db('MedicalRecord')
                .where('appointmentId', appointmentId)
                .first();
            return record || null;
        } catch (error) {
            console.error(`Error fetching medical record for appointment ID ${appointmentId}:`, error);
            throw new Error('Unable to find medical record by appointment');
        }
    },

    async findByPatient(patientId) {
        try {
            return await db('MedicalRecord')
                .join('Appointment', 'MedicalRecord.appointmentId', '=', 'Appointment.appointmentId')
                .join('Doctor', 'Appointment.doctorId', '=', 'Doctor.doctorId')
                .join('User as DoctorUser', 'Doctor.userId', '=', 'DoctorUser.userId')
                .join('Specialty', 'Appointment.specialtyId', '=', 'Specialty.specialtyId')
                .select(
                    'MedicalRecord.*',
                    'Appointment.appointmentDate',
                    'DoctorUser.fullName as doctorName',
                    'Specialty.name as specialtyName'
                )
                .where('Appointment.patientId', patientId)
                .orderBy('MedicalRecord.createdDate', 'desc');
        } catch (error) {
            console.error(`Error fetching medical records for patient ID ${patientId}:`, error);
            throw new Error('Unable to find medical records by patient');
        }
    },

    async findByDoctor(doctorId) {
        try {
            return await db('MedicalRecord')
                .join('Appointment', 'MedicalRecord.appointmentId', '=', 'Appointment.appointmentId')
                .join('Patient', 'Appointment.patientId', '=', 'Patient.patientId')
                .join('User as PatientUser', 'Patient.userId', '=', 'PatientUser.userId')
                .join('Specialty', 'Appointment.specialtyId', '=', 'Specialty.specialtyId')
                .select(
                    'MedicalRecord.*',
                    'Appointment.appointmentDate',
                    'PatientUser.fullName as patientName',
                    'Specialty.name as specialtyName'
                )
                .where('Appointment.doctorId', doctorId)
                .orderBy('MedicalRecord.createdDate', 'desc');
        } catch (error) {
            console.error(`Error fetching medical records for doctor ID ${doctorId}:`, error);
            throw new Error('Unable to find medical records by doctor');
        }
    },

    async add(record) {
        try {
            const [recordId] = await db('MedicalRecord').insert(record);
            return recordId;
        } catch (error) {
            console.error('Error adding medical record:', error);
            throw new Error('Unable to add medical record');
        }
    },

    async update(recordId, record) {
        try {
            const result = await db('MedicalRecord')
                .where('recordId', recordId)
                .update(record);
            return result > 0;
        } catch (error) {
            console.error(`Error updating medical record with ID ${recordId}:`, error);
            throw new Error('Unable to update medical record');
        }
    },

    async delete(recordId) {
        try {
            const result = await db('MedicalRecord')
                .where('recordId', recordId)
                .delete();
            return result > 0;
        } catch (error) {
            console.error(`Error deleting medical record with ID ${recordId}:`, error);
            throw new Error('Unable to delete medical record');
        }
    },

    async getMedicalRecordWithDetails(recordId) {
        try {
            // Get the base medical record
            const record = await this.findById(recordId);
            
            if (!record) return null;
            
            // Get test results
            const testResults = await db('TestResult')
                .join('Service', 'TestResult.serviceId', '=', 'Service.serviceId')
                .leftJoin('LabTechnician', 'TestResult.technicianId', '=', 'LabTechnician.technicianId')
                .leftJoin('User', 'LabTechnician.userId', '=', 'User.userId')
                .leftJoin('File', 'TestResult.resultFileId', '=', 'File.fileId')
                .select(
                    'TestResult.*',
                    'Service.name as serviceName',
                    'Service.description as serviceDescription',
                    'User.fullName as technicianName',
                    'File.fileName',
                    'File.filePath'
                )
                .where('TestResult.recordId', recordId);
            
            // Get prescriptions
            const prescriptions = await db('Prescription')
                .join('Doctor', 'Prescription.doctorId', '=', 'Doctor.doctorId')
                .join('User', 'Doctor.userId', '=', 'User.userId')
                .select(
                    'Prescription.*',
                    'User.fullName as doctorName'
                )
                .where('Prescription.recordId', recordId);
            
            // Get prescription details for each prescription
            for (const prescription of prescriptions) {
                const prescriptionDetails = await db('PrescriptionDetail')
                    .join('Medication', 'PrescriptionDetail.medicationId', '=', 'Medication.medicationId')
                    .select(
                        'PrescriptionDetail.*',
                        'Medication.name as medicationName',
                        'Medication.description as medicationDescription',
                        'Medication.dosage as recommendedDosage',
                        'Medication.sideEffects'
                    )
                    .where('PrescriptionDetail.prescriptionId', prescription.prescriptionId);
                
                prescription.details = prescriptionDetails;
            }
            
            // Get services provided during the appointment
            const services = await db('AppointmentServices')
                .join('Service', 'AppointmentServices.serviceId', '=', 'Service.serviceId')
                .select(
                    'AppointmentServices.*',
                    'Service.name',
                    'Service.description',
                    'Service.type'
                )
                .where('AppointmentServices.appointmentId', record.appointmentId);
            
            // Return complete medical record with all related information
            return {
                ...record,
                testResults,
                prescriptions,
                services
            };
        } catch (error) {
            console.error(`Error getting medical record with details for ID ${recordId}:`, error);
            throw new Error('Unable to get complete medical record');
        }
    },

    async getPatientMedicalHistory(patientId) {
        try {
            // Get all medical records for the patient
            const records = await this.findByPatient(patientId);
            
            // Get patient basic info
            const patientInfo = await db('Patient')
                .join('User', 'Patient.userId', '=', 'User.userId')
                .select(
                    'Patient.*',
                    'User.fullName',
                    'User.email',
                    'User.phoneNumber',
                    'User.address'
                )
                .where('Patient.patientId', patientId)
                .first();
            
            if (!patientInfo) {
                throw new Error('Patient not found');
            }
            
            // Calculate patient age
            const dob = new Date(patientInfo.dob);
            const ageDifMs = Date.now() - dob.getTime();
            const ageDate = new Date(ageDifMs);
            const age = Math.abs(ageDate.getUTCFullYear() - 1970);
            
            // Format the complete medical history
            return {
                patient: {
                    ...patientInfo,
                    age
                },
                records
            };
        } catch (error) {
            console.error(`Error getting medical history for patient ID ${patientId}:`, error);
            throw new Error('Unable to get patient medical history');
        }
    }
}; 