import Doctor from '../../models/Doctor.js';
import AppointmentDAO from '../../dao/AppointmentDAO.js';
import TestResultDAO from '../../dao/TestResultDAO.js';
import RoomDAO from '../../dao/RoomDAO.js';
import moment from 'moment';

export default {
    /**
     * Get dashboard data for a specific doctor
     * @param {number} doctorId 
     * @returns {Object} 
     */
    async getDashboardData(doctorId) {
        try {
            const today = moment().format('YYYY-MM-DD');
            console.log("Today's date for query:", today);
            
            // Validate that doctor exists
            const doctor = await Doctor.findById(doctorId);
            if (!doctor) {
                throw new Error(`Doctor with ID ${doctorId} not found`);
            }
            
            // Check if we're in test/development mode with future dates in the database
            const isTestMode = process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test';
            
            // Get total unique patients count for this doctor
            const totalPatients = await AppointmentDAO.countUniquePatientsByDoctor(doctorId);
            
            // Get all appointments for this doctor
            const allAppointments = await AppointmentDAO.findByDoctor(doctorId);
            
            // Get today's appointments specifically
            const todayAppointments = await AppointmentDAO.findByDoctorAndDate(doctorId, today);
            
            // Get pending test results count for the last 7 days
            const pendingTestResults = await TestResultDAO.countCompletedByDoctor(doctorId, 7);
            
            // Get rooms for debugging if needed
            const rooms = await RoomDAO.findAll(5);
            
            // Get today's schedule with patient and specialty details
            const schedule = await AppointmentDAO.getDoctorScheduleForDate(doctorId, today);
            
            // Get all appointments for calendar view
            const allAppointmentsForCalendar = await AppointmentDAO.getDoctorAppointmentsForCalendar(doctorId);
            
            console.log("Today's appointments count:", todayAppointments.length);
            
            // Process appointment status counts
            const appointmentCounts = {
                total: todayAppointments.length,
                completed: 0,
                examining: 0,
                waiting: 0
            };
            
            // Count today's appointments by status
            todayAppointments.forEach(appointment => {
                if (appointment.patientAppointmentStatus === 'examined') {
                    appointmentCounts.completed++;
                } else if (appointment.patientAppointmentStatus === 'examining') {
                    appointmentCounts.examining++;
                } else if (appointment.patientAppointmentStatus === 'waiting') {
                    appointmentCounts.waiting++;
                }
            });
            
            // Format the schedule items
            const formattedSchedule = schedule.map(appointment => {
                const timeFormatted = appointment.estimatedTime 
                    ? moment(appointment.estimatedTime, 'HH:mm:ss').format('HH:mm')
                    : 'N/A';
                
                let statusClass = 'waiting';
                if (appointment.patientAppointmentStatus === 'examined') {
                    statusClass = 'examined';
                } else if (appointment.patientAppointmentStatus === 'waiting') {
                    statusClass = 'waiting';
                } else if (appointment.patientAppointmentStatus === 'examining') {
                    statusClass = 'examining';
                }
                
                return {
                    ...appointment,
                    timeFormatted,
                    statusClass,
                    dateFormatted: moment(appointment.appointmentDate).format('MMM D, YYYY'),
                    patientAppointmentStatus: appointment.patientAppointmentStatus
                };
            });
            
            // Format calendar events with all appointments
            const calendarEvents = allAppointmentsForCalendar.map(appointment => {
                // Format the date properly to ISO format first before concatenating with time
                const formattedDate = moment(appointment.appointmentDate).format('YYYY-MM-DD');
                const start = `${formattedDate}T${appointment.estimatedTime || '09:00:00'}`;
                // Default duration is 1 hour
                const end = moment(start).add(1, 'hour').format('YYYY-MM-DDTHH:mm:ss');
                
                let backgroundColor = '#FF9800'; // Orange for pending/waiting
                let borderColor = '#F57C00';
                
                if (appointment.patientAppointmentStatus === 'examined') {
                    backgroundColor = '#28a745'; // Green
                    borderColor = '#218838';
                } else if (appointment.patientAppointmentStatus === 'waiting') {
                    backgroundColor = '#006eb9'; // Blue
                    borderColor = '#0056b3';
                } else if (appointment.patientAppointmentStatus === 'examining') {
                    backgroundColor = '#dc3545'; // Red
                    borderColor = '#c82333';
                }
                
                return {
                    id: appointment.appointmentId,
                    title: `Patient: ${appointment.patientName}`,
                    start,
                    end,
                    backgroundColor,
                    borderColor
                };
            });
            
            return {
                totalPatients,
                appointments: appointmentCounts,
                pendingTestResults,
                todaySchedule: formattedSchedule,
                calendarEvents,
                todayFormatted: moment().format('dddd, MMMM D, YYYY')
            };
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
            throw new Error('Unable to load doctor dashboard data: ' + error.message);
        }
    },
    
    /**
     * Get doctor's profile information
     * @param {number} doctorId - The doctor's ID
     * @returns {Object} Doctor profile data
     */
    async getDoctorProfile(doctorId) {
        try {
            // Use the Doctor model to retrieve profile information
            const doctor = await Doctor.findById(doctorId);
            
            if (!doctor) {
                throw new Error(`Doctor with ID ${doctorId} not found`);
            }
            
            // Return only the profile-related fields
            return {
                doctorId: doctor.doctorId,
                fullName: doctor.fullName,
                email: doctor.email,
                gender: doctor.gender,
                phoneNumber: doctor.phoneNumber,
                profileImage: doctor.profileImage,
                experience: doctor.experience,
                specialtyName: doctor.specialtyName
            };
        } catch (error) {
            console.error('Error fetching doctor profile:', error);
            throw new Error('Unable to load doctor profile: ' + error.message);
        }
    }
}; 