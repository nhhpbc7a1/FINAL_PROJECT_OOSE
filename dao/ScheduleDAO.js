import db from '../ultis/db.js';

/**
 * Data Access Object for Schedule-related database operations
 */
class ScheduleDAO {
    /**
     * Find all schedules with related information
     * @returns {Promise<Array>} List of schedules
     */
    static async findAll() {
        try {
            return await db('Schedule')
                .leftJoin('Doctor', 'Schedule.doctorId', '=', 'Doctor.doctorId')
                .leftJoin('User AS DoctorUser', 'Doctor.userId', '=', 'DoctorUser.userId')
                .leftJoin('LabTechnician', 'Schedule.labTechnicianId', '=', 'LabTechnician.technicianId')
                .leftJoin('User AS LabUser', 'LabTechnician.userId', '=', 'LabUser.userId')
                .leftJoin('Specialty AS DoctorSpecialty', 'Doctor.specialtyId', '=', 'DoctorSpecialty.specialtyId')
                .leftJoin('Specialty AS LabSpecialty', 'LabTechnician.specialtyId', '=', 'LabSpecialty.specialtyId')
                .leftJoin('Room', 'Schedule.roomId', '=', 'Room.roomId')
                .select(
                    'Schedule.*',
                    'DoctorUser.fullName as doctorName',
                    'LabUser.fullName as labTechnicianName',
                    'DoctorSpecialty.specialtyId',
                    'DoctorSpecialty.name as doctorSpecialtyName',
                    'LabSpecialty.name as labSpecialtyName',
                    'Room.roomNumber'
                )
                .orderBy('Schedule.workDate')
                .orderBy('Schedule.startTime');
        } catch (error) {
            console.error('Error fetching schedules:', error);
            throw new Error('Unable to load schedules');
        }
    }

    /**
     * Find schedule by ID with all related information
     * @param {number} scheduleId - Schedule ID
     * @returns {Promise<Object|null>} Schedule object or null if not found
     */
    static async findById(scheduleId) {
        try {
            const schedule = await db('Schedule')
                .leftJoin('Doctor', 'Schedule.doctorId', '=', 'Doctor.doctorId')
                .leftJoin('User AS DoctorUser', 'Doctor.userId', '=', 'DoctorUser.userId')
                .leftJoin('LabTechnician', 'Schedule.labTechnicianId', '=', 'LabTechnician.technicianId')
                .leftJoin('User AS LabUser', 'LabTechnician.userId', '=', 'LabUser.userId')
                .leftJoin('Room', 'Schedule.roomId', '=', 'Room.roomId')
                .select(
                    'Schedule.*',
                    'DoctorUser.fullName as doctorName',
                    'LabUser.fullName as labTechnicianName',
                    'Room.roomNumber'
                )
                .where('Schedule.scheduleId', scheduleId)
                .first();
            
            return schedule || null;
        } catch (error) {
            console.error(`Error fetching schedule with ID ${scheduleId}:`, error);
            throw new Error('Unable to find schedule');
        }
    }

    /**
     * Find schedules by doctor ID
     * @param {number} doctorId - Doctor ID
     * @returns {Promise<Array>} List of schedules for the doctor
     */
    static async findByDoctor(doctorId) {
        try {
            return await db('Schedule')
                .leftJoin('Room', 'Schedule.roomId', '=', 'Room.roomId')
                .select(
                    'Schedule.*',
                    'Room.roomNumber'
                )
                .where('Schedule.doctorId', doctorId)
                .orderBy('Schedule.workDate')
                .orderBy('Schedule.startTime');
        } catch (error) {
            console.error(`Error fetching schedules for doctor ID ${doctorId}:`, error);
            throw new Error('Unable to find schedules by doctor');
        }
    }

    /**
     * Find schedules by lab technician ID
     * @param {number} labTechnicianId - Lab technician ID
     * @returns {Promise<Array>} List of schedules for the lab technician
     */
    static async findByLabTechnician(labTechnicianId) {
        try {
            return await db('Schedule')
                .leftJoin('Room', 'Schedule.roomId', '=', 'Room.roomId')
                .select(
                    'Schedule.*',
                    'Room.roomNumber'
                )
                .where('Schedule.labTechnicianId', labTechnicianId)
                .orderBy('Schedule.workDate')
                .orderBy('Schedule.startTime');
        } catch (error) {
            console.error(`Error fetching schedules for lab technician ID ${labTechnicianId}:`, error);
            throw new Error('Unable to find schedules by lab technician');
        }
    }

