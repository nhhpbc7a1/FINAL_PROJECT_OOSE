import AppointmentDAO from '../dao/AppointmentDAO.js';
import Room from './Room.js';

/**
 * Appointment model representing an appointment in the system
 */
class Appointment {
    /**
     * Create a new Appointment instance
     * @param {Object} appointmentData - Appointment data
     */
    constructor(appointmentData = {}) {
        this.appointmentId = appointmentData.appointmentId || null;
        this.patientId = appointmentData.patientId;
        this.specialtyId = appointmentData.specialtyId;
        this.appointmentDate = appointmentData.appointmentDate;
        this.appointmentTime = appointmentData.appointmentTime;
        this.reason = appointmentData.reason;
        this.queueNumber = appointmentData.queueNumber || null;
        this.estimatedTime = appointmentData.estimatedTime || null;
        this.doctorId = appointmentData.doctorId;
        this.roomId = appointmentData.roomId || null;
        this.scheduleId = appointmentData.scheduleId || null;
        this.status = appointmentData.status || 'pending';
        this.emailVerified = appointmentData.emailVerified || false;
        this.paymentStatus = appointmentData.paymentStatus || 'pending';
        this.patientAppointmentStatus = appointmentData.patientAppointmentStatus || 'waiting';
        this.createdDate = appointmentData.createdDate;
        this.updatedDate = appointmentData.updatedDate;

        // Derived properties from joins
        this.patientName = appointmentData.patientName;
        this.patientEmail = appointmentData.patientEmail;
        this.patientPhone = appointmentData.patientPhone;
        this.doctorName = appointmentData.doctorName;
        this.specialtyName = appointmentData.specialtyName;
        this.roomNumber = appointmentData.roomNumber;
        
        // Related collections
        this.services = appointmentData.services || [];
    }

    /**
     * Save the appointment (create or update)
     * @returns {Promise<Appointment>} The saved appointment
     */
    async save() {
        try {
            const appointmentData = {
                patientId: this.patientId,
                specialtyId: this.specialtyId,
                appointmentDate: this.appointmentDate,
                appointmentTime: this.appointmentTime,
                reason: this.reason,
                queueNumber: this.queueNumber,
                estimatedTime: this.estimatedTime,
                doctorId: this.doctorId,
                roomId: this.roomId,
                scheduleId: this.scheduleId,
                status: this.status,
                emailVerified: this.emailVerified,
                paymentStatus: this.paymentStatus,
                patientAppointmentStatus: this.patientAppointmentStatus
            };
            
            if (this.appointmentId) {
                // Update existing appointment
                await AppointmentDAO.update(this.appointmentId, appointmentData);
            } else {
                // Create new appointment
                this.appointmentId = await AppointmentDAO.add(appointmentData);
            }
            
            // Fetch the updated/created appointment for return
            const updatedAppointment = await Appointment.findById(this.appointmentId);
            return updatedAppointment;
        } catch (error) {
            console.error('Error saving appointment:', error);
            throw new Error('Failed to save appointment: ' + error.message);
        }
    }

    /**
     * Delete the appointment
     * @returns {Promise<boolean>} True if deleted successfully
     */
    async delete() {
        try {
            if (!this.appointmentId) {
                throw new Error('Cannot delete unsaved appointment');
            }
            
            const result = await AppointmentDAO.delete(this.appointmentId);
            return result;
        } catch (error) {
            console.error('Error deleting appointment:', error);
            throw new Error('Failed to delete appointment: ' + error.message);
        }
    }

    /**
     * Get all appointments
     * @returns {Promise<Array<Appointment>>} Array of appointments
     */
    static async findAll() {
        try {
            const appointments = await AppointmentDAO.findAll();
            return appointments.map(appointment => new Appointment(appointment));
        } catch (error) {
            console.error('Error fetching all appointments:', error);
            throw new Error('Failed to load appointments: ' + error.message);
        }
    }

