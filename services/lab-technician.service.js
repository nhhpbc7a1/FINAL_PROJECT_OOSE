import db from '../ultis/db.js';

export default {
    async findAll() {
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
    },

    async findById(technicianId) {
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
    },

    async findByUserId(userId) {
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
    },

    async findBySpecialty(specialtyId) {
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
    },

    async search(query) {
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
                .where(builder => { // Group WHERE clauses for OR logic
                    builder.where('User.fullName', 'like', `%${query}%`)
                        .orWhere('User.email', 'like', `%${query}%`)
                        .orWhere('LabTechnician.specialization', 'like', `%${query}%`)
                        .orWhere('Specialty.name', 'like', `%${query}%`)
                });
        } catch (error) {
            console.error(`Error searching technicians with query "${query}":`, error);
            throw new Error('Unable to search technicians');
        }
    },

    async add(technician) {
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
    },

    // This combined update is less ideal. Prefer updating User via userService
    // and LabTechnician via this service separately in the route handler.
    // Kept for structural similarity if needed, but `updateByUserId` is preferred.
    async update(technicianId, technician) {
        try {
            // Separate LabTechnician and User data
            const technicianData = {};
            const userData = {};

            // LabTechnician specific fields
            if (technician.specialtyId !== undefined) technicianData.specialtyId = technician.specialtyId;
            if (technician.specialization !== undefined) technicianData.specialization = technician.specialization;

            // User related fields (should ideally be handled by userService)
            if (technician.fullName) userData.fullName = technician.fullName;
            if (technician.email) userData.email = technician.email; // Caution: handle email uniqueness
            if (technician.phoneNumber) userData.phoneNumber = technician.phoneNumber;
            if (technician.address !== undefined) userData.address = technician.address; // Allow empty string
            if (technician.gender) userData.gender = technician.gender;
            if (technician.dob) userData.dob = technician.dob;
            if (technician.accountStatus) userData.accountStatus = technician.accountStatus;
            if (technician.profileImage !== undefined) userData.profileImage = technician.profileImage; // Allow null/empty

            // Start transaction
            const trx = await db.transaction();
            let updated = false;

            try {
                // Update LabTechnician table
                 let techUpdateResult = 0;
                if (Object.keys(technicianData).length > 0) {
                   techUpdateResult = await trx('LabTechnician')
                        .where('technicianId', technicianId)
                        .update(technicianData);
                }

                // Update User table if necessary
                 let userUpdateResult = 0;
                if (Object.keys(userData).length > 0) {
                    // Find the userId associated with this technicianId
                    const techRecord = await trx('LabTechnician')
                        .select('userId')
                        .where('technicianId', technicianId)
                        .first();

                    if (techRecord && techRecord.userId) {
                        userUpdateResult = await trx('User')
                            .where('userId', techRecord.userId)
                            .update(userData);
                    } else {
                        // Rollback if user ID not found for the technician
                        await trx.rollback();
                         throw new Error(`User ID not found for technician ID ${technicianId}`);
                    }
                }

                 // Commit transaction
                await trx.commit();
                updated = (techUpdateResult > 0 || userUpdateResult > 0);

             } catch (err) {
                 // Rollback on any error during transaction
                 await trx.rollback();
                 throw err; // Re-throw the error
             }

            return updated;
        } catch (error) {
            console.error(`Error updating technician with ID ${technicianId}:`, error);
            throw new Error('Unable to update technician: ' + error.message);
        }
    },

    async updateByUserId(userId, technician) {
        try {
            // Find the technician record by userId to ensure it exists
            const techRecord = await db('LabTechnician')
                .where('userId', userId)
                .first();

            if (!techRecord) {
                // Optional: Could return 0 or false instead of throwing error
                // return 0;
                throw new Error(`Lab Technician with user ID ${userId} not found`);
            }

            // Prepare data specifically for the LabTechnician table
            const technicianData = {};
            // Check if properties exist in the input object before adding
            if (technician.hasOwnProperty('specialtyId')) technicianData.specialtyId = technician.specialtyId;
            if (technician.hasOwnProperty('specialization')) technicianData.specialization = technician.specialization;

            // Only perform update if there's data to update
            if (Object.keys(technicianData).length > 0) {
                const result = await db('LabTechnician')
                    .where('userId', userId) // Update based on userId
                    .update(technicianData);

                return result > 0; // Return true if 1 or more rows were affected
            }

            // If no technician-specific fields were provided, consider it successful (no update needed)
            return true;
        } catch (error) {
            console.error(`Error updating technician via user ID ${userId}:`, error);
            // Handle specific errors like foreign key constraints if needed
             if (error.code === 'ER_NO_REFERENCED_ROW_2') {
                 throw new Error('Invalid Specialty ID provided.');
             }
            throw new Error('Unable to update technician details: ' + error.message);
        }
    },


    async delete(technicianId) {
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
    },

    async countBySpecialty() {
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
    },

    // Removed countByExperience as it's not relevant

    // Removed getDoctorWithSchedule / Appointments / AvailableDoctors

     // Example: Add a method to count test results performed by a technician (if needed)
     async countTestResults(technicianId) {
         try {
             const result = await db('TestResult')
                 .where('technicianId', technicianId)
                 .count('resultId as count')
                 .first();
             return result ? result.count : 0;
         } catch (error) {
             console.error(`Error counting test results for technician ID ${technicianId}:`, error);
             throw new Error('Unable to count test results');
         }
     }
};