    /**
     * Find schedules by room ID
     * @param {number} roomId - Room ID
     * @returns {Promise<Array>} List of schedules for the room
     */
    static async findByRoom(roomId) {
        try {
            return await db('Schedule')
                .join('Doctor', 'Schedule.doctorId', '=', 'Doctor.doctorId')
                .join('User', 'Doctor.userId', '=', 'User.userId')
                .select(
                    'Schedule.*',
                    'User.fullName as doctorName'
                )
                .where('Schedule.roomId', roomId)
                .orderBy('Schedule.workDate')
                .orderBy('Schedule.startTime');
        } catch (error) {
            console.error(`Error fetching schedules for room ID ${roomId}:`, error);
            throw new Error('Unable to find schedules by room');
        }
    }

    /**
     * Find schedules by date range
     * @param {string} startDate - Start date (YYYY-MM-DD)
     * @param {string} endDate - End date (YYYY-MM-DD)
     * @returns {Promise<Array>} List of schedules within the date range
     */
    static async findByDateRange(startDate, endDate) {
        try {
            return await db('Schedule')
                .leftJoin('Doctor', 'Schedule.doctorId', '=', 'Doctor.doctorId')
                .leftJoin('User AS DoctorUser', 'Doctor.userId', '=', 'DoctorUser.userId')
                .leftJoin('LabTechnician', 'Schedule.labTechnicianId', '=', 'LabTechnician.technicianId')
                .leftJoin('User AS LabUser', 'LabTechnician.userId', '=', 'LabUser.userId')
                .leftJoin('Specialty AS DoctorSpecialty', 'Doctor.specialtyId', '=', 'DoctorSpecialty.specialtyId')
                .leftJoin('Specialty AS LabSpecialty', 'LabTechnician.specialtyId', '=', 'LabSpecialty.specialtyId')
                .leftJoin('Room', 'Schedule.roomId', '=', 'Room.roomId')
                .select(
                    'Schedule.*',
                    'DoctorUser.fullName as doctorName',
                    'LabUser.fullName as labTechnicianName',
                    'DoctorSpecialty.specialtyId',
                    'DoctorSpecialty.name as doctorSpecialtyName',
                    'LabSpecialty.name as labSpecialtyName',
                    'Room.roomNumber'
                )
                .whereBetween('Schedule.workDate', [startDate, endDate])
                .orderBy('Schedule.workDate')
                .orderBy('Schedule.startTime');
        } catch (error) {
            console.error(`Error fetching schedules for date range ${startDate} to ${endDate}:`, error);
            throw new Error('Unable to find schedules by date range');
        }
    }

    /**
     * Find schedules by doctor and date
     * @param {number} doctorId - Doctor ID
     * @param {string} date - Date (YYYY-MM-DD)
     * @returns {Promise<Array>} List of schedules for the doctor and date
     */
    static async findByDoctorAndDate(doctorId, date) {
        try {
            return await db('Schedule')
                .leftJoin('Room', 'Schedule.roomId', '=', 'Room.roomId')
                .select(
                    'Schedule.*',
                    'Room.roomNumber'
                )
                .where({
                    'Schedule.doctorId': doctorId,
                    'Schedule.workDate': date
                })
                .orderBy('Schedule.startTime');
        } catch (error) {
            console.error(`Error fetching schedules for doctor ID ${doctorId} on date ${date}:`, error);
            throw new Error('Unable to find schedules by doctor and date');
        }
    }

    /**
     * Find schedules by status
     * @param {string} status - Schedule status
     * @returns {Promise<Array>} List of schedules with the specified status
     */
    static async findByStatus(status) {
        try {
            return await db('Schedule')
                .join('Doctor', 'Schedule.doctorId', '=', 'Doctor.doctorId')
                .join('User', 'Doctor.userId', '=', 'User.userId')
                .leftJoin('Room', 'Schedule.roomId', '=', 'Room.roomId')
                .select(
                    'Schedule.*',
                    'User.fullName as doctorName',
                    'Room.roomNumber'
                )
                .where('Schedule.status', status)
                .orderBy('Schedule.workDate')
                .orderBy('Schedule.startTime');
        } catch (error) {
            console.error(`Error fetching schedules with status ${status}:`, error);
            throw new Error('Unable to find schedules by status');
        }
    }

