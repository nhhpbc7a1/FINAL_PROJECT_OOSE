import AppointmentDAO from '../dao/AppointmentDAO.js';

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
}

export default Appointment; 