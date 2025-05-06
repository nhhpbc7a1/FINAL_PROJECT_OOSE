import db from '../../ultis/db.js';

export default {
    async findAll() {
        try {
            const patients = await db('Patient')
                .join('User', 'Patient.userId', '=', 'User.userId')
                .leftJoin(
                    db('Appointment')
                    .select('patientId', 
                           db.raw('MAX(appointmentDate) as latestDate'),
                           'patientAppointmentStatus')
                    .groupBy('patientId')
                    .as('LatestApp'), 
                    'Patient.patientId', '=', 'LatestApp.patientId'
                )
                .select(
                    'Patient.patientId',
                    'Patient.userId',
                    'Patient.dob',
                    'Patient.gender',
                    'Patient.bloodType',
                    'Patient.medicalHistory',
                    'User.email',
                    'User.fullName',
                    'User.phoneNumber',
                    'User.address',
                    'User.accountStatus',
                    'LatestApp.latestDate as lastVisitDate',
                    'LatestApp.patientAppointmentStatus as appointmentStatus'
                )
                .orderBy('User.fullName', 'asc');
                
            console.log("Patients with latest appointment data:", patients.slice(0, 2));
            return patients;
        } catch (error) {
            console.error('Error fetching patients with appointment statuses:', error);
            throw new Error('Unable to load patients');
        }
    }
}; 