    /**
     * Find an appointment by ID
     * @param {number} appointmentId - Appointment ID
     * @returns {Promise<Appointment|null>} Found appointment or null
     */
    static async findById(appointmentId) {
        try {
            const appointment = await AppointmentDAO.findById(appointmentId);
            return appointment ? new Appointment(appointment) : null;
        } catch (error) {
            console.error(`Error fetching appointment by ID ${appointmentId}:`, error);
            throw new Error('Failed to find appointment: ' + error.message);
        }
    }

    /**
     * Find appointments by doctor ID
     * @param {number} doctorId - Doctor ID
     * @returns {Promise<Array<Appointment>>} Array of appointments
     */
    static async findByDoctor(doctorId) {
        try {
            const appointments = await AppointmentDAO.findByDoctor(doctorId);
            return appointments.map(appointment => new Appointment(appointment));
        } catch (error) {
            console.error(`Error fetching appointments for doctor ${doctorId}:`, error);
            throw new Error('Failed to load doctor appointments: ' + error.message);
        }
    }

    /**
     * Find appointments by patient ID
     * @param {number} patientId - Patient ID
     * @returns {Promise<Array<Appointment>>} Array of appointments
     */
    static async findByPatient(patientId) {
        try {
            const appointments = await AppointmentDAO.findByPatient(patientId);
            return appointments.map(appointment => new Appointment(appointment));
        } catch (error) {
            console.error(`Error fetching appointments for patient ${patientId}:`, error);
            throw new Error('Failed to load patient appointments: ' + error.message);
        }
    }

    /**
     * Find the latest appointment for a patient
     * @param {number} patientId - Patient ID
     * @returns {Promise<Appointment|null>} Latest appointment or null
     */
    static async findLatestForPatient(patientId) {
        try {
            const appointment = await AppointmentDAO.findLatestForPatient(patientId);
            return appointment ? new Appointment(appointment) : null;
        } catch (error) {
            console.error(`Error fetching latest appointment for patient ${patientId}:`, error);
            throw new Error('Failed to load latest patient appointment: ' + error.message);
        }
    }

    /**
     * Find appointments by date
     * @param {string} date - Date string in YYYY-MM-DD format
     * @returns {Promise<Array<Appointment>>} Array of appointments
     */
    static async findByDate(date) {
        try {
            const appointments = await AppointmentDAO.findByDate(date);
            return appointments.map(appointment => new Appointment(appointment));
        } catch (error) {
            console.error(`Error fetching appointments for date ${date}:`, error);
            throw new Error('Failed to load appointments for the specified date: ' + error.message);
        }
    }

    /**
     * Find appointments by status
     * @param {string} status - Appointment status
     * @returns {Promise<Array<Appointment>>} Array of appointments
     */
    static async findByStatus(status) {
        try {
            const appointments = await AppointmentDAO.findByStatus(status);
            return appointments.map(appointment => new Appointment(appointment));
        } catch (error) {
            console.error(`Error fetching appointments with status ${status}:`, error);
            throw new Error('Failed to load appointments by status: ' + error.message);
        }
    }

    /**
     * Get appointment with its related services
     * @param {number} appointmentId - Appointment ID
     * @returns {Promise<Appointment|null>} Appointment with services or null
     */
    static async getWithServices(appointmentId) {
        try {
            const appointmentData = await AppointmentDAO.getAppointmentWithServices(appointmentId);
            return appointmentData ? new Appointment(appointmentData) : null;
        } catch (error) {
            console.error(`Error fetching appointment with services for ID ${appointmentId}:`, error);
            throw new Error('Failed to load appointment with services: ' + error.message);
        }
    }

    /**
     * Count appointments by status
     * @returns {Promise<Object>} Counts by status
     */
    static async countByStatus() {
        try {
            return await AppointmentDAO.countByStatus();
        } catch (error) {
            console.error('Error counting appointments by status:', error);
            throw new Error('Failed to count appointments: ' + error.message);
        }
    }