    /**
     * Add a new schedule
     * @param {Object} schedule - Schedule data to add
     * @returns {Promise<number>} New schedule ID
     */
    static async add(schedule) {
        try {
            const [scheduleId] = await db('Schedule').insert(schedule);
            return scheduleId;
        } catch (error) {
            console.error('Error adding schedule:', error);
            throw new Error('Unable to add schedule');
        }
    }

    /**
     * Add multiple schedules in bulk
     * @param {Array} schedules - Array of schedule data to add
     * @returns {Promise<Array>} Result of bulk insert
     */
    static async bulkAdd(schedules) {
        try {
            console.log(`Attempting to add ${schedules.length} schedules individually...`);
            
            const results = [];
            const errors = [];
            
            // Process each schedule individually for better error handling
            for (let i = 0; i < schedules.length; i++) {
                try {
                    const schedule = schedules[i];
                    console.log(`Adding schedule ${i + 1}/${schedules.length}:`, schedule);
                    
                    // Insert the individual schedule
                    const [scheduleId] = await db('Schedule').insert(schedule);
                    console.log(`Successfully added schedule ${i + 1} with ID:`, scheduleId);
                    
                    results.push(scheduleId);
                } catch (error) {
                    console.error(`Error adding schedule ${i + 1}:`, error);
                    console.error('SQL Error Code:', error.code);
                    console.error('SQL Error Number:', error.errno);
                    console.error('SQL Error Message:', error.sqlMessage || error.message);
                    
                    // Add to errors array but continue processing
                    errors.push({
                        index: i,
                        schedule: schedules[i],
                        error: {
                            code: error.code,
                            errno: error.errno,
                            message: error.sqlMessage || error.message
                        }
                    });
                }
            }
            
            console.log(`Bulk add complete. Success: ${results.length}, Failures: ${errors.length}`);
            
            // If all schedules failed to insert, throw an error
            if (results.length === 0 && errors.length > 0) {
                throw new Error(`All ${errors.length} schedule inserts failed`);
            }
            
            return results;
        } catch (error) {
            console.error('Fatal error in bulkAdd operation:', error);
            throw new Error('Unable to add schedules in bulk: ' + error.message);
        }
    }

    /**
     * Update a schedule
     * @param {number} scheduleId - Schedule ID to update
     * @param {Object} scheduleData - Updated schedule data
     * @returns {Promise<boolean>} True if update successful
     */
    static async update(scheduleId, scheduleData) {
        try {
            const result = await db('Schedule')
                .where('scheduleId', scheduleId)
                .update(scheduleData);
            return result > 0;
        } catch (error) {
            console.error(`Error updating schedule ID ${scheduleId}:`, error);
            throw new Error('Unable to update schedule');
        }
    }

    /**
     * Update schedule status
     * @param {number} scheduleId - Schedule ID to update
     * @param {string} status - New status
     * @returns {Promise<boolean>} True if update successful
     */
    static async updateStatus(scheduleId, status) {
        try {
            const result = await db('Schedule')
                .where('scheduleId', scheduleId)
                .update({ status });
            return result > 0;
        } catch (error) {
            console.error(`Error updating status for schedule ID ${scheduleId}:`, error);
            throw new Error('Unable to update schedule status');
        }
    }

    /**
     * Delete a schedule
     * @param {number} scheduleId - Schedule ID to delete
     * @returns {Promise<boolean>} True if deletion successful
     */
    static async delete(scheduleId) {
        try {
            const result = await db('Schedule')
                .where('scheduleId', scheduleId)
                .delete();
            return result > 0;
        } catch (error) {
            console.error(`Error deleting schedule ID ${scheduleId}:`, error);
            throw new Error('Unable to delete schedule');
        }
    }

    /**
     * Delete schedules by doctor ID
     * @param {number} doctorId - Doctor ID
     * @returns {Promise<boolean>} True if deletion successful
     */
    static async deleteByDoctor(doctorId) {
        try {
            const result = await db('Schedule')
                .where('doctorId', doctorId)
                .delete();
            return result > 0;
        } catch (error) {
            console.error(`Error deleting schedules for doctor ID ${doctorId}:`, error);
            throw new Error('Unable to delete doctor schedules');
        }
    }
}

export default ScheduleDAO; 