import db from '../ultis/db.js';

/**
 * Data Access Object for Doctor-related database operations
 */
class DoctorDAO {
    /**
     * Get all doctors
     * @returns {Promise<Array>} Array of doctor objects
     */
    static async findAll() {
        try {
            return await db('Doctor')
                .join('User', 'Doctor.userId', '=', 'User.userId')
                .join('Specialty', 'Doctor.specialtyId', '=', 'Specialty.specialtyId')
                .select(
                    'Doctor.*',
                    'User.email',
                    'User.fullName',
                    'User.phoneNumber',
                    'User.address',
                    'User.accountStatus',
                    'User.gender',
                    'User.dob',
                    'User.profileImage',
                    'Specialty.name as specialtyName'
                );
        } catch (error) {
            console.error('Error fetching doctors:', error);
            throw new Error('Unable to load doctors');
        }
    }

    /**
     * Get all active doctors with basic information for dropdown lists
     * @returns {Promise<Array>} Array of doctor objects with basic info
     */
    static async findAllWithNames() {
        try {
            return await db('Doctor')
                .join('User', 'Doctor.userId', '=', 'User.userId')
                .select(
                    'Doctor.doctorId',
                    'Doctor.userId',
                    'User.fullName',
                    'User.accountStatus'
                )
                .where('User.accountStatus', 'active')
                .orderBy('User.fullName');
        } catch (error) {
            console.error('Error fetching doctors for dropdown:', error);
            throw new Error('Unable to load doctors list');
        }
    }

    /**
     * Find a doctor by ID
     * @param {number} doctorId - Doctor ID to find
     * @returns {Promise<Object|null>} Doctor object or null
     */
    static async findById(doctorId) {
        try {
            const doctor = await db('Doctor')
                .join('User', 'Doctor.userId', '=', 'User.userId')
                .join('Specialty', 'Doctor.specialtyId', '=', 'Specialty.specialtyId')
                .select(
                    'Doctor.*',
                    'User.email',
                    'User.fullName',
                    'User.phoneNumber',
                    'User.address',
                    'User.accountStatus',
                    'User.gender',
                    'User.dob',
                    'User.profileImage',
                    'Specialty.name as specialtyName'
                )
                .where('Doctor.doctorId', doctorId)
                .first();
            return doctor || null;
        } catch (error) {
            console.error(`Error fetching doctor with ID ${doctorId}:`, error);
            throw new Error('Unable to find doctor');
        }
    }

    /**
     * Find a doctor by user ID
     * @param {number} userId - User ID to find
     * @returns {Promise<Object|null>} Doctor object or null
     */
    static async findByUserId(userId) {
        try {
            const doctor = await db('Doctor')
                .where('userId', userId)
                .first();
            return doctor || null;
        } catch (error) {
            console.error(`Error fetching doctor with user ID ${userId}:`, error);
            throw new Error('Unable to find doctor');
        }
    }

    /**
     * Find doctors by specialty
     * @param {number} specialtyId - Specialty ID to filter by
     * @returns {Promise<Array>} Array of doctor objects
     */
    static async findBySpecialty(specialtyId) {
        try {
            return await db('Doctor')
                .join('User', 'Doctor.userId', '=', 'User.userId')
                .join('Specialty', 'Doctor.specialtyId', '=', 'Specialty.specialtyId')
                .select(
                    'Doctor.doctorId',
                    'User.fullName',
                    'Doctor.experience',
                    'Doctor.bio',
                    'Specialty.name as specialtyName',
                    'User.profileImage'
                )
                .where('Doctor.specialtyId', specialtyId)
                .andWhere('User.accountStatus', 'active');
        } catch (error) {
            console.error(`Error fetching doctors by specialty ID ${specialtyId}:`, error);
            throw new Error('Unable to find doctors by specialty');
        }
    }

