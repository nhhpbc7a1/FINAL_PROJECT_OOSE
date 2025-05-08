import db from '../../ultis/db.js';

export default {
    async getPatientDetails(patientId) {
        try {
            // Lấy thông tin chi tiết bệnh nhân
            const patient = await db('Patient')
                .join('User', 'Patient.userId', '=', 'User.userId')
                .select(
                    'Patient.*',
                    'User.email',
                    'User.fullName',
                    'User.phoneNumber',
                    'User.address',
                    'User.accountStatus',
                    'User.gender as userGender',
                    'User.dob as userDob'
                )
                .where('Patient.patientId', patientId)
                .first();
                
            if (!patient) return null;
            
            // Lấy lịch sử cuộc hẹn của bệnh nhân
            const appointments = await db('Appointment')
                .join('Specialty', 'Appointment.specialtyId', '=', 'Specialty.specialtyId')
                .leftJoin('Doctor', 'Appointment.doctorId', '=', 'Doctor.doctorId')
                .leftJoin('User as DoctorUser', 'Doctor.userId', '=', 'DoctorUser.userId')
                .leftJoin('Room', 'Appointment.roomId', '=', 'Room.roomId')
                .select(
                    'Appointment.*',
                    'Specialty.name as specialtyName',
                    'DoctorUser.fullName as doctorName',
                    'Room.roomNumber',
                    'Appointment.patientAppointmentStatus'
                )
                .where('Appointment.patientId', patientId)
                .orderBy('Appointment.appointmentDate', 'desc')
                .orderBy('Appointment.estimatedTime', 'desc');
                
            // Lấy kết quả xét nghiệm của bệnh nhân
            const labResults = await db('TestResult')
                .join('MedicalRecord', 'TestResult.recordId', '=', 'MedicalRecord.recordId')
                .join('Appointment', 'MedicalRecord.appointmentId', '=', 'Appointment.appointmentId')
                .join('Service', 'TestResult.serviceId', '=', 'Service.serviceId')
                .leftJoin('LabTechnician', 'TestResult.technicianId', '=', 'LabTechnician.technicianId')
                .leftJoin('User as TechUser', 'LabTechnician.userId', '=', 'TechUser.userId')
                .leftJoin('File', 'TestResult.resultFileId', '=', 'File.fileId')
                .select(
                    'TestResult.*',
                    'Service.name as serviceName',
                    'TechUser.fullName as technicianName',
                    'File.filePath',
                    'MedicalRecord.appointmentId',
                    'Appointment.appointmentDate'
                )
                .where('Appointment.patientId', patientId)
                .orderBy('TestResult.performedDate', 'desc');
                
            // Lấy đơn thuốc của bệnh nhân
            const prescriptions = await db('Prescription')
                .join('MedicalRecord', 'Prescription.recordId', '=', 'MedicalRecord.recordId')
                .join('Appointment', 'MedicalRecord.appointmentId', '=', 'Appointment.appointmentId')
                .join('Doctor', 'Prescription.doctorId', '=', 'Doctor.doctorId')
                .join('User as DoctorUser', 'Doctor.userId', '=', 'DoctorUser.userId')
                .leftJoin('PrescriptionDetail', 'Prescription.prescriptionId', '=', 'PrescriptionDetail.prescriptionId')
                .leftJoin('Medication', 'PrescriptionDetail.medicationId', '=', 'Medication.medicationId')
                .select(
                    'Prescription.*',
                    'MedicalRecord.diagnosis',
                    'DoctorUser.fullName as doctorName',
                    db.raw('GROUP_CONCAT(Medication.name) as medications')
                )
                .where('Appointment.patientId', patientId)
                .groupBy(
                    'Prescription.prescriptionId',
                    'MedicalRecord.diagnosis',
                    'DoctorUser.fullName'
                )
                .orderBy('Prescription.prescriptionDate', 'desc');
                
            // Tính tuổi từ ngày sinh
            const dob = new Date(patient.dob || patient.userDob);
            const today = new Date();
            const ageDifMs = today - dob;
            const ageDate = new Date(ageDifMs);
            const age = Math.abs(ageDate.getUTCFullYear() - 1970);
            
            // Tìm cuộc hẹn gần nhất
            let lastVisit = null;
            if (appointments.length > 0) {
                const latestAppointment = appointments[0]; 
                lastVisit = new Date(latestAppointment.appointmentDate);
            }
            
            // Kết hợp tất cả thông tin
            return {
                ...patient,
                age,
                lastVisit,
                appointments,
                labResults,
                prescriptions
            };
        } catch (error) {
            console.error(`Error fetching patient details for ID ${patientId}:`, error);
            throw new Error('Unable to get patient details');
        }
    },

    /**
     * Get just basic patient info including userId
     * @param {number} patientId 
     * @returns {Promise<Object>} Basic patient info or null
     */
    async getPatientBasicInfo(patientId) {
        try {
            return await db('Patient')
                .join('User', 'Patient.userId', '=', 'User.userId')
                .select(
                    'Patient.patientId',
                    'Patient.userId',
                    'User.fullName',
                    'User.email'
                )
                .where('Patient.patientId', patientId)
                .first();
        } catch (error) {
            console.error(`Error fetching basic info for patient ${patientId}:`, error);
            return null;
        }
    }
}; 