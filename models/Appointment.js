import AppointmentDAO from '../dao/AppointmentDAO.js';
import db from '../ultis/db.js';

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
     * @returns {Promise<boolean>} True if the appointment was deleted
     */
    async delete() {
        try {
            if (!this.appointmentId) {
                throw new Error('Cannot delete unsaved appointment');
            }
            await AppointmentDAO.delete(this.appointmentId);
            return true;
        } catch (error) {
            console.error('Error deleting appointment:', error);
            throw new Error('Failed to delete appointment: ' + error.message);
        }
    }

    /**
     * Find all appointments
     * @param {Object} filters - Optional filters for the query
     * @returns {Promise<Appointment[]>} Array of appointments
     */
    static async findAll(filters = {}) {
        try {
            const appointments = await AppointmentDAO.findAll(filters);
            return appointments.map(appointment => new Appointment(appointment));
        } catch (error) {
            console.error('Error finding appointments:', error);
            throw new Error('Failed to find appointments: ' + error.message);
        }
    }

    /**
     * Find an appointment by ID
     * @param {number} appointmentId - The appointment ID
     * @returns {Promise<Appointment|null>} The appointment or null if not found
     */
    static async findById(appointmentId) {
        try {
            const appointment = await AppointmentDAO.findById(appointmentId);
            if (!appointment) return null;
            return new Appointment(appointment);
        } catch (error) {
            console.error(`Error finding appointment with ID ${appointmentId}:`, error);
            throw new Error('Failed to find appointment: ' + error.message);
        }
    }

    /**
     * Find appointments for a patient
     * @param {number} patientId - The patient ID
     * @param {Object} filters - Optional filters for the query
     * @returns {Promise<Appointment[]>} Array of appointments
     */
    static async findByPatient(patientId, filters = {}) {
        try {
            const appointments = await AppointmentDAO.findByPatient(patientId, filters);
            return appointments.map(appointment => new Appointment(appointment));
        } catch (error) {
            console.error(`Error finding appointments for patient ${patientId}:`, error);
            throw new Error('Failed to find patient appointments: ' + error.message);
        }
    }

    /**
     * Find appointments for a doctor
     * @param {number} doctorId - The doctor ID
     * @param {Object} filters - Optional filters for the query
     * @returns {Promise<Appointment[]>} Array of appointments
     */
    static async findByDoctor(doctorId, filters = {}) {
        try {
            const appointments = await AppointmentDAO.findByDoctor(doctorId, filters);
            return appointments.map(appointment => new Appointment(appointment));
        } catch (error) {
            console.error(`Error finding appointments for doctor ${doctorId}:`, error);
            throw new Error('Failed to find doctor appointments: ' + error.message);
        }
    }

    /**
     * Find appointments for a specialty
     * @param {number} specialtyId - The specialty ID
     * @param {Object} filters - Optional filters for the query
     * @returns {Promise<Appointment[]>} Array of appointments
     */
    static async findBySpecialty(specialtyId, filters = {}) {
        try {
            const appointments = await AppointmentDAO.findBySpecialty(specialtyId, filters);
            return appointments.map(appointment => new Appointment(appointment));
        } catch (error) {
            console.error(`Error finding appointments for specialty ${specialtyId}:`, error);
            throw new Error('Failed to find specialty appointments: ' + error.message);
        }
    }

    /**
     * Find appointments by date
     * @param {string} date - The appointment date
     * @param {Object} filters - Optional filters for the query
     * @returns {Promise<Appointment[]>} Array of appointments
     */
    static async findByDate(date, filters = {}) {
        try {
            const appointments = await AppointmentDAO.findByDate(date, filters);
            return appointments.map(appointment => new Appointment(appointment));
        } catch (error) {
            console.error(`Error finding appointments for date ${date}:`, error);
            throw new Error('Failed to find appointments by date: ' + error.message);
        }
    }

    /**
     * Find appointments by status
     * @param {string} status - The appointment status
     * @param {Object} filters - Optional filters for the query
     * @returns {Promise<Appointment[]>} Array of appointments
     */
    static async findByStatus(status, filters = {}) {
        try {
            const appointments = await AppointmentDAO.findByStatus(status, filters);
            return appointments.map(appointment => new Appointment(appointment));
        } catch (error) {
            console.error(`Error finding appointments with status ${status}:`, error);
            throw new Error('Failed to find appointments by status: ' + error.message);
        }
    }

    /**
     * Search for appointments
     * @param {string} query - The search query
     * @returns {Promise<Appointment[]>} Array of appointments
     */
    static async search(query) {
        try {
            const appointments = await AppointmentDAO.search(query);
            return appointments.map(appointment => new Appointment(appointment));
        } catch (error) {
            console.error(`Error searching appointments with query "${query}":`, error);
            throw new Error('Failed to search appointments: ' + error.message);
        }
    }

    /**
     * Find an appointment by ID with all related details (patient, doctor, specialty, room, services)
     * @param {number} appointmentId - The appointment ID
     * @returns {Promise<Appointment|null>} The appointment with details or null if not found
     */
    static async findByIdWithDetails(appointmentId) {
        try {
            const appointment = await AppointmentDAO.findByIdWithDetails(appointmentId);
            if (!appointment) return null;
            return new Appointment(appointment);
        } catch (error) {
            console.error(`Error finding appointment details for ID ${appointmentId}:`, error);
            throw new Error('Failed to find appointment details: ' + error.message);
        }
    }

    /**
     * Get the highest queue number for a specialty on a specific date
     * @param {number} specialtyId - The specialty ID
     * @param {string} appointmentDate - The appointment date
     * @returns {Promise<number>} The highest queue number
     */
    static async getHighestQueueNumber(specialtyId, appointmentDate) {
        try {
            const result = await db('Appointment')
                .max('queueNumber as maxQueue')
                .where({
                    specialtyId: specialtyId,
                    appointmentDate: appointmentDate
                })
                .first();
            
            return result && result.maxQueue ? parseInt(result.maxQueue) : 0;
        } catch (error) {
            console.error('Error getting highest queue number:', error);
            throw new Error('Failed to get highest queue number: ' + error.message);
        }
    }

    /**
     * Calculate estimated time for an appointment
     * @param {number} doctorId - The doctor ID
     * @param {string} appointmentDate - The appointment date
     * @param {number} queueNumber - The queue number
     * @returns {Promise<string|null>} The estimated time or null if not available
     */
    static async calculateEstimatedTime(doctorId, appointmentDate, queueNumber) {
        try {
            // Get doctor's schedule for the selected date
            const doctorSchedule = await db('Schedule')
                .select('startTime')
                .where({
                    doctorId: doctorId,
                    workDate: appointmentDate,
                    status: 'available'
                })
                .orderBy('startTime', 'asc')
                .first();

            if (!doctorSchedule) {
                console.log('No schedule found for doctor on the selected date');
                return null;
            }

            // Calculate estimated time: startTime + (queueNumber - 1) * 20 minutes
            const appointmentTimeBase = new Date(`${appointmentDate}T${doctorSchedule.startTime}`);
            const estimatedMinutes = (queueNumber - 1) * 20; // 20 minutes per patient
            
            appointmentTimeBase.setMinutes(appointmentTimeBase.getMinutes() + estimatedMinutes);
            
            // Format time for database
            const hours = appointmentTimeBase.getHours().toString().padStart(2, '0');
            const minutes = appointmentTimeBase.getMinutes().toString().padStart(2, '0');
            const seconds = appointmentTimeBase.getSeconds().toString().padStart(2, '0');
            
            return `${hours}:${minutes}:${seconds}`;
        } catch (error) {
            console.error('Error calculating estimated time:', error);
            throw new Error('Failed to calculate estimated time: ' + error.message);
        }
    }

    /**
     * Assign a doctor and room for an appointment
     * @param {number} specialtyId - The specialty ID
     * @param {string} appointmentDate - The appointment date
     * @returns {Promise<Object|null>} Assignment details or null if not possible
     */
    static async assignDoctorAndRoom(specialtyId, appointmentDate) {
        try {
            // Get doctors assigned to this specialty on the selected date
            const assignedDoctors = await db('Schedule')
                .select(
                    'Schedule.*', 
                    'Doctor.doctorId',
                    'Doctor.specialtyId',
                    'Room.roomId',
                    'Room.roomNumber'
                )
                .join('Doctor', 'Schedule.doctorId', 'Doctor.doctorId')
                .join('Room', 'Schedule.roomId', 'Room.roomId')
                .where({
                    'Doctor.specialtyId': specialtyId,
                    'Schedule.workDate': appointmentDate,
                    'Schedule.status': 'available'
                });

            if (!assignedDoctors || assignedDoctors.length === 0) {
                console.log('No doctors assigned for this specialty on the selected date');
                return null;
            }

            // Count current appointments for each doctor
            const doctorAppointmentCounts = await Promise.all(
                assignedDoctors.map(async (doctor) => {
                    const appointmentCount = await db('Appointment')
                        .count('appointmentId as count')
                        .where({
                            'doctorId': doctor.doctorId,
                            'appointmentDate': appointmentDate
                        })
                        .first();
                    
                    return {
                        ...doctor,
                        appointmentCount: appointmentCount ? parseInt(appointmentCount.count) : 0
                    };
                })
            );

            // Sort by appointment count (ascending)
            doctorAppointmentCounts.sort((a, b) => a.appointmentCount - b.appointmentCount);
            
            // Select doctor with fewest appointments
            const selectedDoctor = doctorAppointmentCounts[0];
            
            if (!selectedDoctor) {
                console.log('Could not select an appropriate doctor');
                return null;
            }

            // Get next queue number for this specialty on this date
            const nextQueueNumber = await Appointment.getHighestQueueNumber(specialtyId, appointmentDate) + 1;
            
            // Calculate estimated time
            const estimatedTime = await Appointment.calculateEstimatedTime(
                selectedDoctor.doctorId,
                appointmentDate,
                nextQueueNumber
            );

            return {
                doctorId: selectedDoctor.doctorId,
                roomId: selectedDoctor.roomId,
                roomNumber: selectedDoctor.roomNumber,
                queueNumber: nextQueueNumber,
                appointmentDate: appointmentDate,
                estimatedTime: estimatedTime
            };
        } catch (error) {
            console.error('Error assigning doctor and room:', error);
            throw new Error('Failed to assign doctor and room: ' + error.message);
        }
    }

    /**
     * Get available dates for appointments with a specialty
     * @param {number} specialtyId - The specialty ID
     * @returns {Promise<string[]>} Array of available dates
     */
    static async getAvailableDatesForSpecialty(specialtyId) {
        try {
            // Get dates with available schedules for doctors in this specialty
            const availableDates = await db('Schedule')
                .select(db.raw('DISTINCT DATE_FORMAT(workDate, "%Y-%m-%d") as date'))
                .join('Doctor', 'Schedule.doctorId', 'Doctor.doctorId')
                .where({
                    'Doctor.specialtyId': specialtyId,
                    'Schedule.status': 'available'
                })
                .where('workDate', '>=', db.raw('CURDATE()'))
                .orderBy('workDate', 'asc');
            
            return availableDates.map(dateObj => dateObj.date);
        } catch (error) {
            console.error('Error getting available dates for specialty:', error);
            throw new Error('Failed to get available dates: ' + error.message);
        }
    }
}

export default Appointment; 