    /**
     * Search for doctors by name, email, license number, or specialty
     * @param {string} query - Search query
     * @returns {Promise<Array>} Array of matching doctor objects
     */
    static async search(query) {
        try {
            return await db('Doctor')
                .join('User', 'Doctor.userId', '=', 'User.userId')
                .join('Specialty', 'Doctor.specialtyId', '=', 'Specialty.specialtyId')
                .select(
                    'Doctor.*',
                    'User.email',
                    'User.fullName',
                    'User.phoneNumber',
                    'User.address',
                    'User.accountStatus',
                    'User.gender',
                    'User.dob',
                    'Specialty.name as specialtyName'
                )
                .where('User.fullName', 'like', `%${query}%`)
                .orWhere('User.email', 'like', `%${query}%`)
                .orWhere('Doctor.licenseNumber', 'like', `%${query}%`)
                .orWhere('Specialty.name', 'like', `%${query}%`);
        } catch (error) {
            console.error(`Error searching doctors with query "${query}":`, error);
            throw new Error('Unable to search doctors');
        }
    }

    /**
     * Add a new doctor
     * @param {Object} doctor - Doctor data to add
     * @returns {Promise<number>} ID of the new doctor
     */
    static async add(doctor) {
        try {
            const doctorData = {
                userId: doctor.userId,
                specialtyId: doctor.specialtyId,
                licenseNumber: doctor.licenseNumber || 'N/A',
                experience: doctor.experience || 0,
                education: doctor.education || null,
                certifications: doctor.certifications || null,
                bio: doctor.bio || null
            };

            const [doctorId] = await db('Doctor').insert(doctorData);
            return doctorId;
        } catch (error) {
            console.error('Error adding doctor:', error);
            throw new Error('Unable to add doctor');
        }
    }

    /**
     * Update a doctor
     * @param {number} doctorId - ID of the doctor to update
     * @param {Object} doctorData - Doctor data to update
     * @param {Object} userData - User data to update (optional)
     * @returns {Promise<boolean>} True if update was successful
     */
    static async update(doctorId, doctorData, userData = {}) {
        try {
            let result = 0;
            
            // Update doctor table if doctor data provided
            if (Object.keys(doctorData).length > 0) {
                result = await db('Doctor')
                    .where('doctorId', doctorId)
                    .update(doctorData);
            }

            // Update user table if user data provided
            if (Object.keys(userData).length > 0) {
                const doctorRecord = await db('Doctor')
                    .where('doctorId', doctorId)
                    .select('userId')
                    .first();
                
                if (doctorRecord && doctorRecord.userId) {
                    await db('User')
                        .where('userId', doctorRecord.userId)
                        .update(userData);
                    
                    // Ensure we return true if only user data was updated
                    result = result || 1;
                }
            }

            return result > 0;
        } catch (error) {
            console.error(`Error updating doctor with ID ${doctorId}:`, error);
            throw new Error('Unable to update doctor');
        }
    }

    /**
     * Delete a doctor
     * @param {number} doctorId - ID of the doctor to delete
     * @returns {Promise<boolean>} True if deletion was successful
     */
    static async delete(doctorId) {
        try {
            const result = await db('Doctor')
                .where('doctorId', doctorId)
                .delete();
            return result > 0;
        } catch (error) {
            console.error(`Error deleting doctor with ID ${doctorId}:`, error);
            throw new Error('Unable to delete doctor');
        }
    }

    /**
     * Count doctors by specialty
     * @returns {Promise<Array>} Count of doctors by specialty
     */
    static async countBySpecialty() {
        try {
            return await db('Doctor')
                .join('Specialty', 'Doctor.specialtyId', '=', 'Specialty.specialtyId')
                .select('Specialty.name')
                .count('Doctor.doctorId as count')
                .groupBy('Doctor.specialtyId');
        } catch (error) {
            console.error('Error counting doctors by specialty:', error);
            throw new Error('Unable to count doctors by specialty');
        }
    }

