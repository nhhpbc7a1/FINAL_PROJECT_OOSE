import db from '../ultis/db.js';

export default {
    async findAll() {
        try {
            // Join with Doctor and User to get the head doctor's name
            return await db('Specialty')
                .leftJoin('Doctor', 'Specialty.headDoctorId', '=', 'Doctor.doctorId')
                .leftJoin('User', 'Doctor.userId', '=', 'User.userId')
                // Optional: Join Hospital if needed
                // .leftJoin('Hospital', 'Specialty.hospitalId', '=', 'Hospital.hospitalId')
                .select(
                    'Specialty.*',
                    'User.fullName as headDoctorName'
                    // 'Hospital.name as hospitalName' // Uncomment if joining Hospital
                )
                .orderBy('Specialty.name');
        } catch (error) {
            console.error('Error fetching specialties:', error);
            throw new Error('Unable to load specialties');
        }
    },

    async getAllActive() {
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
    },

    async findById(specialtyId) {
        try {
            const specialty = await db('Specialty')
                .leftJoin('Doctor', 'Specialty.headDoctorId', '=', 'Doctor.doctorId')
                .leftJoin('User', 'Doctor.userId', '=', 'User.userId')
                 // Optional: Join Hospital
                // .leftJoin('Hospital', 'Specialty.hospitalId', '=', 'Hospital.hospitalId')
                .select(
                    'Specialty.*',
                    'User.fullName as headDoctorName'
                    // 'Hospital.name as hospitalName' // Uncomment if joining Hospital
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
    },

     /**
     * Checks if a specialty name already exists, optionally excluding a specific ID.
     * @param {string} name - The specialty name to check.
     * @param {number|null} excludeId - The specialty ID to exclude from the check (for updates).
     * @returns {boolean} - True if the name is unique, false otherwise.
     */
     async isNameUnique(name, excludeId = null) {
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
    },


    async add(specialty) {
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
    },

    async update(specialtyId, specialty) {
        try {
             // Prepare data for update
             const specialtyData = {};
             if (specialty.hasOwnProperty('name')) specialtyData.name = specialty.name;
             if (specialty.hasOwnProperty('description')) specialtyData.description = specialty.description;
             if (specialty.hasOwnProperty('hospitalId')) specialtyData.hospitalId = specialty.hospitalId; // Add check if hospital is managed
             // Allow setting headDoctorId to null
             if (specialty.hasOwnProperty('headDoctorId')) {
                specialtyData.headDoctorId = specialty.headDoctorId ? parseInt(specialty.headDoctorId, 10) : null;
             }
             if (specialty.hasOwnProperty('icon')) specialtyData.icon = specialty.icon;

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
    },

    async delete(specialtyId) {
        try {
            // IMPORTANT: Dependency checks should happen in the ROUTE before calling this.
            // This service method just performs the deletion assuming checks passed.
            const result = await db('Specialty')
                .where('specialtyId', specialtyId)
                .delete();
            return result > 0;
        } catch (error) {
            console.error(`Error deleting specialty with ID ${specialtyId}:`, error);
             // Although checks are in route, catch potential DB-level constraint errors
             if (error.code === 'ER_ROW_IS_REFERENCED_2') {
                 throw new Error('Cannot delete specialty because it is referenced by other records (Doctors, Services, Rooms, etc.).');
             }
            throw new Error('Unable to delete specialty');
        }
    },

     /**
     * Checks if a specialty has dependent records in other tables.
     * @param {number} specialtyId - The ID of the specialty to check.
     * @returns {object} - An object indicating dependencies, e.g., { hasDoctors: true, hasRooms: false, ... }
     */
     async checkDependencies(specialtyId) {
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
                hasAppointments: !!hasAppointments,
                hasAny: !!(hasDoctors || hasTechnicians || hasServices || hasRooms || hasAppointments)
            };
        } catch (error) {
            console.error(`Error checking dependencies for specialty ID ${specialtyId}:`, error);
            // Assume dependencies exist on error to be safe
            return { hasAny: true };
        }
    }
};