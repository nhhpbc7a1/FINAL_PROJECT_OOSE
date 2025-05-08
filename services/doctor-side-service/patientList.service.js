import db from '../../ultis/db.js';

export default {
    async findAll(doctorId) {
        try {
            // First, get the latest appointment for each patient with this doctor
            const latestAppointmentsSubquery = db('Appointment')
                .select(
                    'patientId',
                    db.raw('MAX(appointmentDate) as latestDate')
                )
                .where('doctorId', '=', doctorId)
                .groupBy('patientId')
                .as('LatestApp');
            
            // Query to get patients assigned to this doctor through appointments
            const patients = await db('Patient')
                .join('User', 'Patient.userId', '=', 'User.userId')
                .join('Appointment', 'Patient.patientId', '=', 'Appointment.patientId')
                .where('Appointment.doctorId', '=', doctorId)
                .distinct(
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
                    'User.accountStatus'
                )
                // Join with the latest appointment subquery
                .leftJoin(latestAppointmentsSubquery, 'Patient.patientId', '=', 'LatestApp.patientId')
                // Join again with appointments to get the status of the latest appointment
                .leftJoin('Appointment as LatestAppointment', function() {
                    this.on('Patient.patientId', '=', 'LatestAppointment.patientId')
                        .andOn('LatestAppointment.appointmentDate', '=', 'LatestApp.latestDate');
                })
                .select(
                    'LatestApp.latestDate as lastVisitDate',
                    'LatestAppointment.patientAppointmentStatus as appointmentStatus'
                )
                .orderBy('User.fullName', 'asc');
                
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
            throw new Error('Unable to load patients');
        }
    }
}; 