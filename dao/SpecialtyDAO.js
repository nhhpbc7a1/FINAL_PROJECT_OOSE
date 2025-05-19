import db from '../ultis/db.js';

/**
 * Data Access Object for Specialty-related database operations
 */
class SpecialtyDAO {
    /**
     * Get all specialties
     * @returns {Promise<Array>} Array of specialty objects
     */
    static async findAll() {
        try {
            // Join with Doctor and User to get the head doctor's name
            return await db('Specialty')
                .leftJoin('Doctor', 'Specialty.headDoctorId', '=', 'Doctor.doctorId')
                .leftJoin('User', 'Doctor.userId', '=', 'User.userId')
                .select(
                    'Specialty.*',
                    'User.fullName as headDoctorName'
                )
                .orderBy('Specialty.name');
        } catch (error) {
            console.error('Error fetching specialties:', error);
            throw new Error('Unable to load specialties');
        }
    }

    /**
     * Get all active specialties
     * @returns {Promise<Array>} Array of active specialty objects
     */
    static async getAllActive() {
        try {
            // Query to get all specialties
            const query = db('Specialty')
                .leftJoin('Doctor', 'Specialty.headDoctorId', '=', 'Doctor.doctorId')
                .leftJoin('User', 'Doctor.userId', '=', 'User.userId')
                .select(
                    'Specialty.specialtyId as id',
                    'Specialty.name',
                    'Specialty.description',
                    'Specialty.icon',
                    'User.fullName as headDoctorName'
                )
                .orderBy('Specialty.name');
            
            // Check if the status column exists in Specialty table
            try {
                const hasStatusColumn = await db.schema.hasColumn('Specialty', 'status');
                if (hasStatusColumn) {
                    query.where('Specialty.status', 'active');
                }
            } catch (e) {
                // If error checking column, assume no status column exists
                console.log('Assuming no status column in Specialty table');
            }
            
            return await query;
        } catch (error) {
            console.error('Error fetching active specialties:', error);
            throw new Error('Unable to load active specialties');
        }
    }

    /**
     * Find a specialty by ID
     * @param {number} specialtyId - Specialty ID to find
     * @returns {Promise<Object|null>} Specialty object or null
     */
    static async findById(specialtyId) {
        try {
            const specialty = await db('Specialty')
                .leftJoin('Doctor', 'Specialty.headDoctorId', '=', 'Doctor.doctorId')
                .leftJoin('User', 'Doctor.userId', '=', 'User.userId')
                .select(
                    'Specialty.*',
                    'User.fullName as headDoctorName'
                )
                .where('Specialty.specialtyId', specialtyId)
                .first();
                
            if (specialty && specialty.icon) {
                // Ensure icon path is properly formatted
                if (!specialty.icon.startsWith('http') && !specialty.icon.startsWith('/')) {
                    specialty.icon = '/' + specialty.icon;
                }
            }
            
            return specialty || null;
        } catch (error) {
            console.error(`Error fetching specialty with ID ${specialtyId}:`, error);
            throw new Error('Unable to find specialty');
        }
    }

    /**
     * Check if a specialty name is unique
     * @param {string} name - Name to check
     * @param {number|null} excludeId - ID to exclude from check (for updates)
     * @returns {Promise<boolean>} True if name is unique
     */
    static async isNameUnique(name, excludeId = null) {
        try {
            const query = db('Specialty').where('name', name);
            if (excludeId) {
                query.andWhereNot('specialtyId', excludeId);
            }
            const existing = await query.first();
            return !existing; // Return true if no existing record found
        } catch (error) {
            console.error('Error checking specialty name uniqueness:', error);
            // Treat errors as non-unique to be safe
            return false;
        }
    }