    /**
     * Update the patient appointment status
     * @param {number} appointmentId - The appointment ID 
     * @param {string} status - The new status value
     * @returns {Promise<boolean>} Success status
     */
    static async updatePatientAppointmentStatus(appointmentId, status) {
        try {
            // Validate status
            const validStatuses = ['waiting', 'examining', 'examined'];
            if (!validStatuses.includes(status)) {
                throw new Error(`Invalid status: ${status}`);
            }
            
            // Get current appointment
            const appointment = await this.findById(appointmentId);
            if (!appointment) {
                throw new Error(`Appointment with ID ${appointmentId} not found`);
            }
            
            // Update status
            appointment.patientAppointmentStatus = status;
            await appointment.save();
            
            console.log(`Successfully updated appointment ${appointmentId} status to ${status}`);
            return true;
        } catch (error) {
            console.error(`Error updating appointment status to ${status}:`, error);
            throw new Error('Failed to update appointment status: ' + error.message);
        }
    }
    
    /**
     * Assign a random room to the appointment
     * @param {number} appointmentId - The appointment ID
     * @returns {Promise<Object>} Room information
     */
    static async assignRandomRoom(appointmentId) {
        try {
            // Get appointment
            const appointment = await this.findById(appointmentId);
            if (!appointment) {
                throw new Error(`Appointment with ID ${appointmentId} not found`);
            }
            
            // If appointment already has a room, return its details
            if (appointment.roomId) {
                const room = await Room.findById(appointment.roomId);
                if (room) {
                    return {
                        roomId: room.roomId,
                        roomNumber: room.roomNumber,
                        floor: '1' // Assuming floor information might be missing
                    };
                }
            }
            
            // Find available rooms
            const availableRooms = await Room.findByStatus('available');
            if (!availableRooms || availableRooms.length === 0) {
                throw new Error('No available rooms found');
            }
            
            // Filter examination rooms if needed
            const examinationRooms = availableRooms.filter(room => 
                room.roomType === 'examination'
            );
            
            // Use examination rooms if available, otherwise use any room
            const roomsToUse = examinationRooms.length > 0 ? examinationRooms : availableRooms;
            
            // Select a random room
            const randomRoom = roomsToUse[Math.floor(Math.random() * roomsToUse.length)];
            
            // Update appointment with the room
            appointment.roomId = randomRoom.roomId;
            await appointment.save();
            
            // Set the selected room as occupied
            randomRoom.status = 'occupied';
            await randomRoom.save();
            
            return {
                roomId: randomRoom.roomId,
                roomNumber: randomRoom.roomNumber,
                floor: '1' // Assuming floor information might be missing
            };
        } catch (error) {
            console.error(`Error assigning room to appointment ${appointmentId}:`, error);
            throw new Error('Failed to assign room: ' + error.message);
        }
    }
    
    /**
     * Release the room assigned to an appointment
     * @param {number} appointmentId - The appointment ID
     * @returns {Promise<boolean>} Success status
     */
    static async releaseRoom(appointmentId) {
        try {
            const appointment = await this.findById(appointmentId);
            if (!appointment) {
                throw new Error(`Appointment with ID ${appointmentId} not found`);
            }
            
            if (!appointment.roomId) {
                // No room assigned, nothing to release
                return false;
            }
            
            // Get the room from the Room model
            const room = await Room.findById(appointment.roomId);
            if (room) {
                // Set room back to available
                room.status = 'available';
                await room.save();
            }
            
            // Clear room assignment from appointment
            appointment.roomId = null;
            await appointment.save();
            
            return true;
        } catch (error) {
            console.error(`Error releasing room for appointment ${appointmentId}:`, error);
            throw new Error('Failed to release room: ' + error.message);
        }
    }
}

export default Appointment; 