import Doctor from '../../models/Doctor.js';
import PatientDAO from '../../dao/PatientDAO.js';

export default {
    async findAll(doctorId) {
        try {
            // Validate doctor exists
            const doctor = await Doctor.findById(doctorId);
            if (!doctor) {
                throw new Error(`Doctor with ID ${doctorId} not found`);
            }
            
            // Get patients with their latest appointments for this doctor
            const patients = await PatientDAO.findByDoctorWithLastVisit(doctorId);
                
            console.log(`Found ${patients.length} patients for doctor ID ${doctorId}`);
            // Add debug for patient status
            if (patients.length > 0) {
                console.log('Sample patient data:', {
                    patientId: patients[0].patientId,
                    fullName: patients[0].fullName,
                    appointmentStatus: patients[0].appointmentStatus || 'no status'
                });
            }
            return patients;
        } catch (error) {
            console.error('Error fetching patients with appointment statuses:', error);
            throw new Error('Unable to load patients: ' + error.message);
        }
    }
}; 