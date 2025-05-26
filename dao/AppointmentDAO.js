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
                    'PatientUser.gender as patientGender',
                    'Patient.dob as patientDob',
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
            
            // Get patient email from Patient and User tables if not already available
            if (!appointment.patientEmail) {
                const patientData = await db('Patient')
                    .join('User', 'Patient.userId', '=', 'User.userId')
                    .select('User.email as patientEmail')
                    .where('Patient.patientId', appointment.patientId)
                    .first();
                
                if (patientData && patientData.patientEmail) {
                    appointment.patientEmail = patientData.patientEmail;
                }
            }
            
            // Get room information if not already available
            if (!appointment.roomNumber && appointment.roomId) {
                const roomData = await db('Room')
                    .select('roomNumber')
                    .where('roomId', appointment.roomId)
                    .first();
                
                if (roomData && roomData.roomNumber) {
                    appointment.roomNumber = roomData.roomNumber;
                }
            }
            
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
     * @param {Object} appointmentData - The appointment data to add
     * @returns {Promise<number>} The ID of the newly created appointment
     */
    static async add(appointmentData) {
        try {
            const [appointmentId] = await db('Appointment').insert({
                patientId: appointmentData.patientId,
                specialtyId: appointmentData.specialtyId,
                appointmentDate: appointmentData.appointmentDate,
                appointmentTime: appointmentData.appointmentTime,
                reason: appointmentData.reason,
                queueNumber: appointmentData.queueNumber,
                estimatedTime: appointmentData.estimatedTime,
                doctorId: appointmentData.doctorId,
                roomId: appointmentData.roomId,
                scheduleId: appointmentData.scheduleId,
                status: appointmentData.status || 'pending',
                emailVerified: appointmentData.emailVerified || false,
                paymentStatus: appointmentData.paymentStatus || 'pending',
                patientAppointmentStatus: appointmentData.patientAppointmentStatus || 'waiting'
            });
            
            return appointmentId;
        } catch (error) {
            console.error('Error adding appointment:', error);
            throw new Error('Failed to add appointment: ' + error.message);
        }
    }

    /**
     * Update an existing appointment
     * @param {number} appointmentId - The ID of the appointment to update
     * @param {Object} appointmentData - The updated appointment data
     * @returns {Promise<boolean>} True if update was successful
     */
    static async update(appointmentId, appointmentData) {
        try {
            const updateData = {};
            
            // Only include fields that are provided
            if (appointmentData.patientId !== undefined) updateData.patientId = appointmentData.patientId;
            if (appointmentData.specialtyId !== undefined) updateData.specialtyId = appointmentData.specialtyId;
            if (appointmentData.appointmentDate !== undefined) updateData.appointmentDate = appointmentData.appointmentDate;
            if (appointmentData.appointmentTime !== undefined) updateData.appointmentTime = appointmentData.appointmentTime;
            if (appointmentData.reason !== undefined) updateData.reason = appointmentData.reason;
            if (appointmentData.queueNumber !== undefined) updateData.queueNumber = appointmentData.queueNumber;
            if (appointmentData.estimatedTime !== undefined) updateData.estimatedTime = appointmentData.estimatedTime;
            if (appointmentData.doctorId !== undefined) updateData.doctorId = appointmentData.doctorId;
            if (appointmentData.roomId !== undefined) updateData.roomId = appointmentData.roomId;
            if (appointmentData.scheduleId !== undefined) updateData.scheduleId = appointmentData.scheduleId;
            if (appointmentData.status !== undefined) updateData.status = appointmentData.status;
            if (appointmentData.emailVerified !== undefined) updateData.emailVerified = appointmentData.emailVerified;
            if (appointmentData.paymentStatus !== undefined) updateData.paymentStatus = appointmentData.paymentStatus;
            if (appointmentData.patientAppointmentStatus !== undefined) updateData.patientAppointmentStatus = appointmentData.patientAppointmentStatus;
            
            await db('Appointment')
                .where('appointmentId', appointmentId)
                .update(updateData);
                
            return true;
        } catch (error) {
            console.error(`Error updating appointment ${appointmentId}:`, error);
            throw new Error('Failed to update appointment: ' + error.message);
        }
    }

    /**
     * Delete an appointment
     * @param {number} appointmentId - The ID of the appointment to delete
     * @returns {Promise<boolean>} True if deletion was successful
     */
    static async delete(appointmentId) {
        try {
            await db('Appointment')
                .where('appointmentId', appointmentId)
                .delete();
                
            return true;
        } catch (error) {
            console.error(`Error deleting appointment ${appointmentId}:`, error);
            throw new Error('Failed to delete appointment: ' + error.message);
        }
    }

    /**
     * Count appointments by status
     * @returns {Promise<Object>} Counts by status
     */
    static async countByStatus() {
        try {
            const counts = await db('Appointment')
                .select('status')
                .count('appointmentId as count')
                .groupBy('status');
                
            // Convert array of counts to an object
            const result = {};
            counts.forEach(item => {
                result[item.status] = parseInt(item.count);
            });
            
            return result;
        } catch (error) {
            console.error('Error counting appointments by status:', error);
            throw new Error('Failed to count appointments: ' + error.message);
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
     * Find the latest appointment for a patient
     * @param {number} patientId - ID of patient
     * @returns {Promise<Object|null>} Latest appointment or null if none found
     */
    static async findLatestForPatient(patientId) {
        try {
            const appointment = await db('Appointment')
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
                .orderBy('Appointment.appointmentTime', 'desc')
                .first();
            
            return appointment || null;
        } catch (error) {
            console.error(`Error fetching latest appointment for patient ID ${patientId}:`, error);
            throw new Error('Unable to load latest patient appointment');
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

    /**
     * Count unique patients for a specific doctor
     * @param {number} doctorId - ID of doctor
     * @returns {Promise<number>} Count of unique patients
     */
    static async countUniquePatientsByDoctor(doctorId) {
        try {
            const result = await db('Appointment')
                .where('doctorId', doctorId)
                .countDistinct('patientId as count')
                .first();
            
            return result ? result.count : 0;
        } catch (error) {
            console.error(`Error counting unique patients for doctor ID ${doctorId}:`, error);
            throw new Error('Unable to count unique patients');
        }
    }
    
    /**
     * Get appointments for a specific doctor on a specific date
     * @param {number} doctorId - ID of doctor
     * @param {string} date - Date in YYYY-MM-DD format
     * @returns {Promise<Array>} Array of appointments
     */
    static async findByDoctorAndDate(doctorId, date) {
        try {
            const appointments = await db('Appointment')
                .join('Patient', 'Appointment.patientId', '=', 'Patient.patientId')
                .join('User AS PatientUser', 'Patient.userId', '=', 'PatientUser.userId')
                .leftJoin('Room', 'Appointment.roomId', '=', 'Room.roomId')
                .select(
                    'Appointment.*',
                    'PatientUser.fullName as patientName',
                    'PatientUser.email as patientEmail',
                    'PatientUser.phoneNumber as patientPhone',
                    'Room.roomNumber'
                )
                .where('Appointment.doctorId', doctorId)
                .where('Appointment.appointmentDate', date)
                .orderBy('Appointment.estimatedTime', 'asc');
            
            // Log room information for debugging
            if (appointments.length > 0) {
                console.log(`Found ${appointments.length} appointments for doctor ${doctorId} on date ${date}`);
                console.log("Room information:", appointments.map(a => ({
                    id: a.appointmentId,
                    roomId: a.roomId,
                    roomNumber: a.roomNumber || 'Not assigned'
                })));
            }
            
            // Manually fetch room information for any appointment that's missing it but has a roomId
            for (const appt of appointments) {
                if (appt.roomId && !appt.roomNumber) {
                    console.log(`Appointment ${appt.appointmentId} has roomId ${appt.roomId} but no roomNumber, fetching directly`);
                    try {
                        const roomData = await db('Room')
                            .select('roomNumber')
                            .where('roomId', appt.roomId)
                            .first();
                            
                        if (roomData && roomData.roomNumber) {
                            appt.roomNumber = roomData.roomNumber;
                            console.log(`Successfully fetched room number ${roomData.roomNumber} for appointment ${appt.appointmentId}`);
                        }
                    } catch (roomError) {
                        console.error(`Error fetching room data for appointment ${appt.appointmentId}:`, roomError);
                    }
                }
            }
            
            return appointments;
        } catch (error) {
            console.error(`Error fetching appointments for doctor ID ${doctorId} on date ${date}:`, error);
            throw new Error('Unable to load doctor appointments for the specified date');
        }
    }
    
    /**
     * Get doctor's schedule with patient and specialty details for a specific date
     * @param {number} doctorId - ID of doctor
     * @param {string} date - Date in YYYY-MM-DD format
     * @returns {Promise<Array>} Array of schedule items with patient details
     */
    static async getDoctorScheduleForDate(doctorId, date) {
        try {
            const schedule = await db('Appointment')
                .join('Patient', 'Appointment.patientId', '=', 'Patient.patientId')
                .join('User AS PatientUser', 'Patient.userId', '=', 'PatientUser.userId')
                .leftJoin('Doctor', 'Appointment.doctorId', '=', 'Doctor.doctorId')
                .leftJoin('Specialty', 'Doctor.specialtyId', '=', 'Specialty.specialtyId')
                .leftJoin('Room', 'Appointment.roomId', '=', 'Room.roomId')
                .select(
                    'Appointment.*',
                    'PatientUser.fullName as patientName',
                    'PatientUser.gender as patientGender',
                    'PatientUser.phoneNumber as patientPhone',
                    'PatientUser.email as patientEmail',
                    'Patient.dob as patientDob',
                    'Specialty.name as specialtyName',
                    'Room.roomNumber'
                )
                .where('Appointment.doctorId', doctorId)
                .where('Appointment.appointmentDate', date)
                .orderBy('Appointment.estimatedTime', 'asc');
            
            // For debugging
            if (schedule.length > 0) {
                console.log("Schedule for doctor with room info:", schedule.map(appt => ({
                    id: appt.appointmentId,
                    roomId: appt.roomId,
                    roomNumber: appt.roomNumber || 'Not assigned',
                    patientName: appt.patientName
                })));
            }
            
            // Now manually fetch room information for any appointment that's missing it but has a roomId
            for (const appt of schedule) {
                if (appt.roomId && !appt.roomNumber) {
                    console.log(`Appointment ${appt.appointmentId} has roomId ${appt.roomId} but no roomNumber, fetching directly`);
                    try {
                        const roomData = await db('Room')
                            .select('roomNumber')
                            .where('roomId', appt.roomId)
                            .first();
                            
                        if (roomData && roomData.roomNumber) {
                            appt.roomNumber = roomData.roomNumber;
                            console.log(`Successfully fetched room number ${roomData.roomNumber} for appointment ${appt.appointmentId}`);
                        }
                    } catch (roomError) {
                        console.error(`Error fetching room data for appointment ${appt.appointmentId}:`, roomError);
                    }
                }
            }
            
            return schedule;
        } catch (error) {
            console.error(`Error fetching schedule for doctor ID ${doctorId} on date ${date}:`, error);
            throw new Error('Unable to load doctor schedule for the specified date');
        }
    }
    
    /**
     * Get all appointments for a doctor for calendar view
     * @param {number} doctorId - ID of doctor
     * @returns {Promise<Array>} Array of appointments for calendar
     */
    static async getDoctorAppointmentsForCalendar(doctorId) {
        try {
            return await db('Appointment')
                .join('Patient', 'Appointment.patientId', '=', 'Patient.patientId')
                .join('User AS PatientUser', 'Patient.userId', '=', 'PatientUser.userId')
                .select(
                    'Appointment.appointmentId',
                    'Appointment.appointmentDate',
                    'Appointment.estimatedTime',
                    'Appointment.status',
                    'Appointment.patientAppointmentStatus',
                    'PatientUser.fullName as patientName'
                )
                .where('Appointment.doctorId', doctorId)
                .orderBy('Appointment.appointmentDate', 'asc')
                .orderBy('Appointment.estimatedTime', 'asc');
        } catch (error) {
            console.error(`Error fetching calendar appointments for doctor ID ${doctorId}:`, error);
            throw new Error('Unable to load doctor calendar appointments');
        }
    }

    /**
     * Get appointments within a date range
     * @param {string} startDate - Start date in YYYY-MM-DD format
     * @param {string} endDate - End date in YYYY-MM-DD format
     * @returns {Promise<Array>} Array of appointments
     */
    static async findByDateRange(startDate, endDate) {
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
                    'PatientUser.gender as patientGender',
                    'Patient.dob as patientDob',
                    'DoctorUser.fullName as doctorName',
                    'Specialty.name as specialtyName',
                    'Room.roomNumber as roomNumber'
                )
                .whereBetween('Appointment.appointmentDate', [startDate, endDate])
                .orderBy('Appointment.appointmentDate', 'asc')
                .orderBy('Appointment.appointmentTime', 'asc');
        } catch (error) {
            console.error(`Error fetching appointments between ${startDate} and ${endDate}:`, error);
            throw new Error('Unable to load appointments for the specified date range');
        }
    }
    
    /**
     * Get appointments by patient appointment status
     * @param {string} status - Patient appointment status
     * @returns {Promise<Array>} Array of appointments
     */
    static async findByPatientAppointmentStatus(status) {
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
                .where('Appointment.patientAppointmentStatus', status)
                .orderBy('Appointment.appointmentDate', 'desc')
                .orderBy('Appointment.appointmentTime', 'asc');
        } catch (error) {
            console.error(`Error fetching appointments with patient appointment status ${status}:`, error);
            throw new Error('Unable to load appointments by patient appointment status');
        }
    }

    /**
     * Find an appointment by ID with all related details
     * @param {number} appointmentId - The ID of the appointment to find
     * @returns {Promise<Object|null>} The appointment with details or null if not found
     */
    static async findByIdWithDetails(appointmentId) {
        try {
            const appointment = await db('Appointment')
                .select(
                    'Appointment.*',
                    'Patient.dob',
                    'Patient.gender',
                    'User.fullName as patientName',
                    'User.email as patientEmail',
                    'User.phoneNumber as patientPhone',
                    'User.address as patientAddress',
                    'Specialty.name as specialtyName',
                    'Specialty.specialtyId',
                    'Doctor.doctorId',
                    'DoctorUser.fullName as doctorName',
                    'Room.roomNumber'
                )
                .leftJoin('Patient', 'Appointment.patientId', 'Patient.patientId')
                .leftJoin('User', 'Patient.userId', 'User.userId')
                .leftJoin('Specialty', 'Appointment.specialtyId', 'Specialty.specialtyId')
                .leftJoin('Doctor', 'Appointment.doctorId', 'Doctor.doctorId')
                .leftJoin('User as DoctorUser', 'Doctor.userId', 'DoctorUser.userId')
                .leftJoin('Room', 'Appointment.roomId', 'Room.roomId')
                .where('Appointment.appointmentId', appointmentId)
                .first();
            
            if (!appointment) return null;
            
            // Get services for this appointment
            const services = await db('AppointmentServices')
                .select(
                    'AppointmentServices.*',
                    'Service.name as serviceName',
                    'Service.description as serviceDescription',
                    'Service.type as serviceType'
                )
                .leftJoin('Service', 'AppointmentServices.serviceId', 'Service.serviceId')
                .where('AppointmentServices.appointmentId', appointmentId);
                
            appointment.services = services;
                
            return appointment;
        } catch (error) {
            console.error(`Error finding appointment details for ID ${appointmentId}:`, error);
            throw new Error('Failed to find appointment details: ' + error.message);
        }
    }

    /**
     * Find appointments for a patient
     * @param {number} patientId - The patient ID
     * @param {Object} filters - Optional filters for the query
     * @returns {Promise<Object[]>} Array of appointments
     */
    static async findByPatient(patientId, filters = {}) {
        try {
            let query = db('Appointment')
                .select(
                    'Appointment.*',
                    'Specialty.name as specialtyName',
                    'DoctorUser.fullName as doctorName',
                    'Room.roomNumber'
                )
                .leftJoin('Specialty', 'Appointment.specialtyId', 'Specialty.specialtyId')
                .leftJoin('Doctor', 'Appointment.doctorId', 'Doctor.doctorId')
                .leftJoin('User as DoctorUser', 'Doctor.userId', 'DoctorUser.userId')
                .leftJoin('Room', 'Appointment.roomId', 'Room.roomId')
                .where('Appointment.patientId', patientId)
                .where(function() {
                    this.where('Appointment.status', 'confirmed')
                        .orWhere('Appointment.status', 'cancelled')
                        .orWhere('Appointment.status', 'completed');
                })
                
            // Apply filters if provided
            if (filters.status) {
                query = query.where('Appointment.status', filters.status);
            }
            if (filters.date) {
                query = query.where('Appointment.appointmentDate', filters.date);
            }
            
            // Sort by date and time
            query = query.orderBy('Appointment.appointmentDate', 'desc')
                        .orderBy('Appointment.appointmentTime', 'asc');
                        
            return await query;
        } catch (error) {
            console.error(`Error finding appointments for patient ${patientId}:`, error);
            throw new Error('Failed to find patient appointments: ' + error.message);
        }
    }

    /**
     * Find appointments for a doctor
     * @param {number} doctorId - The doctor ID
     * @param {Object} filters - Optional filters for the query
     * @returns {Promise<Object[]>} Array of appointments
     */
    static async findByDoctor(doctorId, filters = {}) {
        try {
            let query = db('Appointment')
                .select(
                    'Appointment.*',
                    'Patient.dob',
                    'Patient.gender',
                    'User.fullName as patientName',
                    'User.email as patientEmail',
                    'User.phoneNumber as patientPhone',
                    'Specialty.name as specialtyName',
                    'Room.roomNumber'
                )
                .leftJoin('Patient', 'Appointment.patientId', 'Patient.patientId')
                .leftJoin('User', 'Patient.userId', 'User.userId')
                .leftJoin('Specialty', 'Appointment.specialtyId', 'Specialty.specialtyId')
                .leftJoin('Room', 'Appointment.roomId', 'Room.roomId')
                .where('Appointment.doctorId', doctorId);
                
            // Apply filters if provided
            if (filters.status) {
                query = query.where('Appointment.status', filters.status);
            }
            if (filters.date) {
                query = query.where('Appointment.appointmentDate', filters.date);
            }
            
            // Sort by date and time
            query = query.orderBy('Appointment.appointmentDate', 'desc')
                        .orderBy('Appointment.appointmentTime', 'asc');
                        
            return await query;
        } catch (error) {
            console.error(`Error finding appointments for doctor ${doctorId}:`, error);
            throw new Error('Failed to find doctor appointments: ' + error.message);
        }
    }

    /**
     * Find appointments for a specialty
     * @param {number} specialtyId - The specialty ID
     * @param {Object} filters - Optional filters for the query
     * @returns {Promise<Object[]>} Array of appointments
     */
    static async findBySpecialty(specialtyId, filters = {}) {
        try {
            let query = db('Appointment')
                .select(
                    'Appointment.*',
                    'Patient.dob',
                    'Patient.gender',
                    'User.fullName as patientName',
                    'User.email as patientEmail',
                    'User.phoneNumber as patientPhone',
                    'DoctorUser.fullName as doctorName',
                    'Room.roomNumber'
                )
                .leftJoin('Patient', 'Appointment.patientId', 'Patient.patientId')
                .leftJoin('User', 'Patient.userId', 'User.userId')
                .leftJoin('Doctor', 'Appointment.doctorId', 'Doctor.doctorId')
                .leftJoin('User as DoctorUser', 'Doctor.userId', 'DoctorUser.userId')
                .leftJoin('Room', 'Appointment.roomId', 'Room.roomId')
                .where('Appointment.specialtyId', specialtyId);
                
            // Apply filters if provided
            if (filters.status) {
                query = query.where('Appointment.status', filters.status);
            }
            if (filters.date) {
                query = query.where('Appointment.appointmentDate', filters.date);
            }
            
            // Sort by date and time
            query = query.orderBy('Appointment.appointmentDate', 'desc')
                        .orderBy('Appointment.appointmentTime', 'asc');
                        
            return await query;
        } catch (error) {
            console.error(`Error finding appointments for specialty ${specialtyId}:`, error);
            throw new Error('Failed to find specialty appointments: ' + error.message);
        }
    }

    /**
     * Find appointments by date
     * @param {string} date - The appointment date
     * @param {Object} filters - Optional filters for the query
     * @returns {Promise<Object[]>} Array of appointments
     */
    static async findByDate(date, filters = {}) {
        try {
            let query = db('Appointment')
                .select(
                    'Appointment.*',
                    'Patient.dob',
                    'Patient.gender',
                    'User.fullName as patientName',
                    'User.email as patientEmail',
                    'User.phoneNumber as patientPhone',
                    'Specialty.name as specialtyName',
                    'DoctorUser.fullName as doctorName',
                    'Room.roomNumber'
                )
                .leftJoin('Patient', 'Appointment.patientId', 'Patient.patientId')
                .leftJoin('User', 'Patient.userId', 'User.userId')
                .leftJoin('Specialty', 'Appointment.specialtyId', 'Specialty.specialtyId')
                .leftJoin('Doctor', 'Appointment.doctorId', 'Doctor.doctorId')
                .leftJoin('User as DoctorUser', 'Doctor.userId', 'DoctorUser.userId')
                .leftJoin('Room', 'Appointment.roomId', 'Room.roomId')
                .where('Appointment.appointmentDate', date);
                
            // Apply filters if provided
            if (filters.status) {
                query = query.where('Appointment.status', filters.status);
            }
            if (filters.specialtyId) {
                query = query.where('Appointment.specialtyId', filters.specialtyId);
            }
            if (filters.doctorId) {
                query = query.where('Appointment.doctorId', filters.doctorId);
            }
            
            // Sort by time
            query = query.orderBy('Appointment.appointmentTime', 'asc');
                        
            return await query;
        } catch (error) {
            console.error(`Error finding appointments for date ${date}:`, error);
            throw new Error('Failed to find appointments by date: ' + error.message);
        }
    }

    /**
     * Find appointments by status
     * @param {string} status - The appointment status
     * @param {Object} filters - Optional filters for the query
     * @returns {Promise<Object[]>} Array of appointments
     */
    static async findByStatus(status, filters = {}) {
        try {
            let query = db('Appointment')
                .select(
                    'Appointment.*',
                    'Patient.dob',
                    'Patient.gender',
                    'User.fullName as patientName',
                    'User.email as patientEmail',
                    'User.phoneNumber as patientPhone',
                    'Specialty.name as specialtyName',
                    'DoctorUser.fullName as doctorName',
                    'Room.roomNumber'
                )
                .leftJoin('Patient', 'Appointment.patientId', 'Patient.patientId')
                .leftJoin('User', 'Patient.userId', 'User.userId')
                .leftJoin('Specialty', 'Appointment.specialtyId', 'Specialty.specialtyId')
                .leftJoin('Doctor', 'Appointment.doctorId', 'Doctor.doctorId')
                .leftJoin('User as DoctorUser', 'Doctor.userId', 'DoctorUser.userId')
                .leftJoin('Room', 'Appointment.roomId', 'Room.roomId')
                .where('Appointment.status', status);
                
            // Apply filters if provided
            if (filters.date) {
                query = query.where('Appointment.appointmentDate', filters.date);
            }
            if (filters.specialtyId) {
                query = query.where('Appointment.specialtyId', filters.specialtyId);
            }
            if (filters.doctorId) {
                query = query.where('Appointment.doctorId', filters.doctorId);
            }
            
            // Sort by date and time
            query = query.orderBy('Appointment.appointmentDate', 'desc')
                        .orderBy('Appointment.appointmentTime', 'asc');
                        
            return await query;
        } catch (error) {
            console.error(`Error finding appointments with status ${status}:`, error);
            throw new Error('Failed to find appointments by status: ' + error.message);
        }
    }

    /**
     * Search for appointments
     * @param {string} query - The search query
     * @returns {Promise<Object[]>} Array of appointments
     */
    static async search(query) {
        try {
            return await db('Appointment')
                .select(
                    'Appointment.*',
                    'Patient.dob',
                    'Patient.gender',
                    'User.fullName as patientName',
                    'User.email as patientEmail',
                    'User.phoneNumber as patientPhone',
                    'Specialty.name as specialtyName',
                    'DoctorUser.fullName as doctorName',
                    'Room.roomNumber'
                )
                .leftJoin('Patient', 'Appointment.patientId', 'Patient.patientId')
                .leftJoin('User', 'Patient.userId', 'User.userId')
                .leftJoin('Specialty', 'Appointment.specialtyId', 'Specialty.specialtyId')
                .leftJoin('Doctor', 'Appointment.doctorId', 'Doctor.doctorId')
                .leftJoin('User as DoctorUser', 'Doctor.userId', 'DoctorUser.userId')
                .leftJoin('Room', 'Appointment.roomId', 'Room.roomId')
                .where(function() {
                    this.where('User.fullName', 'like', `%${query}%`)
                        .orWhere('User.email', 'like', `%${query}%`)
                        .orWhere('User.phoneNumber', 'like', `%${query}%`)
                        .orWhere('DoctorUser.fullName', 'like', `%${query}%`)
                        .orWhere('Specialty.name', 'like', `%${query}%`);
                })
                .orderBy('Appointment.appointmentDate', 'desc')
                .orderBy('Appointment.appointmentTime', 'asc');
        } catch (error) {
            console.error(`Error searching appointments with query "${query}":`, error);
            throw new Error('Failed to search appointments: ' + error.message);
        }
    }

    /**
     * Get recent appointments
     * @param {number} limit - Maximum number of appointments to return
     * @returns {Promise<Object[]>} Array of recent appointments
     */
    static async getRecent(limit = 10) {
        try {
            return await db('Appointment')
                .select(
                    'Appointment.*',
                    'User.fullName as patientName',
                    'Specialty.name as specialtyName',
                    'DoctorUser.fullName as doctorName'
                )
                .leftJoin('Patient', 'Appointment.patientId', 'Patient.patientId')
                .leftJoin('User', 'Patient.userId', 'User.userId')
                .leftJoin('Specialty', 'Appointment.specialtyId', 'Specialty.specialtyId')
                .leftJoin('Doctor', 'Appointment.doctorId', 'Doctor.doctorId')
                .leftJoin('User as DoctorUser', 'Doctor.userId', 'DoctorUser.userId')
                .orderBy('Appointment.createdDate', 'desc')
                .limit(limit);
        } catch (error) {
            console.error('Error getting recent appointments:', error);
            throw new Error('Failed to get recent appointments: ' + error.message);
        }
    }

    /**
     * Get appointments statistics
     * @returns {Promise<Object>} Appointment statistics
     */
    static async getStatistics() {
        try {
            // Total appointments
            const totalResult = await db('Appointment').count('appointmentId as count').first();
            const total = parseInt(totalResult.count);
            
            // Today's appointments
            const todayResult = await db('Appointment')
                .count('appointmentId as count')
                .where('appointmentDate', db.raw('CURDATE()'))
                .first();
            const today = parseInt(todayResult.count);
            
            // Pending appointments
            const pendingResult = await db('Appointment')
                .count('appointmentId as count')
                .where('status', 'pending')
                .first();
            const pending = parseInt(pendingResult.count);
            
            // Completed appointments
            const completedResult = await db('Appointment')
                .count('appointmentId as count')
                .where('status', 'completed')
                .first();
            const completed = parseInt(completedResult.count);
            
            return {
                total,
                today,
                pending,
                completed
            };
        } catch (error) {
            console.error('Error getting appointment statistics:', error);
            throw new Error('Failed to get appointment statistics: ' + error.message);
        }
    }
}

export default AppointmentDAO; 