    /**
     * Count doctors by experience level
     * @returns {Promise<Array>} Count of doctors by experience range
     */
    static async countByExperience() {
        try {
            const result = await db.raw(`
                SELECT 
                    CASE 
                        WHEN experience < 5 THEN 'Less than 5 years'
                        WHEN experience >= 5 AND experience < 10 THEN '5-10 years'
                        WHEN experience >= 10 AND experience < 20 THEN '10-20 years'
                        ELSE 'Over 20 years'
                    END as experience_range,
                    COUNT(*) as count
                FROM Doctor
                GROUP BY experience_range
                ORDER BY MIN(experience)
            `);
            
            return result[0];
        } catch (error) {
            console.error('Error counting doctors by experience:', error);
            throw new Error('Unable to count doctors by experience');
        }
    }

    /**
     * Get doctor with schedule for a date range
     * @param {number} doctorId - Doctor ID
     * @param {string} startDate - Start date (YYYY-MM-DD)
     * @param {string} endDate - End date (YYYY-MM-DD)
     * @returns {Promise<Object>} Doctor with schedule
     */
    static async getDoctorWithSchedule(doctorId, startDate, endDate) {
        try {
            // Get doctor info
            const doctor = await DoctorDAO.findById(doctorId);
            if (!doctor) {
                throw new Error(`Doctor with ID ${doctorId} not found`);
            }
            
            // Get doctor's schedule for the specified date range
            const schedule = await db('Schedule')
                .where('doctorId', doctorId)
                .andWhere('workDate', '>=', startDate)
                .andWhere('workDate', '<=', endDate)
                .orderBy('workDate');
            
            return {
                ...doctor,
                schedule
            };
        } catch (error) {
            console.error(`Error getting schedule for doctor ID ${doctorId}:`, error);
            throw new Error('Unable to get doctor schedule');
        }
    }

    /**
     * Get doctor with appointments for a specific date
     * @param {number} doctorId - Doctor ID
     * @param {string} date - Date (YYYY-MM-DD)
     * @returns {Promise<Object>} Doctor with appointments
     */
    static async getDoctorWithAppointments(doctorId, date) {
        try {
            // Get doctor info
            const doctor = await DoctorDAO.findById(doctorId);
            if (!doctor) {
                throw new Error(`Doctor with ID ${doctorId} not found`);
            }
            
            // Get doctor's appointments for the specified date
            const appointments = await db('Appointment')
                .where('doctorId', doctorId)
                .andWhere('appointmentDate', date)
                .orderBy('startTime');
            
            return {
                ...doctor,
                appointments
            };
        } catch (error) {
            console.error(`Error getting appointments for doctor ID ${doctorId}:`, error);
            throw new Error('Unable to get doctor appointments');
        }
    }

    /**
     * Get available doctors for a specialty and date
     * @param {number} specialtyId - Specialty ID
     * @param {string} date - Date (YYYY-MM-DD)
     * @returns {Promise<Array>} Array of available doctors
     */
    static async getAvailableDoctors(specialtyId, date) {
        try {
            // First get all active doctors in the specialty
            const doctors = await db('Doctor')
                .join('User', 'Doctor.userId', '=', 'User.userId')
                .join('Specialty', 'Doctor.specialtyId', '=', 'Specialty.specialtyId')
                .select(
                    'Doctor.doctorId',
                    'User.fullName',
                    'Doctor.experience',
                    'Specialty.name as specialtyName'
                )
                .where('Doctor.specialtyId', specialtyId)
                .andWhere('User.accountStatus', 'active');
            
            // Then filter to only those who have a schedule for that day
            const doctorsWithSchedule = await Promise.all(
                doctors.map(async (doctor) => {
                    const schedule = await db('Schedule')
                        .where('doctorId', doctor.doctorId)
                        .andWhere('workDate', date)
                        .first();
                    
                    if (schedule) {
                        return {
                            ...doctor,
                            schedule
                        };
                    }
                    return null;
                })
            );
            
            // Remove doctors without a schedule
            return doctorsWithSchedule.filter(doctor => doctor !== null);
        } catch (error) {
            console.error(`Error getting available doctors for specialty ID ${specialtyId}:`, error);
            throw new Error('Unable to get available doctors');
        }
    }
}

export default DoctorDAO; 