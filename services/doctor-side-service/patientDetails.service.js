import Doctor from '../../models/Doctor.js';
import PatientDAO from '../../dao/PatientDAO.js';
import AppointmentDAO from '../../dao/AppointmentDAO.js';
import TestResultDAO from '../../dao/TestResultDAO.js';
import PrescriptionDAO from '../../dao/PrescriptionDAO.js';

export default {
    async getPatientDetails(patientId) {
        try {
            // Lấy thông tin chi tiết bệnh nhân
            const patient = await PatientDAO.findDetailedById(patientId);
                
            if (!patient) return null;
            
            // Lấy lịch sử cuộc hẹn của bệnh nhân
            const appointments = await AppointmentDAO.findByPatient(patientId);
                
            // Lấy kết quả xét nghiệm của bệnh nhân
            const labResults = await TestResultDAO.findByPatientId(patientId);
                
            // Lấy đơn thuốc của bệnh nhân
            const prescriptions = await PrescriptionDAO.findByPatientId(patientId);
                
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
            throw new Error('Unable to get patient details: ' + error.message);
        }
    },

    /**
     * Get just basic patient info including userId
     * @param {number} patientId 
     * @returns {Promise<Object>} Basic patient info or null
     */
    async getPatientBasicInfo(patientId) {
        try {
            return await PatientDAO.findBasicInfoById(patientId);
        } catch (error) {
            console.error(`Error fetching basic info for patient ${patientId}:`, error);
            return null;
        }
    }
}; 