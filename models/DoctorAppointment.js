import Doctor from './Doctor.js';
import Appointment from './Appointment.js';
import Patient from './Patient.js';
import Room from './Room.js';
import Schedule from './Schedule.js';
import moment from 'moment';

/**
 * DoctorAppointment model handles the doctor's appointment operations
 */
class DoctorAppointment {
    /**
     * Find all appointments
     * @returns {Promise<Array>} List of appointments
     */
    static async findAll() {
        try {
            return await Appointment.findAll();
        } catch (error) {
            console.error('Error fetching appointments:', error);
            throw new Error('Unable to load appointments');
        }
    }

    /**
     * Find appointment by ID
     * @param {number} appointmentId - The appointment ID
     * @returns {Promise<Object>} Appointment data
     */
    static async findById(appointmentId) {
        try {
            return await Appointment.findById(appointmentId);
        } catch (error) {
            console.error(`Error fetching appointment with ID ${appointmentId}:`, error);
            throw new Error('Unable to find appointment');
        }
    }

    /**
     * Find appointments by patient
     * @param {number} patientId - The patient ID
     * @returns {Promise<Array>} List of appointments
     */
    static async findByPatient(patientId) {
        try {
            return await Appointment.findByPatient(patientId);
        } catch (error) {
            console.error(`Error fetching appointments for patient ${patientId}:`, error);
            throw new Error('Unable to find appointments by patient');
        }
    }

    /**
     * Find appointments by doctor
     * @param {number} doctorId - The doctor ID
     * @returns {Promise<Array>} List of appointments
     */
    static async findByDoctor(doctorId) {
        try {
            // Validate doctor exists
            const doctor = await Doctor.findById(doctorId);
            if (!doctor) {
                throw new Error(`Doctor with ID ${doctorId} not found`);
            }
            
            return await Appointment.findByDoctor(doctorId);
        } catch (error) {
            console.error(`Error fetching appointments for doctor ${doctorId}:`, error);
            throw new Error('Unable to find appointments by doctor');
        }
    }

    /**
     * Find appointments by date range
     * @param {string} startDate - Start date (YYYY-MM-DD)
     * @param {string} endDate - End date (YYYY-MM-DD)
     * @returns {Promise<Array>} List of appointments
     */
    static async findByDateRange(startDate, endDate) {
        try {
            // Como não temos o método findByDateRange no modelo Appointment,
            // vamos buscar todos os compromissos e filtrar por data
            const allAppointments = await Appointment.findAll();
            
            // Convert input dates to Date objects for proper comparison
            const startDateObj = new Date(startDate);
            const endDateObj = new Date(endDate);
            
            // Ensure dates are valid
            if (isNaN(startDateObj.getTime()) || isNaN(endDateObj.getTime())) {
                throw new Error('Invalid date format provided');
            }
            
            // Set time to beginning of day for start date and end of day for end date
            startDateObj.setHours(0, 0, 0, 0);
            endDateObj.setHours(23, 59, 59, 999);
            
            console.log(`Filtering appointments between ${startDateObj.toISOString()} and ${endDateObj.toISOString()}`);
            
            const filteredAppointments = allAppointments.filter(appointment => {
                // Convert appointment date to Date object
                const appointmentDateObj = new Date(appointment.appointmentDate);
                return appointmentDateObj >= startDateObj && appointmentDateObj <= endDateObj;
            });
            
            console.log(`Found ${filteredAppointments.length} appointments in date range`);
            
            // Format appointment data with age calculation
            return filteredAppointments.map(appointment => {
                return {
                    ...appointment,
                    patientAge: this._calculatePatientAge(appointment.patientDob)
                };
            });
        } catch (error) {
            console.error(`Error fetching appointments for date range ${startDate} to ${endDate}:`, error);
            throw new Error('Unable to find appointments by date range');
        }
    }

    /**
     * Calculate patient age from date of birth
     * @param {string} dob - Date of birth
     * @returns {string|number} - Age as number or 'Unknown'
     * @private
     */
    static _calculatePatientAge(dob) {
        return dob ? moment().diff(moment(dob), 'years') : 'Unknown';
    }

