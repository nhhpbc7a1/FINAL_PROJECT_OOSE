import db from '../ultis/db.js';

/**
 * Data Access Object for Room-related database operations
 */
class RoomDAO {
    /**
     * Get all rooms
     * @returns {Promise<Array>} Array of room objects with specialty info
     */
    static async findAll() {
        try {
            return await db('Room')
                .leftJoin('Specialty', 'Room.specialtyId', '=', 'Specialty.specialtyId')
                .select(
                    'Room.*',
                    'Specialty.name as specialtyName'
                )
                .orderBy('Room.roomNumber');
        } catch (error) {
            console.error('Error fetching rooms:', error);
            throw new Error('Unable to load rooms');
        }
    }

    /**
     * Find a room by ID
     * @param {number} roomId - Room ID to find
     * @returns {Promise<Object|null>} Room object or null
     */
    static async findById(roomId) {
        try {
            const room = await db('Room')
                .leftJoin('Specialty', 'Room.specialtyId', '=', 'Specialty.specialtyId')
                .select(
                    'Room.*',
                    'Specialty.name as specialtyName'
                )
                .where('Room.roomId', roomId)
                .first();
                
            return room || null;
        } catch (error) {
            console.error(`Error fetching room with ID ${roomId}:`, error);
            throw new Error('Unable to find room');
        }
    }

    /**
     * Find rooms by specialty
     * @param {number} specialtyId - Specialty ID to filter by
     * @returns {Promise<Array>} Array of room objects
     */
    static async findBySpecialty(specialtyId) {
        try {
            return await db('Room')
                .where('specialtyId', specialtyId)
                .orderBy('roomNumber');
        } catch (error) {
            console.error(`Error fetching rooms by specialty ID ${specialtyId}:`, error);
            throw new Error('Unable to find rooms by specialty');
        }
    }

    /**
     * Find rooms by status
     * @param {string} status - Room status to filter by
     * @returns {Promise<Array>} Array of room objects
     */
    static async findByStatus(status) {
        try {
            return await db('Room')
                .leftJoin('Specialty', 'Room.specialtyId', '=', 'Specialty.specialtyId')
                .select(
                    'Room.*',
                    'Specialty.name as specialtyName'
                )
                .where('Room.status', status)
                .orderBy('Room.roomNumber');
        } catch (error) {
            console.error(`Error fetching rooms with status ${status}:`, error);
            throw new Error('Unable to find rooms by status');
        }
    }

    /**
     * Search for rooms by room number or specialty
     * @param {string} query - Search query
     * @returns {Promise<Array>} Array of matching room objects
     */
    static async search(query) {
        try {
            return await db('Room')
                .leftJoin('Specialty', 'Room.specialtyId', '=', 'Specialty.specialtyId')
                .select(
                    'Room.*',
                    'Specialty.name as specialtyName'
                )
                .where('Room.roomNumber', 'like', `%${query}%`)
                .orWhere('Specialty.name', 'like', `%${query}%`)
                .orWhere('Room.description', 'like', `%${query}%`)
                .orderBy('Room.roomNumber');
        } catch (error) {
            console.error(`Error searching rooms with query "${query}":`, error);
            throw new Error('Unable to search rooms');
        }
    }

    /**
     * Add a new room
     * @param {Object} room - Room data
     * @returns {Promise<number>} ID of the new room
     */
    static async add(room) {
        try {
            const [roomId] = await db('Room').insert({
                roomNumber: room.roomNumber,
                specialtyId: room.specialtyId,
                floor: room.floor,
                description: room.description,
                status: room.status || 'available'
            });
            
            return roomId;
        } catch (error) {
            console.error('Error adding room:', error);
            throw new Error('Unable to add room');
        }
    }

    /**
     * Update a room
     * @param {number} roomId - ID of room to update
     * @param {Object} roomData - Room data to update
     * @returns {Promise<boolean>} True if update was successful
     */
    static async update(roomId, roomData) {
        try {
            const result = await db('Room')
                .where('roomId', roomId)
                .update(roomData);
                
            return result > 0;
        } catch (error) {
            console.error(`Error updating room with ID ${roomId}:`, error);
            throw new Error('Unable to update room');
        }
    }

    /**
     * Delete a room
     * @param {number} roomId - ID of room to delete
     * @returns {Promise<boolean>} True if deletion was successful
     */
    static async delete(roomId) {
        try {
            const result = await db('Room')
                .where('roomId', roomId)
                .delete();
                
            return result > 0;
        } catch (error) {
            console.error(`Error deleting room with ID ${roomId}:`, error);
            throw new Error('Unable to delete room');
        }
    }

    /**
     * Check if a room number is unique
     * @param {string} roomNumber - Room number to check
     * @param {number} excludeRoomId - Optional room ID to exclude (for updates)
     * @returns {Promise<boolean>} True if room number is unique
     */
    static async isRoomNumberUnique(roomNumber, excludeRoomId = null) {
        try {
            const query = db('Room').where('roomNumber', roomNumber);
            
            if (excludeRoomId) {
                query.whereNot('roomId', excludeRoomId);
            }
            
            const existingRoom = await query.first();
            return !existingRoom;
        } catch (error) {
            console.error(`Error checking room number uniqueness for ${roomNumber}:`, error);
            throw new Error('Unable to check room number uniqueness');
        }
    }

    /**
     * Check if a room has dependencies (used in appointments or schedules)
     * @param {number} roomId - Room ID to check
     * @returns {Promise<boolean>} True if room has dependencies
     */
    static async checkDependencies(roomId) {
        try {
            // Check if room is used in appointments
            const appointmentCount = await db('Appointment')
                .where('roomId', roomId)
                .count('appointmentId as count')
                .first();
                
            if (appointmentCount && appointmentCount.count > 0) {
                return true;
            }
            
            // Check if room is used in schedules
            const scheduleCount = await db('Schedule')
                .where('roomId', roomId)
                .count('scheduleId as count')
                .first();
                
            return scheduleCount && scheduleCount.count > 0;
        } catch (error) {
            console.error(`Error checking dependencies for room ID ${roomId}:`, error);
            throw new Error('Unable to check room dependencies');
        }
    }
}

export default RoomDAO; 