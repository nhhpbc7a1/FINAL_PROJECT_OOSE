import RoomDAO from '../dao/RoomDAO.js';

/**
 * Room model representing a room in the system
 */
class Room {
    /**
     * Create a new Room instance
     * @param {Object} data - Room data
     */
    constructor(data = {}) {
        this.roomId = data.roomId || null;
        this.roomNumber = data.roomNumber || '';
        this.specialtyId = data.specialtyId || null;
        this.capacity = data.capacity || 1;
        this.roomType = data.roomType || 'examination';
        this.description = data.description || '';
        this.status = data.status || 'available';
        
        // Related data
        this.specialtyName = data.specialtyName || '';
    }

    /**
     * Save the room (create or update)
     * @returns {Promise<number>} Room ID
     */
    async save() {
        try {
            if (this.roomId) {
                // Update existing room
                const roomData = {
                    roomNumber: this.roomNumber,
                    specialtyId: this.specialtyId,
                    capacity: this.capacity,
                    roomType: this.roomType,
                    description: this.description,
                    status: this.status
                };
                
                await RoomDAO.update(this.roomId, roomData);
                return this.roomId;
            } else {
                // Create new room
                const roomData = {
                    roomNumber: this.roomNumber,
                    specialtyId: this.specialtyId,
                    capacity: this.capacity,
                    roomType: this.roomType,
                    description: this.description,
                    status: this.status
                };
                
                this.roomId = await RoomDAO.add(roomData);
                return this.roomId;
            }
        } catch (error) {
            console.error('Error saving room:', error);
            throw new Error('Failed to save room: ' + error.message);
        }
    }

    /**
     * Delete the room
     * @returns {Promise<boolean>} True if successful
     */
    async delete() {
        if (!this.roomId) {
            throw new Error('Cannot delete an unsaved room');
        }
        return await RoomDAO.delete(this.roomId);
    }

    /**
     * Find all rooms
     * @returns {Promise<Array<Room>>} Array of Room instances
     */
    static async findAll() {
        const rooms = await RoomDAO.findAll();
        return rooms.map(room => new Room(room));
    }

    /**
     * Find room by ID
     * @param {number} roomId - Room ID
     * @returns {Promise<Room|null>} Room instance or null
     */
    static async findById(roomId) {
        const room = await RoomDAO.findById(roomId);
        return room ? new Room(room) : null;
    }

    /**
     * Find rooms by specialty
     * @param {number} specialtyId - Specialty ID
     * @returns {Promise<Array<Room>>} Array of Room instances
     */
    static async findBySpecialty(specialtyId) {
        const rooms = await RoomDAO.findBySpecialty(specialtyId);
        return rooms.map(room => new Room(room));
    }

    /**
     * Find rooms by status
     * @param {string} status - Room status
     * @returns {Promise<Array<Room>>} Array of Room instances
     */
    static async findByStatus(status) {
        const rooms = await RoomDAO.findByStatus(status);
        return rooms.map(room => new Room(room));
    }

    /**
     * Find rooms by room type
     * @param {string} roomType - Room type
     * @returns {Promise<Array<Room>>} Array of Room instances
     */
    static async findByType(roomType) {
        const rooms = await RoomDAO.findByType(roomType);
        return rooms.map(room => new Room(room));
    }

    /**
     * Search for rooms
     * @param {string} query - Search query
     * @returns {Promise<Array<Room>>} Array of Room instances
     */
    static async search(query) {
        const rooms = await RoomDAO.search(query);
        return rooms.map(room => new Room(room));
    }

    /**
     * Check if a room number is unique
     * @param {string} roomNumber - Room number to check
     * @param {number} excludeRoomId - Optional room ID to exclude (for updates)
     * @returns {Promise<boolean>} True if room number is unique
     */
    static async isRoomNumberUnique(roomNumber, excludeRoomId = null) {
        return await RoomDAO.isRoomNumberUnique(roomNumber, excludeRoomId);
    }

    /**
     * Check if a room has dependencies (used in appointments or schedules)
     * @param {number} roomId - Room ID to check
     * @returns {Promise<boolean>} True if room has dependencies
     */
    static async checkDependencies(roomId) {
        return await RoomDAO.checkDependencies(roomId);
    }
}

export default Room; 