    /**
     * Find appointments by status
     * @param {string} status - Appointment status
     * @returns {Promise<Array>} List of appointments
     */
    static async findByStatus(status) {
        try {
            // Se o modelo não tiver findByStatus, implementamos usando findAll e filtro
            const allAppointments = await Appointment.findAll();
            return allAppointments.filter(appointment => appointment.status === status);
        } catch (error) {
            console.error(`Error fetching appointments with status ${status}:`, error);
            throw new Error('Unable to find appointments by status');
        }
    }

    /**
     * Find appointments by patient appointment status
     * @param {string} status - Patient appointment status
     * @returns {Promise<Array>} List of appointments
     */
    static async findByPatientAppointmentStatus(status) {
        try {
            // Se o modelo não tiver findByPatientAppointmentStatus, implementamos usando findAll e filtro
            const allAppointments = await Appointment.findAll();
            return allAppointments.filter(appointment => 
                appointment.patientAppointmentStatus === status
            );
        } catch (error) {
            console.error(`Error fetching appointments with patient appointment status ${status}:`, error);
            throw new Error('Unable to find appointments by patient appointment status');
        }
    }

    /**
     * Add a new appointment
     * @param {Object} appointmentData - Appointment data
     * @returns {Promise<number>} New appointment ID
     */
    static async add(appointmentData) {
        try {
            await this._validateAppointmentData(appointmentData);
            
            const appointment = new Appointment(appointmentData);
            return await appointment.save();
        } catch (error) {
            console.error('Error adding appointment:', error);
            throw new Error('Unable to add appointment: ' + error.message);
        }
    }

    /**
     * Validate appointment data
     * @param {Object} appointmentData - Appointment data to validate
     * @private
     */
    static async _validateAppointmentData(appointmentData) {
        // Validate doctor if doctorId is provided
        if (appointmentData.doctorId) {
            const doctor = await Doctor.findById(appointmentData.doctorId);
            if (!doctor) {
                throw new Error('Selected doctor not found');
            }
        }
        
        // Validate patient if patientId is provided
        if (appointmentData.patientId) {
            const patient = await Patient.findById(appointmentData.patientId);
            if (!patient) {
                throw new Error('Selected patient not found');
            }
        }
    }

    /**
     * Update appointment
     * @param {number} appointmentId - Appointment ID
     * @param {Object} appointmentData - Updated appointment data
     * @returns {Promise<boolean>} Success status
     */
    static async update(appointmentId, appointmentData) {
        try {
            const appointment = await Appointment.findById(appointmentId);
            if (!appointment) {
                throw new Error(`Appointment with ID ${appointmentId} not found`);
            }
            
            // Update fields from appointmentData
            Object.assign(appointment, appointmentData);
            
            // Save the updated appointment
            await appointment.save();
            return true;
        } catch (error) {
            console.error(`Error updating appointment with ID ${appointmentId}:`, error);
            throw new Error('Unable to update appointment');
        }
    }

    /**
     * Update appointment status
     * @param {number} appointmentId - Appointment ID
     * @param {string} status - New status
     * @returns {Promise<boolean>} Success status
     */
    static async updateStatus(appointmentId, status) {
        try {
            const appointment = await Appointment.findById(appointmentId);
            if (!appointment) {
                throw new Error(`Appointment with ID ${appointmentId} not found`);
            }
            
            appointment.status = status;
            await appointment.save();
            return true;
        } catch (error) {
            console.error(`Error updating status for appointment with ID ${appointmentId}:`, error);
            throw new Error('Unable to update appointment status');
        }
    }

    /**
     * Update appointment payment status
     * @param {number} appointmentId - Appointment ID
     * @param {string} paymentStatus - New payment status
     * @returns {Promise<boolean>} Success status
     */
    static async updatePaymentStatus(appointmentId, paymentStatus) {
        try {
            const appointment = await Appointment.findById(appointmentId);
            if (!appointment) {
                throw new Error(`Appointment with ID ${appointmentId} not found`);
            }
            
            appointment.paymentStatus = paymentStatus;
            await appointment.save();
            return true;
        } catch (error) {
            console.error(`Error updating payment status for appointment with ID ${appointmentId}:`, error);
            throw new Error('Unable to update payment status');
        }
    }

