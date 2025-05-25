import db from '../ultis/db.js';

/**
 * Data Access Object for Patient-related database operations
 */
class PatientDAO {
    /**
     * Get all patients
     * @returns {Promise<Array>} Array of patient objects
     */
    static async findAll() {
        try {
            return await db('Patient')
                .join('User', 'Patient.userId', '=', 'User.userId')
                .select(
                    'Patient.*',
                    'User.email',
                    'User.fullName',
                    'User.phoneNumber',
                    'User.address',
                    'User.accountStatus',
                    'User.gender',
                    'User.dob',
                    'User.profileImage'
                );
        } catch (error) {
            console.error('Error fetching patients:', error);
            throw new Error('Unable to load patients');
        }
    }

    /**
     * Find a patient by ID
     * @param {number} patientId - Patient ID
     * @returns {Promise<Object|null>} Patient object or null
     */
    static async findById(patientId) {
        try {
            const patient = await db('Patient')
                .join('User', 'Patient.userId', '=', 'User.userId')
                .select(
                    'Patient.*',
                    'User.email',
                    'User.fullName',
                    'User.phoneNumber',
                    'User.address',
                    'User.accountStatus',
                    'User.gender',
                    'User.dob',
                    'User.profileImage'
                )
                .where('Patient.patientId', patientId)
                .first();
                
            return patient || null;
        } catch (error) {
            console.error(`Error fetching patient with ID ${patientId}:`, error);
            throw new Error('Unable to find patient');
        }
    }

    /**
     * Find detailed patient information by ID
     * @param {number} patientId - Patient ID
     * @returns {Promise<Object|null>} Detailed patient object or null
     */
    static async findDetailedById(patientId) {
        try {
            const patient = await db('Patient')
                .join('User', 'Patient.userId', '=', 'User.userId')
                .select(
                    'Patient.*',
                    'User.email',
                    'User.fullName',
                    'User.phoneNumber',
                    'User.address',
                    'User.accountStatus',
                    'User.gender',
                    'User.dob',
                    'User.profileImage',
                    // Additional medical details
                    'Patient.bloodType',
                    'Patient.medicalHistory'
                )
                .where('Patient.patientId', patientId)
                .first();
                
            if (!patient) return null;
            
            // Add allergies information if available
            try {
                const medicalData = await db('MedicalRecord as mr')
                    .join('Appointment as a', 'mr.appointmentId', '=', 'a.appointmentId')
                    .where('a.patientId', patientId)
                    .orderBy('mr.createdDate', 'desc')
                    .select('mr.diagnosis', 'mr.notes', 'mr.recommendations')
                    .first();
                    
                if (medicalData) {
                    patient.diagnosis = medicalData.diagnosis;
                    patient.medicalNotes = medicalData.notes;
                    patient.recommendations = medicalData.recommendations;
                }
            } catch (err) {
                console.log('No medical records found for patient');
            }
            
            return patient;
        } catch (error) {
            console.error(`Error fetching detailed patient with ID ${patientId}:`, error);
            throw new Error('Unable to find detailed patient information');
        }
    }
    
    /**
     * Find basic patient information by ID
     * @param {number} patientId - Patient ID
     * @returns {Promise<Object|null>} Basic patient object or null
     */
    static async findBasicInfoById(patientId) {
        try {
            const patient = await db('Patient')
                .join('User', 'Patient.userId', '=', 'User.userId')
                .select(
                    'Patient.patientId',
                    'Patient.userId',
                    'User.fullName',
                    'User.gender',
                    'User.dob',
                    'User.email',
                    'User.phoneNumber',
                    'User.profileImage'
                )
                .where('Patient.patientId', patientId)
                .first();
                
            return patient || null;
        } catch (error) {
            console.error(`Error fetching basic patient info with ID ${patientId}:`, error);
            throw new Error('Unable to find basic patient information');
        }
    }

    /**
     * Find a patient by user ID
     * @param {number} userId - User ID
     * @returns {Promise<Object|null>} Patient object or null
     */
    static async findByUserId(userId) {
        try {
            const patient = await db('Patient')
                .join('User', 'Patient.userId', '=', 'User.userId')
                .select(
                    'Patient.*',
                    'User.email',
                    'User.fullName',
                    'User.phoneNumber',
                    'User.address',
                    'User.accountStatus',
                    'User.gender',
                    'User.dob',
                    'User.profileImage'
                )
                .where('Patient.userId', userId)
                .first();
                
            return patient || null;
        } catch (error) {
            console.error(`Error fetching patient with user ID ${userId}:`, error);
            throw new Error('Unable to find patient');
        }
    }

