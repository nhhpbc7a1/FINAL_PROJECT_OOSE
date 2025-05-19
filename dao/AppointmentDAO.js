import db from '../ultis/db.js';

/**
 * Data Access Object for Appointment-related database operations
 */
class AppointmentDAO {
    /**
     * Get all appointments
     * @returns {Promise<Array>} Array of appointment objects with patient and doctor info
     */
    static async findAll() {
        try {
            return await db('Appointment')
                .join('Patient', 'Appointment.patientId', '=', 'Patient.patientId')
                .join('User AS PatientUser', 'Patient.userId', '=', 'PatientUser.userId')
                .join('Doctor', 'Appointment.doctorId', '=', 'Doctor.doctorId')
                .join('User AS DoctorUser', 'Doctor.userId', '=', 'DoctorUser.userId')
                .join('Specialty', 'Doctor.specialtyId', '=', 'Specialty.specialtyId')
                .leftJoin('Room', 'Appointment.roomId', '=', 'Room.roomId')
                .select(
                    'Appointment.*',
                    'PatientUser.fullName as patientName',
                    'PatientUser.email as patientEmail',
                    'PatientUser.phoneNumber as patientPhone',
                    'DoctorUser.fullName as doctorName',
                    'Specialty.name as specialtyName',
                    'Room.roomNumber as roomNumber'
                )
                .orderBy('Appointment.appointmentDate', 'desc')
                .orderBy('Appointment.appointmentTime', 'asc');
        } catch (error) {
            console.error('Error fetching appointments:', error);
            throw new Error('Unable to load appointments');
        }
    }

    /**
     * Find an appointment by ID
     * @param {number} appointmentId - ID of appointment to find
     * @returns {Promise<Object|null>} Appointment object or null
     */
    static async findById(appointmentId) {
        try {
            const appointment = await db('Appointment')
                .join('Patient', 'Appointment.patientId', '=', 'Patient.patientId')
                .join('User AS PatientUser', 'Patient.userId', '=', 'PatientUser.userId')
                .join('Doctor', 'Appointment.doctorId', '=', 'Doctor.doctorId')
                .join('User AS DoctorUser', 'Doctor.userId', '=', 'DoctorUser.userId')
                .join('Specialty', 'Doctor.specialtyId', '=', 'Specialty.specialtyId')
                .leftJoin('Room', 'Appointment.roomId', '=', 'Room.roomId')
                .select(
                    'Appointment.*',
                    'PatientUser.fullName as patientName',
                    'PatientUser.email as patientEmail',
                    'PatientUser.phoneNumber as patientPhone',
                    'DoctorUser.fullName as doctorName',
                    'Specialty.name as specialtyName',
                    'Room.roomNumber as roomNumber'
                )
                .where('Appointment.appointmentId', appointmentId)
                .first();
            
            return appointment || null;
        } catch (error) {
            console.error(`Error fetching appointment with ID ${appointmentId}:`, error);
            throw new Error('Unable to find appointment');
        }
    }

    /**
     * Get appointment with related services
     * @param {number} appointmentId - ID of appointment
     * @returns {Promise<Object|null>} Appointment with services or null
     */
    static async getAppointmentWithServices(appointmentId) {
        try {
            // Get appointment info
            const appointment = await AppointmentDAO.findById(appointmentId);
            if (!appointment) return null;
            
            // Get related services
            const services = await db('AppointmentServices')
                .join('Service', 'AppointmentServices.serviceId', '=', 'Service.serviceId')
                .select(
                    'Service.serviceId',
                    'Service.name',
                    'Service.description',
                    'Service.price',
                    db.raw('Service.price as totalPrice')
                )
                .where('AppointmentServices.appointmentId', appointmentId);
            
            return {
                ...appointment,
                services
            };
        } catch (error) {
            console.error(`Error fetching appointment with services for ID ${appointmentId}:`, error);
            throw new Error('Unable to get appointment with services');
        }
    }

    /**
     * Add a new appointment
     * @param {Object} appointment - Appointment data to add
     * @returns {Promise<number>} ID of the new appointment
     */
    static async add(appointment) {
        try {
            const [appointmentId] = await db('Appointment').insert(appointment);
            return appointmentId;
        } catch (error) {
            console.error('Error adding appointment:', error);
            throw new Error('Unable to add appointment');
        }
    }

    /**
     * Update an appointment
     * @param {number} appointmentId - ID of appointment to update
     * @param {Object} appointmentData - New appointment data
     * @returns {Promise<boolean>} True if successful
     */
    static async update(appointmentId, appointmentData) {
        try {
            const result = await db('Appointment')
                .where('appointmentId', appointmentId)
                .update(appointmentData);
            return result > 0;
        } catch (error) {
            console.error(`Error updating appointment with ID ${appointmentId}:`, error);
            throw new Error('Unable to update appointment');
        }
    }

    /**
     * Delete an appointment
     * @param {number} appointmentId - ID of appointment to delete
     * @returns {Promise<boolean>} True if successful
     */
    static async delete(appointmentId) {
        try {
            const result = await db('Appointment')
                .where('appointmentId', appointmentId)
                .delete();
            return result > 0;
        } catch (error) {
            console.error(`Error deleting appointment with ID ${appointmentId}:`, error);
            throw new Error('Unable to delete appointment');
        }
    }

