import ScheduleDAO from '../dao/ScheduleDAO.js';

/**
 * Schedule Model Class
 * Represents a work schedule in the system
 */
class Schedule {
    /**
     * Create a new Schedule instance
     * @param {Object} scheduleData - Schedule data from database or form
     */
    constructor(scheduleData = {}) {
        this.scheduleId = scheduleData.scheduleId || null;
        this.doctorId = scheduleData.doctorId || null;
        this.labTechnicianId = scheduleData.labTechnicianId || null;
        this.workDate = scheduleData.workDate || null;
        this.startTime = scheduleData.startTime || '07:00:00';
        this.endTime = scheduleData.endTime || '11:30:00';
        this.roomId = scheduleData.roomId || null;
        this.status = scheduleData.status || 'available';

        // Include joined data if available
        this.doctorName = scheduleData.doctorName || null;
        this.labTechnicianName = scheduleData.labTechnicianName || null;
        this.roomNumber = scheduleData.roomNumber || null;
        this.specialtyId = scheduleData.specialtyId || null;
        this.doctorSpecialtyName = scheduleData.doctorSpecialtyName || null;
        this.labSpecialtyName = scheduleData.labSpecialtyName || null;
        
        // Calculate staff type
        this.staffType = this.doctorId ? 'doctor' : 'labTechnician';
        this.specialtyName = this.doctorId ? this.doctorSpecialtyName : this.labSpecialtyName;
    }

    /**
     * Save the schedule to the database (create or update)
     * @returns {Promise<Schedule>} The saved schedule
     */
    async save() {
        try {
            if (this.scheduleId) {
                // Update existing schedule
                const scheduleData = {
                    doctorId: this.doctorId,
                    labTechnicianId: this.labTechnicianId,
                    workDate: this.workDate,
                    startTime: this.startTime,
                    endTime: this.endTime,
                    roomId: this.roomId,
                    status: this.status
                };
                
                const success = await ScheduleDAO.update(this.scheduleId, scheduleData);
                if (!success) {
                    throw new Error(`Failed to update schedule with ID ${this.scheduleId}`);
                }
                return this;
            } else {
                // Create new schedule
                const scheduleData = {
                    doctorId: this.doctorId,
                    labTechnicianId: this.labTechnicianId,
                    workDate: this.workDate,
                    startTime: this.startTime,
                    endTime: this.endTime,
                    roomId: this.roomId,
                    status: this.status
                };
                
                const scheduleId = await ScheduleDAO.add(scheduleData);
                this.scheduleId = scheduleId;
                return this;
            }
        } catch (error) {
            console.error('Error saving schedule:', error);
            throw new Error('Failed to save schedule: ' + error.message);
        }
    }

    /**
     * Delete the schedule from the database
     * @returns {Promise<boolean>} True if deletion was successful
     */
    async delete() {
        try {
            if (!this.scheduleId) {
                throw new Error('Cannot delete unsaved schedule');
            }
            
            return await ScheduleDAO.delete(this.scheduleId);
        } catch (error) {
            console.error('Error deleting schedule:', error);
            throw new Error('Failed to delete schedule: ' + error.message);
        }
    }

    /**
     * Update the status of the schedule
     * @param {string} status - New status
     * @returns {Promise<Schedule>} Updated schedule
     */
    async updateStatus(status) {
        try {
            if (!this.scheduleId) {
                throw new Error('Cannot update status of unsaved schedule');
            }
            
            const success = await ScheduleDAO.updateStatus(this.scheduleId, status);
            if (!success) {
                throw new Error(`Failed to update status for schedule ID ${this.scheduleId}`);
            }
            
            this.status = status;
            return this;
        } catch (error) {
            console.error('Error updating schedule status:', error);
            throw new Error('Failed to update schedule status: ' + error.message);
        }
    }

    /**
     * Get all schedules
     * @returns {Promise<Schedule[]>} Array of all schedules
     */
    static async findAll() {
        try {
            const schedulesData = await ScheduleDAO.findAll();
            return schedulesData.map(scheduleData => new Schedule(scheduleData));
        } catch (error) {
            console.error('Error finding all schedules:', error);
            throw new Error('Failed to find all schedules: ' + error.message);
        }
    }