    /**
     * Update patient appointment status
     * @param {number} appointmentId - Appointment ID
     * @param {string} status - New status
     * @returns {Promise<boolean>} Success status
     */
    static async updatePatientAppointmentStatus(appointmentId, status) {
        try {
            const appointment = await Appointment.findById(appointmentId);
            if (!appointment) {
                throw new Error(`Appointment with ID ${appointmentId} not found`);
            }
            
            appointment.patientAppointmentStatus = status;
            await appointment.save();
            return true;
        } catch (error) {
            console.error(`Error updating appointment status to ${status}:`, error);
            throw new Error('Failed to update appointment status');
        }
    }

    /**
     * Update the patient appointment status with transition handling
     * @param {number} appointmentId - The appointment ID
     * @param {string} newStatus - The new status to set
     * @param {boolean} forceUpdate - Force update regardless of status validation
     * @returns {Promise<boolean>} - Success status
     */
    static async updatePatientAppointmentStatusWithTransition(appointmentId, newStatus, forceUpdate = false) {
        try {
            const appointment = await Appointment.findById(appointmentId);
            if (!appointment) {
                throw new Error(`Appointment with ID ${appointmentId} not found`);
            }
            
            const currentStatus = appointment.patientAppointmentStatus;
            console.log(`Current status for appointment ${appointmentId}: ${currentStatus}, changing to: ${newStatus}`);
            
            this._validateStatusTransition(currentStatus, newStatus, forceUpdate);
            
            // Update the status
            appointment.patientAppointmentStatus = newStatus;
            await appointment.save();
            
            console.log(`Successfully updated appointment ${appointmentId} status to ${newStatus}`);
            return true;
        } catch (error) {
            console.error(`Error updating appointment ${appointmentId} status to ${newStatus}:`, error);
            throw error;
        }
    }

    /**
     * Validate appointment status transition
     * @param {string} currentStatus - Current status
     * @param {string} newStatus - New status
     * @param {boolean} forceUpdate - Whether to force update
     * @throws {Error} If transition is invalid
     * @private
     */
    static _validateStatusTransition(currentStatus, newStatus, forceUpdate) {
        // Define allowed status transitions
        const allowedTransitions = {
            'waiting': ['examining', 'examined'], // Waiting can go to examining or examined
            'examining': ['waiting', 'examined'], // Examining can go back to waiting or to examined
            'examined': [] // Examined is final state
        };
        
        // Check if transition is allowed
        if (!forceUpdate && allowedTransitions[currentStatus] && 
            !allowedTransitions[currentStatus].includes(newStatus)) {
            throw new Error(`Invalid status transition from ${currentStatus} to ${newStatus}`);
        }
    }

    /**
     * Assign doctor to appointment
     * @param {number} appointmentId - Appointment ID
     * @param {number} doctorId - Doctor ID
     * @param {number} roomId - Room ID
     * @param {number} scheduleId - Schedule ID
     * @returns {Promise<boolean>} Success status
     */
    static async assignDoctor(appointmentId, doctorId, roomId, scheduleId) {
        try {
            // Get the appointment
            const appointment = await Appointment.findById(appointmentId);
            if (!appointment) {
                throw new Error(`Appointment with ID ${appointmentId} not found`);
            }
            
            // Update appointment properties
            appointment.doctorId = doctorId;
            appointment.roomId = roomId;
            appointment.scheduleId = scheduleId;
            appointment.status = 'confirmed';
            
            // Save the appointment
            await appointment.save();
            
            // Update the schedule status to booked
            if (scheduleId) {
                const schedule = await Schedule.findById(scheduleId);
                if (schedule) {
                    schedule.status = 'booked';
                    await schedule.save();
                }
            }
            
            return true;
        } catch (error) {
            console.error(`Error assigning doctor to appointment with ID ${appointmentId}:`, error);
            throw new Error('Unable to assign doctor to appointment');
        }
    }

    /**
     * Delete appointment
     * @param {number} appointmentId - Appointment ID
     * @returns {Promise<boolean>} Success status
     */
    static async delete(appointmentId) {
        try {
            // First get the appointment to check for scheduleId
            const appointment = await Appointment.findById(appointmentId);
            if (!appointment) {
                return false; // Not found, considered already deleted
            }
            
            // Free up the schedule if exists
            if (appointment.scheduleId) {
                const schedule = await Schedule.findById(appointment.scheduleId);
                if (schedule) {
                    schedule.status = 'available';
                    await schedule.save();
                }
            }
            
            // Delete the appointment
            return await appointment.delete();
        } catch (error) {
            console.error(`Error deleting appointment with ID ${appointmentId}:`, error);
            throw new Error('Unable to delete appointment');
        }
    }

