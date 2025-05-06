import db from '../ultis/db.js';

export default {
    async findAll(includeOccupiedMaintenance = true) {
        try {
            const query = db('Room')
                .leftJoin('Specialty', 'Room.specialtyId', '=', 'Specialty.specialtyId')
                .select(
                    'Room.*',
                    'Specialty.name as specialtyName'
                )
                .orderBy('Room.roomNumber');

            // By default, include all statuses for admin view
            // Add filtering logic here if needed based on includeOccupiedMaintenance or other params

            return await query;
        } catch (error) {
            console.error('Error fetching rooms:', error);
            throw new Error('Unable to load rooms');
        }
    },

    async findById(roomId) {
        try {
            const room = await db('Room')
                .leftJoin('Specialty', 'Room.specialtyId', '=', 'Specialty.specialtyId')
                .select(
                    'Room.*',
                    'Specialty.name as specialtyName'
                )
                .where('roomId', roomId)
                .first();
            return room || null;
        } catch (error) {
            console.error(`Error fetching room with ID ${roomId}:`, error);
            throw new Error('Unable to find room');
        }
    },

    /**
     * Checks if a room number already exists, optionally excluding a specific ID.
     * @param {string} roomNumber - The room number to check.
     * @param {number|null} excludeId - The room ID to exclude (for updates).
     * @returns {boolean} - True if the number is unique, false otherwise.
     */
    async isRoomNumberUnique(roomNumber, excludeId = null) {
        try {
            // Consider case-insensitive if room numbers can be like '101A' and '101a'
            const query = db('Room').whereRaw('LOWER(roomNumber) = LOWER(?)', [roomNumber]);
            if (excludeId) {
                query.andWhereNot('roomId', excludeId);
            }
            const existing = await query.first();
            return !existing; // True if no existing record found
        } catch (error) {
            console.error('Error checking room number uniqueness:', error);
            return false; // Treat errors as non-unique to be safe
        }
    },

    async add(room) {
        try {
            // Prepare data, validate types and enums
            const roomData = {
                roomNumber: room.roomNumber,
                specialtyId: room.specialtyId ? parseInt(room.specialtyId, 10) : null,
                capacity: room.capacity ? parseInt(room.capacity, 10) : null,
                roomType: room.roomType, // Assume validated in route
                status: room.status || 'available', // Default or from input
                description: room.description || null
            };

            // Validate ENUMs (can also be done more robustly)
            const validTypes = ['examination', 'operation', 'laboratory', 'consultation', 'emergency', 'general'];
            const validStatuses = ['available', 'occupied', 'maintenance'];
            if (!validTypes.includes(roomData.roomType)) throw new Error('Invalid room type provided.');
            if (!validStatuses.includes(roomData.status)) throw new Error('Invalid status provided.');
            if (roomData.capacity !== null && (isNaN(roomData.capacity) || roomData.capacity < 0)) {
                 throw new Error('Capacity must be a non-negative number.');
            }

            const [roomId] = await db('Room').insert(roomData);
            return roomId;
        } catch (error) {
            console.error('Error adding room:', error);
            if (error.code === 'ER_DUP_ENTRY' || (error.message && error.message.includes('Duplicate entry'))) {
                 throw new Error(`Room number "${room.roomNumber}" already exists.`);
             } else if (error.code === 'ER_NO_REFERENCED_ROW_2') {
                 throw new Error('Invalid Specialty ID provided.');
             }
            throw new Error(error.message || 'Unable to add room');
        }
    },

    async update(roomId, room) {
        try {
            // Prepare update data
            const roomData = {};
            if (room.hasOwnProperty('roomNumber')) roomData.roomNumber = room.roomNumber;
            if (room.hasOwnProperty('specialtyId')) roomData.specialtyId = room.specialtyId ? parseInt(room.specialtyId, 10) : null; // Allow setting to null
             if (room.hasOwnProperty('capacity')) {
                 roomData.capacity = room.capacity ? parseInt(room.capacity, 10) : null;
                 if (roomData.capacity !== null && (isNaN(roomData.capacity) || roomData.capacity < 0)) {
                    throw new Error('Capacity must be a non-negative number.');
                 }
             }
            if (room.hasOwnProperty('roomType')) {
                 const validTypes = ['examination', 'operation', 'laboratory', 'consultation', 'emergency', 'general'];
                 if (!validTypes.includes(room.roomType)) throw new Error('Invalid room type provided.');
                 roomData.roomType = room.roomType;
             }
             if (room.hasOwnProperty('status')) {
                  const validStatuses = ['available', 'occupied', 'maintenance'];
                  if (!validStatuses.includes(room.status)) throw new Error('Invalid status provided.');
                  roomData.status = room.status;
             }
            if (room.hasOwnProperty('description')) roomData.description = room.description;


            if (Object.keys(roomData).length === 0) {
                 return true; // Nothing to update
            }

            const result = await db('Room')
                .where('roomId', roomId)
                .update(roomData);

            return result > 0;
        } catch (error) {
            console.error(`Error updating room with ID ${roomId}:`, error);
             if (error.code === 'ER_DUP_ENTRY' || (error.message && error.message.includes('Duplicate entry'))) {
                 throw new Error(`Room number "${room.roomNumber}" already exists.`);
             } else if (error.code === 'ER_NO_REFERENCED_ROW_2') {
                 throw new Error('Invalid Specialty ID provided.');
             }
            throw new Error(error.message || 'Unable to update room');
        }
    },

     /**
     * Checks if a room has dependencies (Schedules, Appointments, Test Results).
     * @param {number} roomId - The ID of the room to check.
     * @returns {boolean} - True if dependencies exist, false otherwise.
     */
    async checkDependencies(roomId) {
        try {
            const hasSchedules = await db('Schedule').where('roomId', roomId).first();
            const hasAppointments = await db('Appointment').where('roomId', roomId).first();
            const hasTestResults = await db('TestResult').where('roomId', roomId).first();

            return !!(hasSchedules || hasAppointments || hasTestResults);
        } catch (error) {
            console.error(`Error checking dependencies for room ID ${roomId}:`, error);
            return true; // Assume dependencies exist on error to be safe
        }
    },

    async delete(roomId) {
        try {
            // Dependency check done in route.
            const result = await db('Room')
                .where('roomId', roomId)
                .delete();
            return result > 0;
        } catch (error) {
            console.error(`Error deleting room with ID ${roomId}:`, error);
             if (error.code === 'ER_ROW_IS_REFERENCED_2') {
                 throw new Error('Cannot delete room because it is referenced by other records (Schedules, Appointments, Test Results).');
             }
            throw new Error('Unable to delete room');
        }
    },

     async search(query) {
        try {
            return await db('Room')
                .leftJoin('Specialty', 'Room.specialtyId', '=', 'Specialty.specialtyId')
                .select(
                    'Room.*',
                    'Specialty.name as specialtyName'
                )
                 .where(builder => {
                    builder.where('Room.roomNumber', 'like', `%${query}%`)
                           .orWhere('Room.roomType', 'like', `%${query}%`)
                           .orWhere('Room.status', 'like', `%${query}%`)
                           .orWhere('Room.description', 'like', `%${query}%`)
                           .orWhere('Specialty.name', 'like', `%${query}%`);
                 })
                 .orderBy('Room.roomNumber');
        } catch (error) {
            console.error(`Error searching rooms with query "${query}":`, error);
            throw new Error('Unable to search rooms');
        }
    },

    async findBySpecialty(specialtyId) {
        try {
            return await db('Room')
                .where('specialtyId', specialtyId)
                .select(
                    'Room.*'
                )
                .orderBy('Room.roomNumber');
        } catch (error) {
            console.error(`Error fetching rooms for specialty ID ${specialtyId}:`, error);
            throw new Error('Unable to find rooms by specialty');
        }
    }
};