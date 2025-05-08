import db from '../../ultis/db.js';
import moment from 'moment';

export default {
    async findAll() {
        try {
            return await db('Appointment')
                .join('Patient', 'Appointment.patientId', '=', 'Patient.patientId')
                .join('User as PatientUser', 'Patient.userId', '=', 'PatientUser.userId')
                .join('Specialty', 'Appointment.specialtyId', '=', 'Specialty.specialtyId')
                .leftJoin('Doctor', 'Appointment.doctorId', '=', 'Doctor.doctorId')
                .leftJoin('User as DoctorUser', 'Doctor.userId', '=', 'DoctorUser.userId')
                .leftJoin('Room', 'Appointment.roomId', '=', 'Room.roomId')
                .select(
                    'Appointment.*',
                    'PatientUser.fullName as patientName',
                    'PatientUser.phoneNumber as patientPhone',
                    'PatientUser.email',
                    'Specialty.name as specialtyName',
                    'DoctorUser.fullName as doctorName',
                    'Room.roomNumber'
                )
                .orderBy('Appointment.appointmentDate', 'desc')
                .orderBy('Appointment.estimatedTime', 'desc');
        } catch (error) {
            console.error('Error fetching appointments:', error);
            throw new Error('Unable to load appointments');
        }
    },

    async findById(appointmentId) {
        try {
            const appointment = await db('Appointment')
                .join('Patient', 'Appointment.patientId', '=', 'Patient.patientId')
                .join('User as PatientUser', 'Patient.userId', '=', 'PatientUser.userId')
                .join('Specialty', 'Appointment.specialtyId', '=', 'Specialty.specialtyId')
                .leftJoin('Doctor', 'Appointment.doctorId', '=', 'Doctor.doctorId')
                .leftJoin('User as DoctorUser', 'Doctor.userId', '=', 'DoctorUser.userId')
                .leftJoin('Room', 'Appointment.roomId', '=', 'Room.roomId')
                .select(
                    'Appointment.*',
                    'PatientUser.fullName as patientName',
                    'PatientUser.phoneNumber as patientPhone',
                    'PatientUser.email',
                    'Patient.gender as patientGender',
                    'Patient.dob as patientDob',
                    'Specialty.name as specialtyName',
                    'DoctorUser.fullName as doctorName',
                    'Room.roomNumber'
                )
                .where('Appointment.appointmentId', appointmentId)
                .first();
            return appointment || null;
        } catch (error) {
            console.error(`Error fetching appointment with ID ${appointmentId}:`, error);
            throw new Error('Unable to find appointment');
        }
    },

    async findByPatient(patientId) {
        try {
            return await db('Appointment')
                .join('Specialty', 'Appointment.specialtyId', '=', 'Specialty.specialtyId')
                .leftJoin('Doctor', 'Appointment.doctorId', '=', 'Doctor.doctorId')
                .leftJoin('User as DoctorUser', 'Doctor.userId', '=', 'DoctorUser.userId')
                .leftJoin('Room', 'Appointment.roomId', '=', 'Room.roomId')
                .select(
                    'Appointment.*',
                    'Specialty.name as specialtyName',
                    'DoctorUser.fullName as doctorName',
                    'Room.roomNumber'
                )
                .where('Appointment.patientId', patientId)
                .orderBy('Appointment.appointmentDate', 'desc')
                .orderBy('Appointment.estimatedTime', 'desc');
        } catch (error) {
            console.error(`Error fetching appointments for patient ${patientId}:`, error);
            throw new Error('Unable to find appointments by patient');
        }
    },

    async findByDoctor(doctorId) {
        try {
            return await db('Appointment')
                .join('Patient', 'Appointment.patientId', '=', 'Patient.patientId')
                .join('User as PatientUser', 'Patient.userId', '=', 'PatientUser.userId')
                .join('Specialty', 'Appointment.specialtyId', '=', 'Specialty.specialtyId')
                .leftJoin('Room', 'Appointment.roomId', '=', 'Room.roomId')
                .select(
                    'Appointment.*',
                    'PatientUser.fullName as patientName',
                    'PatientUser.phoneNumber as patientPhone',
                    'PatientUser.email',
                    'Patient.gender as patientGender',
                    'Specialty.name as specialtyName',
                    'Room.roomNumber'
                )
                .where('Appointment.doctorId', doctorId)
                .orderBy('Appointment.appointmentDate', 'desc')
                .orderBy('Appointment.estimatedTime', 'desc');
        } catch (error) {
            console.error(`Error fetching appointments for doctor ${doctorId}:`, error);
            throw new Error('Unable to find appointments by doctor');
        }
    },

    async findByDateRange(startDate, endDate) {
        try {
            console.log(`[Service] Finding appointments between ${startDate} and ${endDate}`);
            
            if (typeof startDate === 'string' && startDate.includes('/')) {
                // Convert DD/MM/YYYY to YYYY-MM-DD
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
            
            // Final date check - make sure we have a valid date format
            const formattedStartDate = moment(startDate).format('YYYY-MM-DD');
            const formattedEndDate = endDate ? moment(endDate).format('YYYY-MM-DD') : formattedStartDate;
            
            console.log(`[Service] Using dates for SQL query: ${formattedStartDate} to ${formattedEndDate}`);
            
            // First, let's check the available rooms
            const roomsCheck = await db('Room')
                .select('roomId', 'roomNumber', 'specialtyId')
                .limit(5);
            console.log('[Service] Sample rooms in database:', roomsCheck);
            
            // Then check appointments with rooms for this date
            const appointmentsWithRoomCheck = await db('Appointment')
                .select('appointmentId', 'roomId')
                .whereRaw('DATE(appointmentDate) = ?', [formattedStartDate])
                .limit(10);
            console.log('[Service] Sample appointments with roomId for this date:', appointmentsWithRoomCheck);
            
            // Construct and execute the query with safe date format
            const query = db('Appointment')
                .join('Patient', 'Appointment.patientId', '=', 'Patient.patientId')
                .join('User as PatientUser', 'Patient.userId', '=', 'PatientUser.userId')
                .join('Specialty', 'Appointment.specialtyId', '=', 'Specialty.specialtyId')
                .leftJoin('Doctor', 'Appointment.doctorId', '=', 'Doctor.doctorId')
                .leftJoin('User as DoctorUser', 'Doctor.userId', '=', 'DoctorUser.userId')
                .leftJoin('Room', 'Appointment.roomId', '=', 'Room.roomId')
                .select(
                    'Appointment.*',
                    'PatientUser.fullName as patientName',
                    'PatientUser.phoneNumber as patientPhone',
                    'PatientUser.email',
                    'Specialty.name as specialtyName',
                    'DoctorUser.fullName as doctorName',
                    'Room.roomNumber'
                )
                .whereRaw('DATE(Appointment.appointmentDate) = ?', [formattedStartDate])
                .orderBy('Appointment.appointmentDate')
                .orderBy('Appointment.estimatedTime');
            
            // Log the actual SQL for debugging
            const sqlString = query.toString();
            console.log(`[Service] SQL Query: ${sqlString}`);
            
            // Execute the query
            const result = await query;
            console.log(`[Service] Found ${result.length} appointments for date: ${formattedStartDate}`);
            
            // Debug room information for each appointment
            result.forEach(appointment => {
                console.log(`[Service] Appointment ${appointment.appointmentId} room data:`, 
                    appointment.roomNumber ? `Room ${appointment.roomNumber}` : 'No room assigned',
                    `(roomId: ${appointment.roomId || 'null'})`);
            });
            
            return result;
        } catch (error) {
            console.error(`Error fetching appointments between ${startDate} and ${endDate}:`, error);
            throw new Error('Unable to find appointments by date range');
        }
    },

    async findByStatus(status) {
        try {
            return await db('Appointment')
                .join('Patient', 'Appointment.patientId', '=', 'Patient.patientId')
                .join('User as PatientUser', 'Patient.userId', '=', 'PatientUser.userId')
                .join('Specialty', 'Appointment.specialtyId', '=', 'Specialty.specialtyId')
                .leftJoin('Doctor', 'Appointment.doctorId', '=', 'Doctor.doctorId')
                .leftJoin('User as DoctorUser', 'Doctor.userId', '=', 'DoctorUser.userId')
                .leftJoin('Room', 'Appointment.roomId', '=', 'Room.roomId')
                .select(
                    'Appointment.*',
                    'PatientUser.fullName as patientName',
                    'PatientUser.phoneNumber as patientPhone',
                    'PatientUser.email',
                    'Specialty.name as specialtyName',
                    'DoctorUser.fullName as doctorName',
                    'Room.roomNumber'
                )
                .where('Appointment.status', status)
                .orderBy('Appointment.appointmentDate')
                .orderBy('Appointment.estimatedTime');
        } catch (error) {
            console.error(`Error fetching appointments with status ${status}:`, error);
            throw new Error('Unable to find appointments by status');
        }
    },

    async findByPatientAppointmentStatus(status) {
        try {
            return await db('Appointment')
                .join('Patient', 'Appointment.patientId', '=', 'Patient.patientId')
                .join('User as PatientUser', 'Patient.userId', '=', 'PatientUser.userId')
                .join('Specialty', 'Appointment.specialtyId', '=', 'Specialty.specialtyId')
                .leftJoin('Doctor', 'Appointment.doctorId', '=', 'Doctor.doctorId')
                .leftJoin('User as DoctorUser', 'Doctor.userId', '=', 'DoctorUser.userId')
                .leftJoin('Room', 'Appointment.roomId', '=', 'Room.roomId')
                .select(
                    'Appointment.*',
                    'PatientUser.fullName as patientName',
                    'PatientUser.phoneNumber as patientPhone',
                    'PatientUser.email',
                    'Specialty.name as specialtyName',
                    'DoctorUser.fullName as doctorName',
                    'Room.roomNumber'
                )
                .where('Appointment.patientAppointmentStatus', status)
                .orderBy('Appointment.appointmentDate')
                .orderBy('Appointment.estimatedTime');
        } catch (error) {
            console.error(`Error fetching appointments with patient appointment status ${status}:`, error);
            throw new Error('Unable to find appointments by patient appointment status');
        }
    },

    async add(appointment) {
        try {
            const [appointmentId] = await db('Appointment').insert(appointment);
            return appointmentId;
        } catch (error) {
            console.error('Error adding appointment:', error);
            throw new Error('Unable to add appointment');
        }
    },

    async update(appointmentId, appointment) {
        try {
            const result = await db('Appointment')
                .where('appointmentId', appointmentId)
                .update(appointment);
            return result > 0;
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
            // Get appointment details
            const appointment = await this.findById(appointmentId);
            
            if (!appointment) return null;
            
            // Debug room information
            console.log(`[Service] getAppointmentWithServices: Appointment ${appointmentId} room data:`, 
                appointment.roomNumber ? `Room ${appointment.roomNumber}` : 'No room assigned',
                `(roomId: ${appointment.roomId || 'null'})`);
            
            // Verify Room exists if roomId is set
            if (appointment.roomId) {
                const room = await db('Room')
                    .select('roomId', 'roomNumber')
                    .where('roomId', appointment.roomId)
                    .first();
                    
                console.log('[Service] Room lookup for appointment:', room);
                
                // Update appointment with room number directly from Room table
                if (room && room.roomNumber) {
                    appointment.roomNumber = room.roomNumber;
                }
            }
            
            // Get services associated with this appointment
            const services = await db('AppointmentServices')
                .join('Service', 'AppointmentServices.serviceId', '=', 'Service.serviceId')
                .select(
                    'AppointmentServices.*',
                    'Service.name',
                    'Service.description',
                    'Service.duration',
                    'Service.type'
                )
                .where('AppointmentServices.appointmentId', appointmentId);
            
            // Get medical record if exists
            const medicalRecord = await db('MedicalRecord')
                .where('appointmentId', appointmentId)
                .first();
            
            // Return appointment with services and medical record
            return {
                ...appointment,
                services,
                medicalRecord
            };
        } catch (error) {
            console.error(`Error fetching appointment with services for ID ${appointmentId}:`, error);
            throw new Error('Unable to get appointment with services');
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