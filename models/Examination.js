import MedicalRecordDAO from '../dao/MedicalRecordDAO.js';
import ExaminationObserver from '../observers/implementations/ExaminationObserver.js';
import notificationSubject from '../observers/implementations/NotificationSubject.js';
import NotificationDAO from '../dao/NotificationDAO.js';
import PatientDAO from '../dao/PatientDAO.js';
import DoctorDAO from '../dao/DoctorDAO.js';

class Examination {
    constructor(data = {}) {
        this.examinationId = data.examinationId;
        this.patientId = data.patientId;
        this.doctorId = data.doctorId;
        this.diagnosis = data.diagnosis;
    }

    async complete(diagnosis) {
        try {
            // Update medical record with examination data
            await MedicalRecordDAO.update(this.examinationId, {
                diagnosis: diagnosis
            });

            // Get user IDs from Patient and Doctor
            const patient = await PatientDAO.findById(this.patientId);
            const doctor = await DoctorDAO.findById(this.doctorId);

            if (!patient || !doctor) {
                throw new Error('Could not find patient or doctor information');
            }

            // Create observers for patient and doctor using their user IDs
            const patientObserver = new ExaminationObserver(patient.userId);
            const doctorObserver = new ExaminationObserver(doctor.userId);

            // Attach observers
            notificationSubject.attach(patientObserver, 'examination');
            notificationSubject.attach(doctorObserver, 'examination');

            // Create notification data
            const notificationData = {
                examinationId: this.examinationId,
                diagnosis: diagnosis,
                additionalInfo: 'Please check your examination details.'
            };

            // Notify observers
            notificationSubject.notify('examination', notificationData);

            // Also create notifications directly (as backup)
            await NotificationDAO.create({
                userId: patient.userId,
                title: 'Examination Completed',
                content: `Your examination has been completed. ${notificationData.additionalInfo}`,
                isRead: false
            });

            await NotificationDAO.create({
                userId: doctor.userId,
                title: 'Examination Completed',
                content: `Examination for patient has been completed. ${notificationData.additionalInfo}`,
                isRead: false
            });

            console.log('Created notifications for:', {
                patientUserId: patient.userId,
                doctorUserId: doctor.userId
            });

            return true;
        } catch (error) {
            console.error('Error in examination completion:', error);
            throw error;
        }
    }
}

export default Examination; 