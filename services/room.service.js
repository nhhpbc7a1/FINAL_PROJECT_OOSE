import db from '../ultis/db.js';

export default {
    async findAll() {
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
    },

    async findById(roomId) {
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
    },

    async findBySpecialty(specialtyId) {
        try {
            return await db('Room')
                .where('specialtyId', specialtyId)
                .orderBy('roomNumber');
        } catch (error) {
            console.error(`Error fetching rooms for specialty ID ${specialtyId}:`, error);
            throw new Error('Unable to find rooms by specialty');
        }
    },

    async findByStatus(status) {
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
    },

    async findByType(roomType) {
        try {
            return await db('Room')
                .leftJoin('Specialty', 'Room.specialtyId', '=', 'Specialty.specialtyId')
                .select(
                    'Room.*',
                    'Specialty.name as specialtyName'
                )
                .where('Room.roomType', roomType)
                .orderBy('Room.roomNumber');
        } catch (error) {
            console.error(`Error fetching rooms with type ${roomType}:`, error);
            throw new Error('Unable to find rooms by type');
        }
    },

    async findAvailableRooms(specialtyId, datetime) {
        try {
            // Get available rooms by checking which ones don't have appointments at the specified time
            const date = new Date(datetime);
            const formattedDate = date.toISOString().split('T')[0]; // Get only YYYY-MM-DD
            const time = date.toTimeString().split(' ')[0].substring(0, 5); // Get only HH:MM
            
            // Find rooms that are available and not booked at the specified time
            return await db('Room')
                .leftJoin('Specialty', 'Room.specialtyId', '=', 'Specialty.specialtyId')
                // Subquery to check if room is already booked
                .leftJoin(
                    db('Appointment')
                        .select('roomId')
                        .where('appointmentDate', formattedDate)
                        // Assuming appointment duration is typically 1 hour
                        .whereRaw('TIME(estimatedTime) <= ? AND ADDTIME(TIME(estimatedTime), "01:00:00") > ?', [time, time])
                        .whereIn('status', ['confirmed', 'pending'])
                        .as('booked'),
                    'Room.roomId', 'booked.roomId'
                )
                .select(
                    'Room.*',
                    'Specialty.name as specialtyName'
                )
                .where(function() {
                    this.where('Room.specialtyId', specialtyId)
                        .orWhereNull('Room.specialtyId'); // Include general rooms
                })
                .where('Room.status', 'available')
                .whereNull('booked.roomId') // Room is not booked
                .orderBy('Room.roomNumber');
        } catch (error) {
            console.error(`Error fetching available rooms for specialty ID ${specialtyId} at ${datetime}:`, error);
            throw new Error('Unable to find available rooms');
        }
    },

    async add(room) {
        try {
            const [roomId] = await db('Room').insert(room);
            return roomId;
        } catch (error) {
            console.error('Error adding room:', error);
            throw new Error('Unable to add room');
        }
    },

    async update(roomId, room) {
        try {
            const result = await db('Room')
                .where('roomId', roomId)
                .update(room);
            return result > 0;
        } catch (error) {
            console.error(`Error updating room with ID ${roomId}:`, error);
            throw new Error('Unable to update room');
        }
    },

    async updateStatus(roomId, status) {
        try {
            const result = await db('Room')
                .where('roomId', roomId)
                .update({ status });
            return result > 0;
        } catch (error) {
            console.error(`Error updating status for room with ID ${roomId}:`, error);
            throw new Error('Unable to update room status');
        }
    },

    async delete(roomId) {
        try {
            const result = await db('Room')
                .where('roomId', roomId)
                .delete();
            return result > 0;
        } catch (error) {
            console.error(`Error deleting room with ID ${roomId}:`, error);
            throw new Error('Unable to delete room');
        }
    },

    async countByType() {
        try {
            return await db('Room')
                .select('roomType')
                .count('roomId as count')
                .groupBy('roomType');
        } catch (error) {
            console.error('Error counting rooms by type:', error);
            throw new Error('Unable to count rooms by type');
        }
    },

    async countByStatus() {
        try {
            return await db('Room')
                .select('status')
                .count('roomId as count')
                .groupBy('status');
        } catch (error) {
            console.error('Error counting rooms by status:', error);
            throw new Error('Unable to count rooms by status');
        }
    },

    async countBySpecialty() {
        try {
            return await db('Room')
                .leftJoin('Specialty', 'Room.specialtyId', '=', 'Specialty.specialtyId')
                .select(db.raw('IFNULL(Specialty.name, "General") as specialtyName'))
                .count('Room.roomId as count')
                .groupBy('Room.specialtyId');
        } catch (error) {
            console.error('Error counting rooms by specialty:', error);
            throw new Error('Unable to count rooms by specialty');
        }
    },

    async getRoomUtilization(startDate, endDate) {
        try {
            // Count appointments per room during the date range
            const roomUsage = await db('Appointment')
                .join('Room', 'Appointment.roomId', '=', 'Room.roomId')
                .select(
                    'Room.roomId',
                    'Room.roomNumber',
                    'Room.roomType'
                )
                .count('Appointment.appointmentId as usageCount')
                .whereBetween('Appointment.appointmentDate', [startDate, endDate])
                .whereIn('Appointment.status', ['confirmed', 'completed'])
                .groupBy('Room.roomId')
                .orderBy('usageCount', 'desc');
            
            return roomUsage;
        } catch (error) {
            console.error(`Error getting room utilization between ${startDate} and ${endDate}:`, error);
            throw new Error('Unable to get room utilization');
        }
    }
}; 