    /**
     * Get appointment with services
     * @param {number} appointmentId - Appointment ID
     * @returns {Promise<Object>} Appointment with services
     */
    static async getAppointmentWithServices(appointmentId) {
        try {
            return await Appointment.getWithServices(appointmentId);
        } catch (error) {
            console.error(`Error fetching appointment with services ${appointmentId}:`, error);
            throw new Error('Unable to get appointment with services');
        }
    }

    /**
     * Get patient appointments
     * @param {number} patientId - Patient ID
     * @returns {Promise<Array>} List of appointments
     */
    static async getPatientAppointments(patientId) {
        try {
            const appointments = await Appointment.findByPatient(patientId);
            
            // Format the appointments with proper date formatting and readable status
            return appointments.map(appointment => {
                const dateFormatted = moment(appointment.appointmentDate).format('MMM D, YYYY');
                const timeFormatted = appointment.estimatedTime 
                    ? moment(appointment.estimatedTime, 'HH:mm:ss').format('h:mm A')
                    : 'TBD';
                
                return {
                    ...appointment,
                    dateFormatted,
                    timeFormatted
                };
            });
        } catch (error) {
            console.error(`Error fetching appointments for patient ${patientId}:`, error);
            throw new Error('Unable to get patient appointments');
        }
    }

    /**
     * Assign random room to appointment
     * @param {number} appointmentId - Appointment ID
     * @returns {Promise<Object>} Room data
     */
    static async assignRandomRoom(appointmentId) {
        try {
            // First, check if the appointment already has a room assigned
            const appointment = await Appointment.findById(appointmentId);
            
            if (!appointment) {
                throw new Error(`Appointment with ID ${appointmentId} not found`);
            }
            
            // If appointment already has a room, return its details
            if (appointment.roomId) {
                const room = await Room.findById(appointment.roomId);
                return {
                    roomId: room.roomId,
                    roomNumber: room.roomNumber,
                    floor: room.floor
                };
            }
            
            // Get the doctor's specialty
            let specialtyId = null;
            if (appointment.doctorId) {
                const doctor = await Doctor.findById(appointment.doctorId);
                if (doctor) {
                    specialtyId = doctor.specialtyId;
                }
            }
            
            // Get available examination rooms
            // Se não houver método findAvailableByType, podemos implementar uma alternativa
            const allRooms = await Room.findAll();
            const availableRooms = allRooms.filter(room => 
                room.roomType === 'examination' && 
                room.status === 'available' && 
                (!specialtyId || room.specialtyId === specialtyId)
            );
            
            if (!availableRooms || availableRooms.length === 0) {
                throw new Error('No available examination rooms found');
            }
            
            // Pick a random room
            const randomRoom = availableRooms[Math.floor(Math.random() * availableRooms.length)];
            
            // Assign the room to the appointment
            appointment.roomId = randomRoom.roomId;
            await appointment.save();
            
            // Mark the room as occupied
            randomRoom.status = 'occupied';
            await randomRoom.save();
            
            return {
                roomId: randomRoom.roomId,
                roomNumber: randomRoom.roomNumber,
                floor: randomRoom.floor
            };
        } catch (error) {
            console.error(`Error assigning room to appointment ${appointmentId}:`, error);
            throw new Error('Failed to assign room: ' + error.message);
        }
    }

    /**
     * Release room for appointment
     * @param {number} appointmentId - Appointment ID
     * @returns {Promise<boolean>} Success status
     */
    static async releaseRoom(appointmentId) {
        try {
            // Get the appointment
            const appointment = await Appointment.findById(appointmentId);
            if (!appointment) {
                throw new Error(`Appointment with ID ${appointmentId} not found`);
            }
            
            if (!appointment.roomId) {
                // No room assigned, nothing to release
                return false;
            }
            
            // Get the room
            const room = await Room.findById(appointment.roomId);
            if (room) {
                // Mark the room as available
                room.status = 'available';
                await room.save();
            }
            
            // Remove room from appointment
            appointment.roomId = null;
            await appointment.save();
            
            return true;
        } catch (error) {
            console.error(`Error releasing room for appointment ${appointmentId}:`, error);
            throw new Error('Failed to release room: ' + error.message);
        }
    }
}

export default DoctorAppointment; 