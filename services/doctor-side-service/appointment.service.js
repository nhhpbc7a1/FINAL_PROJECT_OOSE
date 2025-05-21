import Doctor from '../../models/Doctor.js';
import AppointmentDAO from '../../dao/AppointmentDAO.js';
import PatientDAO from '../../dao/PatientDAO.js';
import db from '../../ultis/db.js';
import moment from 'moment';

export default {
    async findAll() {
        try {
            return await AppointmentDAO.findAll();
        } catch (error) {
            console.error('Error fetching appointments:', error);
            throw new Error('Unable to load appointments');
        }
    },

    async findById(appointmentId) {
        try {
            return await AppointmentDAO.findById(appointmentId);
        } catch (error) {
            console.error(`Error fetching appointment with ID ${appointmentId}:`, error);
            throw new Error('Unable to find appointment');
        }
    },

    async findByPatient(patientId) {
        try {
            return await AppointmentDAO.findByPatient(patientId);
        } catch (error) {
            console.error(`Error fetching appointments for patient ${patientId}:`, error);
            throw new Error('Unable to find appointments by patient');
        }
    },

    async findByDoctor(doctorId) {
        try {
            // Validate doctor exists
            const doctor = await Doctor.findById(doctorId);
            if (!doctor) {
                throw new Error(`Doctor with ID ${doctorId} not found`);
            }
            
            return await AppointmentDAO.findByDoctor(doctorId);
        } catch (error) {
            console.error(`Error fetching appointments for doctor ${doctorId}:`, error);
            throw new Error('Unable to find appointments by doctor');
        }
    },

    async findByDateRange(startDate, endDate) {
        try {
            console.log(`[Service] Finding appointments between ${startDate} and ${endDate}`);
            
            // Format dates properly
            if (typeof startDate === 'string' && startDate.includes('/')) {
                const parts = startDate.split('/');
                if (parts.length === 3) {
                    startDate = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
                    console.log(`[Service] Converted startDate from slash format to: ${startDate}`);
                }
            }
            
            // Same for endDate if present
            if (typeof endDate === 'string' && endDate.includes('/')) {
                const parts = endDate.split('/');
                if (parts.length === 3) {
                    endDate = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
                    console.log(`[Service] Converted endDate from slash format to: ${endDate}`);
                }
            }
            
            // Format dates with moment
            const formattedStartDate = moment(startDate).format('YYYY-MM-DD');
            const formattedEndDate = endDate ? moment(endDate).format('YYYY-MM-DD') : formattedStartDate;
            
            console.log(`[Service] Using dates for query: ${formattedStartDate} to ${formattedEndDate}`);
            
            // Use DAO to get data
            const result = await AppointmentDAO.findByDateRange(formattedStartDate, formattedEndDate);
            console.log(`[Service] Found ${result.length} appointments for date: ${formattedStartDate}`);
            
            return result;
        } catch (error) {
            console.error(`Error fetching appointments between ${startDate} and ${endDate}:`, error);
            throw new Error('Unable to find appointments by date range');
        }
    },

    async findByStatus(status) {
        try {
            return await AppointmentDAO.findByStatus(status);
        } catch (error) {
            console.error(`Error fetching appointments with status ${status}:`, error);
            throw new Error('Unable to find appointments by status');
        }
    },

    async findByPatientAppointmentStatus(status) {
        try {
            return await AppointmentDAO.findByPatientAppointmentStatus(status);
        } catch (error) {
            console.error(`Error fetching appointments with patient appointment status ${status}:`, error);
            throw new Error('Unable to find appointments by patient appointment status');
        }
    },

    async add(appointment) {
        try {
            // Validate doctor if doctorId is provided
            if (appointment.doctorId) {
                const doctor = await Doctor.findById(appointment.doctorId);
                if (!doctor) {
                    throw new Error('Selected doctor not found');
                }
            }
            
            // Validate patient if patientId is provided
            if (appointment.patientId) {
                const patient = await PatientDAO.findById(appointment.patientId);
                if (!patient) {
                    throw new Error('Selected patient not found');
                }
            }
            
            return await AppointmentDAO.add(appointment);
        } catch (error) {
            console.error('Error adding appointment:', error);
            throw new Error('Unable to add appointment: ' + error.message);
        }
    },

    async update(appointmentId, appointment) {
        try {
            return await AppointmentDAO.update(appointmentId, appointment);
        } catch (error) {
            console.error(`Error updating appointment with ID ${appointmentId}:`, error);
            throw new Error('Unable to update appointment');
        }
    },

    async updateStatus(appointmentId, status) {
        try {
            const result = await db('Appointment')
                .where('appointmentId', appointmentId)
                .update({ 
                    status, 
                    updatedDate: db.fn.now() 
                });
            return result > 0;
        } catch (error) {
            console.error(`Error updating status for appointment with ID ${appointmentId}:`, error);
            throw new Error('Unable to update appointment status');
        }
    },

    async updatePaymentStatus(appointmentId, paymentStatus) {
        try {
            const result = await db('Appointment')
                .where('appointmentId', appointmentId)
                .update({ 
                    paymentStatus, 
                    updatedDate: db.fn.now() 
                });
            return result > 0;
        } catch (error) {
            console.error(`Error updating payment status for appointment with ID ${appointmentId}:`, error);
            throw new Error('Unable to update payment status');
        }
    },

    // Restore the original function
    async updatePatientAppointmentStatus(appointmentId, status) {
        try {
            await db('Appointment')
                .where('appointmentId', appointmentId)
                .update({ patientAppointmentStatus: status });
            return true;
        } catch (error) {
            console.error(`Error updating appointment status to ${status}:`, error);
            throw new Error('Failed to update appointment status');
        }
    },

    /**
     * Update the patient appointment status with transition handling
     * @param {number} appointmentId - The appointment ID
     * @param {string} newStatus - The new status to set
     * @param {boolean} forceUpdate - Force update regardless of status validation
     * @returns {Promise<boolean>} - Success status
     */
    async updatePatientAppointmentStatusWithTransition(appointmentId, newStatus, forceUpdate = false) {
        try {
            // Check current status first
            const appointment = await db('Appointment')
                .where('appointmentId', appointmentId)
                .first('patientAppointmentStatus');
            
            if (!appointment) {
                throw new Error(`Appointment with ID ${appointmentId} not found`);
            }
            
            const currentStatus = appointment.patientAppointmentStatus;
            console.log(`Current status for appointment ${appointmentId}: ${currentStatus}, changing to: ${newStatus}`);
            
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
            
            // Update the status
            await db('Appointment')
                .where('appointmentId', appointmentId)
                .update({ patientAppointmentStatus: newStatus });
            
            console.log(`Successfully updated appointment ${appointmentId} status to ${newStatus}`);
            return true;
        } catch (error) {
            console.error(`Error updating appointment ${appointmentId} status to ${newStatus}:`, error);
            throw error;
        }
    },

    async assignDoctor(appointmentId, doctorId, roomId, scheduleId) {
        try {
            const result = await db('Appointment')
                .where('appointmentId', appointmentId)
                .update({ 
                    doctorId,
                    roomId,
                    scheduleId,
                    status: 'confirmed',
                    updatedDate: db.fn.now() 
                });
            
            // Update the schedule status to booked
            if (scheduleId) {
                await db('Schedule')
                    .where('scheduleId', scheduleId)
                    .update({ status: 'booked' });
            }
            
            return result > 0;
        } catch (error) {
            console.error(`Error assigning doctor to appointment with ID ${appointmentId}:`, error);
            throw new Error('Unable to assign doctor to appointment');
        }
    },

    async delete(appointmentId) {
        try {
            // First get the appointment to check for scheduleId
            const appointment = await db('Appointment')
                .where('appointmentId', appointmentId)
                .first();
            
            if (appointment && appointment.scheduleId) {
                // Free up the schedule
                await db('Schedule')
                    .where('scheduleId', appointment.scheduleId)
                    .update({ status: 'available' });
            }
            
            const result = await db('Appointment')
                .where('appointmentId', appointmentId)
                .delete();
            return result > 0;
        } catch (error) {
            console.error(`Error deleting appointment with ID ${appointmentId}:`, error);
            throw new Error('Unable to delete appointment');
        }
    },

    async getAppointmentWithServices(appointmentId) {
        try {
            return await AppointmentDAO.getAppointmentWithServices(appointmentId);
        } catch (error) {
            console.error(`Error fetching appointment with services for ID ${appointmentId}:`, error);
            throw new Error('Unable to fetch appointment details');
        }
    },

    async countByStatus() {
        try {
            return await db('Appointment')
                .select('status')
                .count('appointmentId as count')
                .groupBy('status');
        } catch (error) {
            console.error('Error counting appointments by status:', error);
            throw new Error('Unable to count appointments by status');
        }
    },

    async countBySpecialty() {
        try {
            return await db('Appointment')
                .join('Specialty', 'Appointment.specialtyId', '=', 'Specialty.specialtyId')
                .select('Specialty.name')
                .count('Appointment.appointmentId as count')
                .groupBy('Appointment.specialtyId');
        } catch (error) {
            console.error('Error counting appointments by specialty:', error);
            throw new Error('Unable to count appointments by specialty');
        }
    },

    async countByDateRange(startDate, endDate) {
        try {
            // Group appointments by date
            return await db('Appointment')
                .select(db.raw('DATE(appointmentDate) as date'))
                .count('appointmentId as count')
                .whereBetween('appointmentDate', [startDate, endDate])
                .groupBy('date')
                .orderBy('date');
        } catch (error) {
            console.error(`Error counting appointments between ${startDate} and ${endDate}:`, error);
            throw new Error('Unable to count appointments by date');
        }
    },

    async getLatestAppointmentForPatient(patientId) {
        try {
            const appointment = await db('Appointment')
                .where('patientId', patientId)
                .orderBy('appointmentDate', 'desc')
                .orderBy('appointmentTime', 'desc')
                .first();
            
            return appointment;
        } catch (error) {
            console.error(`Error getting latest appointment for patient ${patientId}:`, error);
            throw new Error('Failed to get latest appointment');
        }
    },

    async getPatientAppointments(patientId) {
        try {
            return await db('Appointment')
                .join('Specialty', 'Appointment.specialtyId', '=', 'Specialty.specialtyId')
                .leftJoin('Doctor', 'Appointment.doctorId', '=', 'Doctor.doctorId')
                .leftJoin('User as DoctorUser', 'Doctor.userId', '=', 'DoctorUser.userId')
                .leftJoin('Room', 'Appointment.roomId', '=', 'Room.roomId')
                .leftJoin('MedicalRecord', 'Appointment.appointmentId', '=', 'MedicalRecord.appointmentId')
                .select(
                    'Appointment.*',
                    'Specialty.name as specialtyName',
                    'DoctorUser.fullName as doctorName',
                    'Room.roomNumber',
                    'MedicalRecord.diagnosis',
                    'MedicalRecord.notes'
                )
                .where('Appointment.patientId', patientId)
                .orderBy('Appointment.appointmentDate', 'desc')
                .orderBy('Appointment.estimatedTime', 'desc');
        } catch (error) {
            console.error(`Error fetching appointments for patient ${patientId}:`, error);
            console.error('Error details:', error.message);
            // Return empty array instead of throwing an error
            return [];
        }
    }
}; 