    /**
     * Find a schedule by ID
     * @param {number} scheduleId - Schedule ID to find
     * @returns {Promise<Schedule|null>} The found schedule or null
     */
    static async findById(scheduleId) {
        try {
            const scheduleData = await ScheduleDAO.findById(scheduleId);
            return scheduleData ? new Schedule(scheduleData) : null;
        } catch (error) {
            console.error(`Error finding schedule with ID ${scheduleId}:`, error);
            throw new Error('Failed to find schedule: ' + error.message);
        }
    }

    /**
     * Find schedules by doctor ID
     * @param {number} doctorId - Doctor ID to find schedules for
     * @returns {Promise<Schedule[]>} Array of schedules for the doctor
     */
    static async findByDoctor(doctorId) {
        try {
            const schedulesData = await ScheduleDAO.findByDoctor(doctorId);
            return schedulesData.map(scheduleData => new Schedule(scheduleData));
        } catch (error) {
            console.error(`Error finding schedules for doctor ID ${doctorId}:`, error);
            throw new Error('Failed to find schedules by doctor: ' + error.message);
        }
    }

    /**
     * Find schedules by lab technician ID
     * @param {number} labTechnicianId - Lab technician ID to find schedules for
     * @returns {Promise<Schedule[]>} Array of schedules for the lab technician
     */
    static async findByLabTechnician(labTechnicianId) {
        try {
            const schedulesData = await ScheduleDAO.findByLabTechnician(labTechnicianId);
            return schedulesData.map(scheduleData => new Schedule(scheduleData));
        } catch (error) {
            console.error(`Error finding schedules for lab technician ID ${labTechnicianId}:`, error);
            throw new Error('Failed to find schedules by lab technician: ' + error.message);
        }
    }

    /**
     * Find schedules by room ID
     * @param {number} roomId - Room ID to find schedules for
     * @returns {Promise<Schedule[]>} Array of schedules for the room
     */
    static async findByRoom(roomId) {
        try {
            const schedulesData = await ScheduleDAO.findByRoom(roomId);
            return schedulesData.map(scheduleData => new Schedule(scheduleData));
        } catch (error) {
            console.error(`Error finding schedules for room ID ${roomId}:`, error);
            throw new Error('Failed to find schedules by room: ' + error.message);
        }
    }

    /**
     * Find schedules by date range
     * @param {string} startDate - Start date (YYYY-MM-DD)
     * @param {string} endDate - End date (YYYY-MM-DD)
     * @returns {Promise<Schedule[]>} Array of schedules within the date range
     */
    static async findByDateRange(startDate, endDate) {
        try {
            const schedulesData = await ScheduleDAO.findByDateRange(startDate, endDate);
            return schedulesData.map(scheduleData => new Schedule(scheduleData));
        } catch (error) {
            console.error(`Error finding schedules for date range ${startDate} to ${endDate}:`, error);
            throw new Error('Failed to find schedules by date range: ' + error.message);
        }
    }

    /**
     * Find schedules by doctor and date
     * @param {number} doctorId - Doctor ID
     * @param {string} date - Date (YYYY-MM-DD)
     * @returns {Promise<Schedule[]>} Array of schedules for the doctor and date
     */
    static async findByDoctorAndDate(doctorId, date) {
        try {
            const schedulesData = await ScheduleDAO.findByDoctorAndDate(doctorId, date);
            return schedulesData.map(scheduleData => new Schedule(scheduleData));
        } catch (error) {
            console.error(`Error finding schedules for doctor ID ${doctorId} on date ${date}:`, error);
            throw new Error('Failed to find schedules by doctor and date: ' + error.message);
        }
    }

    /**
     * Find schedules by status
     * @param {string} status - Schedule status
     * @returns {Promise<Schedule[]>} Array of schedules with the specified status
     */
    static async findByStatus(status) {
        try {
            const schedulesData = await ScheduleDAO.findByStatus(status);
            return schedulesData.map(scheduleData => new Schedule(scheduleData));
        } catch (error) {
            console.error(`Error finding schedules with status ${status}:`, error);
            throw new Error('Failed to find schedules by status: ' + error.message);
        }
    }

    /**
     * Add multiple schedules in bulk
     * @param {Array} schedulesData - Array of schedule data
     * @returns {Promise<Array>} Result of bulk insert
     */
    static async bulkAdd(schedulesData) {
        try {
            return await ScheduleDAO.bulkAdd(schedulesData);
        } catch (error) {
            console.error('Error adding schedules in bulk:', error);
            throw new Error('Failed to add schedules in bulk: ' + error.message);
        }
    }
}

export default Schedule; 