    /**
     * Add a new specialty
     * @param {Object} specialty - Specialty data to add
     * @returns {Promise<number>} ID of the new specialty
     */
    static async add(specialty) {
        try {
            // Prepare data for insertion
             const specialtyData = {
                name: specialty.name,
                description: specialty.description || null,
                hospitalId: specialty.hospitalId || 1, // Default to 1 or handle as needed
                // Handle potential empty string or null for headDoctorId
                headDoctorId: specialty.headDoctorId ? parseInt(specialty.headDoctorId, 10) : null,
                icon: specialty.icon || '/public/images/specialties/default-specialty.jpg'
            };

            // Add status if provided
            if (specialty.status) {
                specialtyData.status = specialty.status;
            }

            const [specialtyId] = await db('Specialty').insert(specialtyData);
            return specialtyId;
        } catch (error) {
            console.error('Error adding specialty:', error);
            if (error.code === 'ER_DUP_ENTRY') {
                 throw new Error(`Specialty name "${specialty.name}" already exists.`);
             } else if (error.code === 'ER_NO_REFERENCED_ROW_2') {
                 throw new Error('Invalid Head Doctor ID or Hospital ID provided.');
             }
            throw new Error('Unable to add specialty');
        }
    }

    /**
     * Update a specialty
     * @param {number} specialtyId - ID of the specialty to update
     * @param {Object} specialty - Specialty data to update
     * @returns {Promise<boolean>} True if update was successful
     */
    static async update(specialtyId, specialty) {
        try {
             // Prepare data for update
             const specialtyData = {};
             if (specialty.hasOwnProperty('name')) specialtyData.name = specialty.name;
             if (specialty.hasOwnProperty('description')) specialtyData.description = specialty.description;
             if (specialty.hasOwnProperty('hospitalId')) specialtyData.hospitalId = specialty.hospitalId;
             // Allow setting headDoctorId to null
             if (specialty.hasOwnProperty('headDoctorId')) {
                specialtyData.headDoctorId = specialty.headDoctorId ? parseInt(specialty.headDoctorId, 10) : null;
             }
             if (specialty.hasOwnProperty('icon')) specialtyData.icon = specialty.icon;
             if (specialty.hasOwnProperty('status')) specialtyData.status = specialty.status;

            if (Object.keys(specialtyData).length === 0) {
                 return true; // Nothing to update
             }

            const result = await db('Specialty')
                .where('specialtyId', specialtyId)
                .update(specialtyData);

            return result > 0;
        } catch (error) {
            console.error(`Error updating specialty with ID ${specialtyId}:`, error);
             if (error.code === 'ER_DUP_ENTRY') {
                 throw new Error(`Specialty name "${specialty.name}" already exists.`);
             } else if (error.code === 'ER_NO_REFERENCED_ROW_2') {
                 throw new Error('Invalid Head Doctor ID or Hospital ID provided.');
             }
            throw new Error('Unable to update specialty');
        }
    }

    /**
     * Check if a specialty has dependencies
     * @param {number} specialtyId - ID of the specialty to check
     * @returns {Promise<Object>} Object with dependency information
     */
    static async checkDependencies(specialtyId) {
        try {
            const hasDoctors = await db('Doctor').where('specialtyId', specialtyId).first();
            const hasTechnicians = await db('LabTechnician').where('specialtyId', specialtyId).first();
            const hasServices = await db('Service').where('specialtyId', specialtyId).first();
            const hasRooms = await db('Room').where('specialtyId', specialtyId).first();
            const hasAppointments = await db('Appointment').where('specialtyId', specialtyId).first();

            return {
                hasDoctors: !!hasDoctors,
                hasTechnicians: !!hasTechnicians,
                hasServices: !!hasServices,
                hasRooms: !!hasRooms,
                hasAppointments: !!hasAppointments
            };
        } catch (error) {
            console.error(`Error checking dependencies for specialty with ID ${specialtyId}:`, error);
            throw new Error('Unable to check specialty dependencies');
        }
    }

    /**
     * Delete a specialty
     * @param {number} specialtyId - ID of the specialty to delete
     * @returns {Promise<boolean>} True if deletion was successful
     */
    static async delete(specialtyId) {
        try {
            // IMPORTANT: Dependency checks should happen before calling this.
            const result = await db('Specialty')
                .where('specialtyId', specialtyId)
                .delete();
            return result > 0;
        } catch (error) {
            console.error(`Error deleting specialty with ID ${specialtyId}:`, error);
             // Catch potential DB-level constraint errors
             if (error.code === 'ER_ROW_IS_REFERENCED_2') {
                 throw new Error('Cannot delete specialty because it is referenced by other records (Doctors, Services, Rooms, etc.).');
             }
            throw new Error('Unable to delete specialty');
        }
    }
}

export default SpecialtyDAO; 