    /**
     * Count appointments by status
     * @returns {Promise<Array>} Array of counts by status
     */
    static async countByStatus() {
        try {
            const counts = await db('Appointment')
                .select('status')
                .count('appointmentId as count')
                .groupBy('status');
            
            // Format into a more useful object
            const result = {
                total: 0
            };
            
            counts.forEach(item => {
                result[item.status.toLowerCase()] = item.count;
                result.total += item.count;
            });
            
            return result;
        } catch (error) {
            console.error('Error counting appointments by status:', error);
            throw new Error('Unable to count appointments by status');
        }
    }

    /**
     * Get appointments for a specific doctor
     * @param {number} doctorId - ID of doctor
     * @returns {Promise<Array>} Array of appointments
     */
    static async findByDoctor(doctorId) {
        try {
            return await db('Appointment')
                .join('Patient', 'Appointment.patientId', '=', 'Patient.patientId')
                .join('User AS PatientUser', 'Patient.userId', '=', 'PatientUser.userId')
                .leftJoin('Room', 'Appointment.roomId', '=', 'Room.roomId')
                .select(
                    'Appointment.*',
                    'PatientUser.fullName as patientName',
                    'PatientUser.email as patientEmail',
                    'PatientUser.phoneNumber as patientPhone',
                    'Room.roomNumber as roomNumber'
                )
                .where('Appointment.doctorId', doctorId)
                .orderBy('Appointment.appointmentDate', 'desc')
                .orderBy('Appointment.appointmentTime', 'asc');
        } catch (error) {
            console.error(`Error fetching appointments for doctor ID ${doctorId}:`, error);
            throw new Error('Unable to load doctor appointments');
        }
    }

    /**
     * Get appointments for a specific patient
     * @param {number} patientId - ID of patient
     * @returns {Promise<Array>} Array of appointments
     */
    static async findByPatient(patientId) {
        try {
            return await db('Appointment')
                .join('Doctor', 'Appointment.doctorId', '=', 'Doctor.doctorId')
                .join('User AS DoctorUser', 'Doctor.userId', '=', 'DoctorUser.userId')
                .join('Specialty', 'Doctor.specialtyId', '=', 'Specialty.specialtyId')
                .leftJoin('Room', 'Appointment.roomId', '=', 'Room.roomId')
                .select(
                    'Appointment.*',
                    'DoctorUser.fullName as doctorName',
                    'Specialty.name as specialtyName',
                    'Room.roomNumber as roomNumber'
                )
                .where('Appointment.patientId', patientId)
                .orderBy('Appointment.appointmentDate', 'desc')
                .orderBy('Appointment.appointmentTime', 'asc');
        } catch (error) {
            console.error(`Error fetching appointments for patient ID ${patientId}:`, error);
            throw new Error('Unable to load patient appointments');
        }
    }

    /**
     * Get appointments for a specific date
     * @param {string} date - Date in YYYY-MM-DD format
     * @returns {Promise<Array>} Array of appointments
     */
    static async findByDate(date) {
        try {
            return await db('Appointment')
                .join('Patient', 'Appointment.patientId', '=', 'Patient.patientId')
                .join('User AS PatientUser', 'Patient.userId', '=', 'PatientUser.userId')
                .join('Doctor', 'Appointment.doctorId', '=', 'Doctor.doctorId')
                .join('User AS DoctorUser', 'Doctor.userId', '=', 'DoctorUser.userId')
                .join('Specialty', 'Doctor.specialtyId', '=', 'Specialty.specialtyId')
                .leftJoin('Room', 'Appointment.roomId', '=', 'Room.roomId')
                .select(
                    'Appointment.*',
                    'PatientUser.fullName as patientName',
                    'DoctorUser.fullName as doctorName',
                    'Specialty.name as specialtyName',
                    'Room.roomNumber as roomNumber'
                )
                .where('Appointment.appointmentDate', date)
                .orderBy('Appointment.appointmentTime', 'asc');
        } catch (error) {
            console.error(`Error fetching appointments for date ${date}:`, error);
            throw new Error('Unable to load appointments for the specified date');
        }
    }

    /**
     * Get appointments by status
     * @param {string} status - Appointment status
     * @returns {Promise<Array>} Array of appointments
     */
    static async findByStatus(status) {
        try {
            return await db('Appointment')
                .join('Patient', 'Appointment.patientId', '=', 'Patient.patientId')
                .join('User AS PatientUser', 'Patient.userId', '=', 'PatientUser.userId')
                .join('Doctor', 'Appointment.doctorId', '=', 'Doctor.doctorId')
                .join('User AS DoctorUser', 'Doctor.userId', '=', 'DoctorUser.userId')
                .join('Specialty', 'Doctor.specialtyId', '=', 'Specialty.specialtyId')
                .leftJoin('Room', 'Appointment.roomId', '=', 'Room.roomId')
                .select(
                    'Appointment.*',
                    'PatientUser.fullName as patientName',
                    'DoctorUser.fullName as doctorName',
                    'Specialty.name as specialtyName',
                    'Room.roomNumber as roomNumber'
                )
                .where('Appointment.status', status)
                .orderBy('Appointment.appointmentDate', 'desc')
                .orderBy('Appointment.appointmentTime', 'asc');
        } catch (error) {
            console.error(`Error fetching appointments with status ${status}:`, error);
            throw new Error('Unable to load appointments by status');
        }
    }
}

export default AppointmentDAO; 