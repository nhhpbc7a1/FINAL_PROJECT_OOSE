import db from '../ultis/db.js';

/**
 * Data Access Object for LabTechnician-related database operations
 */
class LabTechnicianDAO {
    /**
     * Get all lab technicians with related information
     * @returns {Promise<Array>} List of lab technicians
     */
    static async findAll() {
        try {
            return await db('LabTechnician')
                .join('User', 'LabTechnician.userId', '=', 'User.userId')
                .join('Specialty', 'LabTechnician.specialtyId', '=', 'Specialty.specialtyId')
                .select(
                    'LabTechnician.*', // Select all fields from LabTechnician
                    'User.email',
                    'User.fullName',
                    'User.phoneNumber',
                    'User.address',
                    'User.accountStatus',
                    'User.gender',
                    'User.dob',
                    'User.profileImage', // Get profile image from User table
                    'Specialty.name as specialtyName'
                );
        } catch (error) {
            console.error('Error fetching lab technicians:', error);
            throw new Error('Unable to load lab technicians');
        }
    }

    /**
     * Find a lab technician by ID
     * @param {number} technicianId - The lab technician ID
     * @returns {Promise<Object|null>} Lab technician or null if not found
     */
    static async findById(technicianId) {
        try {
            const technician = await db('LabTechnician')
                .join('User', 'LabTechnician.userId', '=', 'User.userId')
                .join('Specialty', 'LabTechnician.specialtyId', '=', 'Specialty.specialtyId')
                .select(
                    'LabTechnician.*',
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
                .where('LabTechnician.technicianId', technicianId)
                .first();
            return technician || null;
        } catch (error) {
            console.error(`Error fetching lab technician with ID ${technicianId}:`, error);
            throw new Error('Unable to find lab technician');
        }
    }

    /**
     * Find a lab technician by user ID
     * @param {number} userId - The user ID
     * @returns {Promise<Object|null>} Lab technician or null if not found
     */
    static async findByUserId(userId) {
        try {
            // Fetch technician data joined with user data if needed later
            const technician = await db('LabTechnician')
                .join('User', 'LabTechnician.userId', '=', 'User.userId')
                .select('LabTechnician.*', 'User.accountStatus') // Select needed fields
                .where('LabTechnician.userId', userId)
                .first();
            return technician || null;
        } catch (error) {
            console.error(`Error fetching lab technician with user ID ${userId}:`, error);
            throw new Error('Unable to find lab technician');
        }
    }

    /**
     * Find lab technicians by specialty
     * @param {number} specialtyId - The specialty ID
     * @returns {Promise<Array>} List of lab technicians with the specialty
     */
    static async findBySpecialty(specialtyId) {
        try {
            return await db('LabTechnician')
                .join('User', 'LabTechnician.userId', '=', 'User.userId')
                .join('Specialty', 'LabTechnician.specialtyId', '=', 'Specialty.specialtyId')
                .select(
                    'LabTechnician.*',
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
                .where('LabTechnician.specialtyId', specialtyId)
                .andWhere('User.accountStatus', 'active'); // Optionally filter by active status
        } catch (error) {
            console.error(`Error fetching technicians by specialty ID ${specialtyId}:`, error);
            throw new Error('Unable to find technicians by specialty');
        }
    }

    /**
     * Find active lab technicians for dropdown selection
     * @returns {Promise<Array>} List of active lab technicians
     */
    static async findAllForDropdown() {
        try {
            return await db('LabTechnician')
                .join('User', 'LabTechnician.userId', '=', 'User.userId')
                .select(
                    'LabTechnician.technicianId',
                    'User.fullName'
                )
                .where('User.accountStatus', 'active')
                .orderBy('User.fullName');
        } catch (error) {
            console.error('Error fetching lab technicians for dropdown:', error);
            throw new Error('Unable to load lab technicians for dropdown');
        }
    }

    /**
     * Search lab technicians by name, email, or specialization
     * @param {string} searchQuery - Search query string
     * @returns {Promise<Array>} List of matching lab technicians
     */
    static async search(searchQuery) {
        try {
            return await db('LabTechnician')
                .join('User', 'LabTechnician.userId', '=', 'User.userId')
                .join('Specialty', 'LabTechnician.specialtyId', '=', 'Specialty.specialtyId')
                .select(
                    'LabTechnician.*',
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
                .where('User.fullName', 'like', `%${searchQuery}%`)
                .orWhere('User.email', 'like', `%${searchQuery}%`)
                .orWhere('LabTechnician.specialization', 'like', `%${searchQuery}%`)
                .orWhere('Specialty.name', 'like', `%${searchQuery}%`)
                .orderBy('User.fullName');
        } catch (error) {
            console.error(`Error searching lab technicians with query "${searchQuery}":`, error);
            throw new Error('Unable to search lab technicians');
        }
    }

    /**
     * Add a new lab technician
     * @param {Object} technician - Lab technician data
     * @returns {Promise<number>} The new lab technician ID
     */
    static async add(technician) {
        try {
            // Only include fields relevant to the LabTechnician table
            const technicianData = {
                userId: technician.userId,
                specialtyId: technician.specialtyId,
                specialization: technician.specialization || null, // Optional field
            };

            const [technicianId] = await db('LabTechnician').insert(technicianData);
            return technicianId;
        } catch (error) {
            console.error('Error adding lab technician:', error);
            // Provide more specific error feedback if possible (e.g., foreign key constraint)
            if (error.code === 'ER_NO_REFERENCED_ROW_2') {
                throw new Error('Invalid User ID or Specialty ID provided.');
            }
            throw new Error('Unable to add lab technician');
        }
    }

    /**
     * Update a lab technician
     * @param {number} technicianId - Lab technician ID to update
     * @param {Object} technicianData - Updated lab technician data
     * @returns {Promise<boolean>} True if update successful
     */
    static async update(technicianId, technicianData) {
        try {
            // Only update fields in the LabTechnician table
            const updateData = {
                specialtyId: technicianData.specialtyId,
                specialization: technicianData.specialization
            };

            const result = await db('LabTechnician')
                .where('technicianId', technicianId)
                .update(updateData);
            return result > 0;
        } catch (error) {
            console.error(`Error updating lab technician ID ${technicianId}:`, error);
            throw new Error('Unable to update lab technician');
        }
    }

    /**
     * Delete a lab technician
     * @param {number} technicianId - Lab technician ID to delete
     * @returns {Promise<boolean>} True if deletion successful
     */
    static async delete(technicianId) {
        try {
            // Note: This only deletes the LabTechnician record.
            // User deactivation should be handled in the route/controller.
            const result = await db('LabTechnician')
                .where('technicianId', technicianId)
                .delete();
            return result > 0;
        } catch (error) {
            console.error(`Error deleting technician with ID ${technicianId}:`, error);
            // Handle foreign key constraint errors (e.g., if TestResult depends on it)
            if (error.code === 'ER_ROW_IS_REFERENCED_2') {
                throw new Error('Cannot delete technician with related records (e.g., test results).');
            }
            throw new Error('Unable to delete technician');
        }
    }

    /**
     * Count lab technicians by specialty
     * @returns {Promise<Array>} Count of lab technicians by specialty
     */
    static async countBySpecialty() {
        try {
            // Count active technicians per specialty
            return await db('LabTechnician')
                .join('Specialty', 'LabTechnician.specialtyId', '=', 'Specialty.specialtyId')
                .join('User', 'LabTechnician.userId', '=', 'User.userId') // Join User to check status
                .select('Specialty.name')
                .count('LabTechnician.technicianId as count')
                .where('User.accountStatus', 'active') // Count only active technicians
                .groupBy('LabTechnician.specialtyId', 'Specialty.name'); // Group by ID and Name
        } catch (error) {
            console.error('Error counting technicians by specialty:', error);
            throw new Error('Unable to count technicians by specialty');
        }
    }

    /**
     * Check if a lab technician has related records
     * @param {number} technicianId - Lab technician ID to check
     * @returns {Promise<boolean>} True if dependencies exist
     */
    static async checkDependencies(technicianId) {
        try {
            // Check for dependencies in related tables (e.g., TestResult, Schedule)
            const testResultCount = await db('TestResult')
                .where('technicianId', technicianId)
                .count('resultId as count')
                .first();

            if (testResultCount && testResultCount.count > 0) {
                return true;
            }

            // Check schedules if the table has labTechnicianId column
            try {
                const scheduleCount = await db('Schedule')
                    .where('labTechnicianId', technicianId)
                    .count('scheduleId as count')
                    .first();

                return scheduleCount && scheduleCount.count > 0;
            } catch (error) {
                // If the column doesn't exist, ignore this check
                console.log('Note: Could not check for schedule dependencies, column may not exist');
                return false;
            }
        } catch (error) {
            console.error(`Error checking dependencies for lab technician ID ${technicianId}:`, error);
            throw new Error('Unable to check dependencies');
        }
    }
}

export default LabTechnicianDAO; 