    /**
     * Search for patients by name, email, or phone
     * @param {string} query - Search query
     * @returns {Promise<Array>} Array of matching patient objects
     */
    static async search(query) {
        try {
            return await db('Patient')
                .join('User', 'Patient.userId', '=', 'User.userId')
                .select(
                    'Patient.*',
                    'User.email',
                    'User.fullName',
                    'User.phoneNumber',
                    'User.address',
                    'User.accountStatus',
                    'User.gender',
                    'User.dob',
                    'User.profileImage'
                )
                .where('User.fullName', 'like', `%${query}%`)
                .orWhere('User.email', 'like', `%${query}%`)
                .orWhere('User.phoneNumber', 'like', `%${query}%`);
        } catch (error) {
            console.error(`Error searching patients with query "${query}":`, error);
            throw new Error('Unable to search patients');
        }
    }

    /**
     * Add a new patient
     * @param {Object} patient - Patient data
     * @returns {Promise<number>} ID of the new patient
     */
    static async add(patient) {
        try {
            const [patientId] = await db('Patient').insert({
                userId: patient.userId,
                bloodType: patient.bloodType || null,
                medicalHistory: patient.medicalHistory || null,
                gender: patient.gender || 'other',
                dob: patient.dob || null
            });
            
            return patientId;
        } catch (error) {
            console.error('Error adding patient:', error);
            throw new Error('Unable to add patient');
        }
    }

    /**
     * Update a patient
     * @param {number} patientId - ID of patient to update
     * @param {Object} patientData - Patient data to update
     * @param {Object} userData - User data to update (optional)
     * @returns {Promise<boolean>} True if update was successful
     */
    static async update(patientId, patientData, userData = {}) {
        try {
            let result = 0;
            
            // Update patient table if patient data provided
            if (Object.keys(patientData).length > 0) {
                result = await db('Patient')
                    .where('patientId', patientId)
                    .update(patientData);
            }
            
            // Update user table if user data provided
            if (Object.keys(userData).length > 0) {
                const patientRecord = await db('Patient')
                    .where('patientId', patientId)
                    .select('userId')
                    .first();
                
                if (patientRecord && patientRecord.userId) {
                    await db('User')
                        .where('userId', patientRecord.userId)
                        .update(userData);
                    
                    // Ensure we return true if only user data was updated
                    result = result || 1;
                }
            }
            
            return result > 0;
        } catch (error) {
            console.error(`Error updating patient with ID ${patientId}:`, error);
            throw new Error('Unable to update patient');
        }
    }

    /**
     * Delete a patient
     * @param {number} patientId - ID of patient to delete
     * @returns {Promise<boolean>} True if deletion was successful
     */
    static async delete(patientId) {
        try {
            const result = await db('Patient')
                .where('patientId', patientId)
                .delete();
                
            return result > 0;
        } catch (error) {
            console.error(`Error deleting patient with ID ${patientId}:`, error);
            throw new Error('Unable to delete patient');
        }
    }

    /**
     * Get a patient with their appointment history
     * @param {number} patientId - Patient ID
     * @returns {Promise<Object>} Patient with appointment history
     */
    static async getPatientWithAppointments(patientId) {
        try {
            // Get patient info
            const patient = await PatientDAO.findById(patientId);
            if (!patient) {
                throw new Error(`Patient with ID ${patientId} not found`);
            }
            
            // Get patient's appointments
            const appointments = await db('Appointment')
                .join('Doctor', 'Appointment.doctorId', '=', 'Doctor.doctorId')
                .join('User', 'Doctor.userId', '=', 'User.userId')
                .join('Specialty', 'Doctor.specialtyId', '=', 'Specialty.specialtyId')
                .leftJoin('Room', 'Appointment.roomId', '=', 'Room.roomId')
                .select(
                    'Appointment.*',
                    'User.fullName as doctorName',
                    'Specialty.name as specialtyName',
                    'Room.roomNumber as roomNumber'
                )
                .where('Appointment.patientId', patientId)
                .orderBy('Appointment.appointmentDate', 'desc')
                .orderBy('Appointment.appointmentTime', 'asc');
            
            return {
                ...patient,
                appointments
            };
        } catch (error) {
            console.error(`Error getting patient with appointments for ID ${patientId}:`, error);
            throw new Error('Unable to get patient history');
        }
    }

