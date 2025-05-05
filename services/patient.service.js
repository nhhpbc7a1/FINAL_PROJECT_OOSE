import db from '../ultis/db.js';

export default {
    async findAll() {
        try {
            return await db('Patient')
                .join('User', 'Patient.userId', '=', 'User.userId')
                .select(
                    'Patient.patientId', // Explicitly select Patient ID
                    'Patient.userId',    // Explicitly select User ID link
                    'Patient.dob as patientDob', // Keep patient specific DOB, distinct from user's if needed
                    'Patient.gender as patientGender', // Keep patient specific Gender
                    'Patient.bloodType', // Keep blood type for now, requested to remove insurance/emergency contact
                    // REMOVED: 'Patient.healthInsuranceNumber',
                    // REMOVED: 'Patient.emergencyContact',
                    'Patient.medicalHistory', // Keep medical history

                    'User.email',
                    'User.fullName',
                    'User.phoneNumber',
                    'User.address',
                    'User.accountStatus',
                    'User.gender as userGender', // Keep user's gender, maybe useful
                    'User.dob as userDob',       // Keep user's dob, maybe useful
                    'User.profileImage',
                    'User.createdDate'
                )
                .orderBy('User.fullName');
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
                    'Patient.*', // Select all patient-specific fields initially for simplicity
                    // Or explicitly list needed fields if preferred
                    // 'Patient.patientId', 'Patient.userId', 'Patient.dob as patientDob', 'Patient.gender as patientGender', 'Patient.bloodType', 'Patient.medicalHistory',
                    // REMOVED: 'Patient.healthInsuranceNumber', 'Patient.emergencyContact',

                    'User.email',
                    'User.fullName',
                    'User.phoneNumber',
                    'User.address',
                    'User.accountStatus',
                    'User.gender as userGender',
                    'User.dob as userDob',
                    'User.profileImage',
                    'User.createdDate'
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
                 .join('User', 'Patient.userId', '=', 'User.userId')
                 .select(
                    'Patient.*', // Select all patient-specific fields initially for simplicity
                    // Or explicitly list needed fields
                    // 'Patient.patientId', 'Patient.userId', 'Patient.dob as patientDob', 'Patient.gender as patientGender', 'Patient.bloodType', 'Patient.medicalHistory',
                    // REMOVED: 'Patient.healthInsuranceNumber', 'Patient.emergencyContact',

                    'User.email',
                    'User.fullName',
                    'User.phoneNumber',
                    'User.address',
                    'User.accountStatus',
                    'User.gender as userGender',
                    'User.dob as userDob',
                    'User.profileImage',
                    'User.createdDate'
                 )
                .where('Patient.userId', userId)
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
                     'Patient.patientId', // Explicitly select Patient ID
                     'Patient.userId',    // Explicitly select User ID link
                     'Patient.dob as patientDob',
                     'Patient.gender as patientGender',
                     'Patient.bloodType',
                     'Patient.medicalHistory',
                     // REMOVED: 'Patient.healthInsuranceNumber',
                     // REMOVED: 'Patient.emergencyContact',

                    'User.email',
                    'User.fullName',
                    'User.phoneNumber',
                    'User.address',
                    'User.accountStatus',
                    'User.gender as userGender',
                    'User.dob as userDob',
                    'User.profileImage',
                    'User.createdDate'
                )
                 .where(builder => {
                    builder.where('User.fullName', 'like', `%${query}%`)
                           .orWhere('User.email', 'like', `%${query}%`)
                           .orWhere('User.phoneNumber', 'like', `%${query}%`)
                           .orWhere('User.address', 'like', `%${query}%`)
                           // REMOVED: .orWhere('Patient.healthInsuranceNumber', 'like', `%${query}%`)
                           // REMOVED: .orWhere('Patient.emergencyContact', 'like', `%${query}%`);
                 })
                 .orderBy('User.fullName');
        } catch (error) {
            console.error(`Error searching patients with query "${query}":`, error);
            throw new Error('Unable to search patients');
        }
    }
};