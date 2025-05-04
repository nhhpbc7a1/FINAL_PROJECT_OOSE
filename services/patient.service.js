import db from '../ultis/db.js';

export default {
    async findAll() {
        try {
            return await db('Patient')
                .join('User', 'Patient.userId', '=', 'User.userId')
                .select(
                    'Patient.*',
                    'User.email',
                    'User.fullName',
                    'User.phoneNumber',
                    'User.address',
                    'User.accountStatus'
                );
        } catch (error) {
            console.error('Error fetching patients:', error);
            throw new Error('Unable to load patients');
        }
    },

    async findById(patientId) {
        try {
            const patient = await db('Patient')
                .join('User', 'Patient.userId', '=', 'User.userId')
                .select(
                    'Patient.*',
                    'User.email',
                    'User.fullName',
                    'User.phoneNumber',
                    'User.address',
                    'User.accountStatus'
                )
                .where('Patient.patientId', patientId)
                .first();
            return patient || null;
        } catch (error) {
            console.error(`Error fetching patient with ID ${patientId}:`, error);
            throw new Error('Unable to find patient');
        }
    },

    async findByUserId(userId) {
        try {
            const patient = await db('Patient')
                .where('userId', userId)
                .first();
            return patient || null;
        } catch (error) {
            console.error(`Error fetching patient with user ID ${userId}:`, error);
            throw new Error('Unable to find patient');
        }
    },

    async search(query) {
        try {
            return await db('Patient')
                .join('User', 'Patient.userId', '=', 'User.userId')
                .select(
                    'Patient.*',
                    'User.email',
                    'User.fullName',
                    'User.phoneNumber',
                    'User.address',
                    'User.accountStatus'
                )
                .where('User.fullName', 'like', `%${query}%`)
                .orWhere('User.email', 'like', `%${query}%`)
                .orWhere('User.phoneNumber', 'like', `%${query}%`)
                .orWhere('Patient.healthInsuranceNumber', 'like', `%${query}%`);
        } catch (error) {
            console.error(`Error searching patients with query "${query}":`, error);
            throw new Error('Unable to search patients');
        }
    },

    async add(patient) {
        try {
            const [patientId] = await db('Patient').insert(patient);
            return patientId;
        } catch (error) {
            console.error('Error adding patient:', error);
            throw new Error('Unable to add patient');
        }
    },

    async update(patientId, patient) {
        try {
            const result = await db('Patient')
                .where('patientId', patientId)
                .update(patient);
            return result > 0;
        } catch (error) {
            console.error(`Error updating patient with ID ${patientId}:`, error);
            throw new Error('Unable to update patient');
        }
    },

    async delete(patientId) {
        try {
            const result = await db('Patient')
                .where('patientId', patientId)
                .delete();
            return result > 0;
        } catch (error) {
            console.error(`Error deleting patient with ID ${patientId}:`, error);
            throw new Error('Unable to delete patient');
        }
    },

    async countByGender() {
        try {
            return await db('Patient')
                .select('gender')
                .count('patientId as count')
                .groupBy('gender');
        } catch (error) {
            console.error('Error counting patients by gender:', error);
            throw new Error('Unable to count patients by gender');
        }
    },

    async countByBloodType() {
        try {
            return await db('Patient')
                .select('bloodType')
                .count('patientId as count')
                .groupBy('bloodType');
        } catch (error) {
            console.error('Error counting patients by blood type:', error);
            throw new Error('Unable to count patients by blood type');
        }
    },

    async countByAgeGroup() {
        try {
            // Calculate age groups by DOB
            return await db.raw(`
                SELECT 
                    CASE 
                        WHEN TIMESTAMPDIFF(YEAR, dob, CURDATE()) < 18 THEN 'Under 18'
                        WHEN TIMESTAMPDIFF(YEAR, dob, CURDATE()) BETWEEN 18 AND 30 THEN '18-30'
                        WHEN TIMESTAMPDIFF(YEAR, dob, CURDATE()) BETWEEN 31 AND 45 THEN '31-45'
                        WHEN TIMESTAMPDIFF(YEAR, dob, CURDATE()) BETWEEN 46 AND 65 THEN '46-65'
                        ELSE 'Over 65'
                    END AS age_group,
                    COUNT(*) as count
                FROM Patient
                GROUP BY age_group
                ORDER BY 
                    CASE age_group
                        WHEN 'Under 18' THEN 1
                        WHEN '18-30' THEN 2
                        WHEN '31-45' THEN 3
                        WHEN '46-65' THEN 4
                        WHEN 'Over 65' THEN 5
                    END
            `);
        } catch (error) {
            console.error('Error counting patients by age group:', error);
            throw new Error('Unable to count patients by age group');
        }
    },

    async getPatientWithAppointmentHistory(patientId) {
        try {
            // Get patient details
            const patient = await this.findById(patientId);
            
            if (!patient) return null;
            
            // Get appointment history
            const appointments = await db('Appointment')
                .join('Specialty', 'Appointment.specialtyId', '=', 'Specialty.specialtyId')
                .leftJoin('Doctor', 'Appointment.doctorId', '=', 'Doctor.doctorId')
                .leftJoin('User as DoctorUser', 'Doctor.userId', '=', 'DoctorUser.userId')
                .leftJoin('Room', 'Appointment.roomId', '=', 'Room.roomId')
                .select(
                    'Appointment.*',
                    'Specialty.name as specialtyName',
                    'DoctorUser.fullName as doctorName',
                    'Room.roomNumber'
                )
                .where('Appointment.patientId', patientId)
                .orderBy('Appointment.appointmentDate', 'desc')
                .orderBy('Appointment.estimatedTime', 'desc');
            
            // Return patient with appointments
            return {
                ...patient,
                appointments
            };
        } catch (error) {
            console.error(`Error fetching patient with appointment history for ID ${patientId}:`, error);
            throw new Error('Unable to get patient with appointment history');
        }
    }
}; 