    /**
     * Get a patient with their medical records
     * @param {number} patientId - Patient ID
     * @returns {Promise<Object>} Patient with medical records
     */
    static async getPatientWithMedicalRecords(patientId) {
        try {
            // Get patient info
            const patient = await PatientDAO.findById(patientId);
            if (!patient) {
                throw new Error(`Patient with ID ${patientId} not found`);
            }
            
            // Get patient's medical records
            const medicalRecords = await db('MedicalRecord')
                .join('Appointment', 'MedicalRecord.appointmentId', '=', 'Appointment.appointmentId')
                .leftJoin('Doctor', 'Appointment.doctorId', '=', 'Doctor.doctorId')
                .leftJoin('User', 'Doctor.userId', '=', 'User.userId')
                .select(
                    'MedicalRecord.*',
                    'User.fullName as doctorName',
                    'Appointment.appointmentDate',
                    'Appointment.reason'
                )
                .where('Appointment.patientId', patientId)
                .orderBy('MedicalRecord.createdDate', 'desc');
            
            return {
                ...patient,
                medicalRecords
            };
        } catch (error) {
            console.error(`Error getting patient with medical records for ID ${patientId}:`, error);
            throw new Error('Unable to get patient medical records');
        }
    }

    /**
     * Count patients by gender
     * @returns {Promise<Object>} Count of patients by gender
     */
    static async countByGender() {
        try {
            const counts = await db('Patient')
                .select('gender')
                .count('patientId as count')
                .groupBy('gender');
            
            // Format into a more useful object
            const result = {
                total: 0,
                male: 0,
                female: 0,
                other: 0
            };
            
            counts.forEach(item => {
                if (item.gender === 'male') result.male = item.count;
                else if (item.gender === 'female') result.female = item.count;
                else result.other += item.count;
                
                result.total += item.count;
            });
            
            return result;
        } catch (error) {
            console.error('Error counting patients by gender:', error);
            throw new Error('Unable to count patients by gender');
        }
    }

    /**
     * Count patients by age group
     * @returns {Promise<Array>} Array of objects with age group and count
     */
    static async countByAgeGroup() {
        try {
            const counts = await db.raw(`
                SELECT 
                    CASE 
                        WHEN TIMESTAMPDIFF(YEAR, dob, CURDATE()) < 18 THEN '0-17'
                        WHEN TIMESTAMPDIFF(YEAR, dob, CURDATE()) BETWEEN 18 AND 30 THEN '18-30'
                        WHEN TIMESTAMPDIFF(YEAR, dob, CURDATE()) BETWEEN 31 AND 45 THEN '31-45'
                        WHEN TIMESTAMPDIFF(YEAR, dob, CURDATE()) BETWEEN 46 AND 60 THEN '46-60'
                        ELSE '60+'
                    END AS ageGroup,
                    COUNT(*) as count
                FROM Patient
                GROUP BY ageGroup
                ORDER BY FIELD(ageGroup, '0-17', '18-30', '31-45', '46-60', '60+')
            `);
            
            return counts[0]; // First element contains the result rows
        } catch (error) {
            console.error('Error counting patients by age group:', error);
            throw new Error('Unable to count patients by age group');
        }
    }

    /**
     * Find patients who have had appointments with a specific doctor and get their last visit information
     * @param {number} doctorId - ID of the doctor
     * @returns {Promise<Array>} Array of patient objects with last visit information
     */
    static async findByDoctorWithLastVisit(doctorId) {
        try {
            // Get all distinct patients who have had appointments with this doctor
            // along with their most recent appointment
            const patients = await db('Appointment as a')
                .join('Patient as p', 'a.patientId', '=', 'p.patientId')
                .join('User as u', 'p.userId', '=', 'u.userId')
                .select(
                    'p.patientId',
                    'u.fullName',
                    'u.gender',
                    'u.dob',
                    'u.email',
                    'u.phoneNumber',
                    'p.bloodType',
                    'u.profileImage',
                    db.raw('MAX(a.appointmentDate) as lastVisitDate'),
                    db.raw(`
                        (SELECT patientAppointmentStatus 
                         FROM Appointment 
                         WHERE patientId = p.patientId AND doctorId = ? 
                         ORDER BY appointmentDate DESC, appointmentTime DESC 
                         LIMIT 1) as appointmentStatus
                    `, [doctorId])
                )
                .where('a.doctorId', doctorId)
                .groupBy('p.patientId', 'u.fullName', 'u.gender', 'u.dob', 'u.email', 
                         'u.phoneNumber', 'p.bloodType', 'u.profileImage')
                .orderBy('lastVisitDate', 'desc');
            
            return patients;
        } catch (error) {
            console.error(`Error finding patients for doctor ID ${doctorId}:`, error);
            throw new Error('Unable to find patients for this doctor');
        }
    }
}

export default PatientDAO; 