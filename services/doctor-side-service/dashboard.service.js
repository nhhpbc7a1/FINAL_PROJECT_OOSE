import db from '../../ultis/db.js';
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
            
            // Check if we're in test/development mode with future dates in the database
            const isTestMode = process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test';
            
            // For tests or development, we might use data with future dates
            // So we'll include these appointments in our dashboard
            const dateFilter = isTestMode 
                ? appointment => true  // Accept all appointments in test mode
                : appointment => moment(appointment.appointmentDate).format('YYYY-MM-DD') === today; // Only same-day in production
            
            // Get total patients count for this doctor
            const totalPatientsQuery = db('Appointment')
                .countDistinct('patientId as count')
                .where('doctorId', doctorId);
            
            // Get all appointments for this doctor
            const allAppointmentsQuery = db('Appointment')
                .select('appointmentId', 'patientAppointmentStatus', 'appointmentDate')
                .where('doctorId', doctorId);
            
            // Get today's appointments specifically
            const todayAppointmentsQuery = db('Appointment')
                .select('appointmentId', 'patientAppointmentStatus', 'appointmentDate', 'estimatedTime')
                .where('doctorId', doctorId)
                .where('appointmentDate', today);
            
            // Get pending test results count
            const pendingTestResultsQuery = db('TestResult')
                .join('MedicalRecord', 'TestResult.recordId', '=', 'MedicalRecord.recordId')
                .join('Appointment', 'MedicalRecord.appointmentId', '=', 'Appointment.appointmentId')
                .count('TestResult.resultId as count')
                .where('Appointment.doctorId', doctorId)
                .where('TestResult.status', 'completed')
                .whereRaw('TestResult.performedDate >= NOW() - INTERVAL 7 DAY');
            
            // First, let's debug the Room data
            const roomsCheckQuery = db('Room')
                .select('roomId', 'roomNumber', 'specialtyId')
                .limit(5);

            // And check appointments with roomId
            const appointmentsWithRoomQuery = db('Appointment')
                .select('appointmentId', 'roomId')
                .where('doctorId', doctorId)
                .where('appointmentDate', today);
       
            const scheduleQuery = db('Appointment')
                .join('Patient', 'Appointment.patientId', '=', 'Patient.patientId')
                .join('User', 'Patient.userId', '=', 'User.userId')
                .join('Specialty', 'Appointment.specialtyId', '=', 'Specialty.specialtyId')
                .leftJoin('Room', 'Appointment.roomId', '=', 'Room.roomId')
                .select(
                    'Appointment.appointmentId',
                    'Appointment.appointmentDate',
                    'Appointment.estimatedTime',
                    'Appointment.reason',
                    'Appointment.patientAppointmentStatus',
                    'Appointment.roomId', // Add roomId for debugging
                    'User.fullName as patientName',
                    'Specialty.name as specialtyName',
                    'Room.roomNumber'
                )
                .where('Appointment.doctorId', doctorId)
                .where('Appointment.appointmentDate', today) // Only show today's schedule
                .orderBy('Appointment.appointmentDate')
                .orderBy('Appointment.estimatedTime');
            
            // Get all appointments for calendar view (no date restriction)
            const allAppointmentsForCalendarQuery = db('Appointment')
                .select(
                    'Appointment.appointmentId',
                    'Appointment.appointmentDate',
                    'Appointment.estimatedTime',
                    'Appointment.patientAppointmentStatus',
                    'User.fullName as patientName'
                )
                .join('Patient', 'Appointment.patientId', '=', 'Patient.patientId')
                .join('User', 'Patient.userId', '=', 'User.userId')
                .where('Appointment.doctorId', doctorId)
                .orderBy('Appointment.appointmentDate')
                .orderBy('Appointment.estimatedTime');
            
            // Execute all queries in parallel
            const [
                totalPatientsResult,
                allAppointments,
                todayAppointments,
                pendingTestResultsResult,
                roomsCheck,
                appointmentsWithRoom,
                scheduleResults,
                allAppointmentsForCalendar
            ] = await Promise.all([
                totalPatientsQuery,
                allAppointmentsQuery,
                todayAppointmentsQuery,
                pendingTestResultsQuery,
                roomsCheckQuery,
                appointmentsWithRoomQuery,
                scheduleQuery,
                allAppointmentsForCalendarQuery
            ]);

            console.log("Today's appointments count:", todayAppointments.length);
            console.log("Sample rooms in database:", roomsCheck);
            console.log("Appointments with roomId:", appointmentsWithRoom);
            
            // Process appointment status counts with today's appointments
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
            const formattedSchedule = scheduleResults.map(appointment => {
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
                
                // Debug line for tracking room number
                console.log(`Appointment ${appointment.appointmentId} room data:`, 
                    appointment.roomNumber ? `Room ${appointment.roomNumber}` : 'No room assigned',
                    `(roomId: ${appointment.roomId || 'null'})`);
                
                return {
                    ...appointment,
                    timeFormatted,
                    statusClass,
                    dateFormatted: moment(appointment.appointmentDate).format('MMM D, YYYY'),
                    patientAppointmentStatus: appointment.patientAppointmentStatus
                };
            });
            
            // Format calendar events with all appointments, not just upcoming ones
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
                totalPatients: totalPatientsResult[0].count,
                appointments: appointmentCounts,
                pendingTestResults: pendingTestResultsResult[0].count,
                todaySchedule: formattedSchedule,
                calendarEvents,
                todayFormatted: moment().format('dddd, MMMM D, YYYY')
            };
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
            throw new Error('Unable to load doctor dashboard data');
        }
    },
    
    /**
     * Get doctor's profile information
     * @param {number} doctorId - The doctor's ID
     * @returns {Object} Doctor profile data
     */
    async getDoctorProfile(doctorId) {
        try {
            const doctor = await db('Doctor')
                .join('User', 'Doctor.userId', '=', 'User.userId')
                .join('Specialty', 'Doctor.specialtyId', '=', 'Specialty.specialtyId')
                .select(
                    'Doctor.doctorId',
                    'User.fullName',
                    'User.email',
                    'User.gender',
                    'User.phoneNumber',
                    'User.profileImage',
                    'Doctor.experience',
                    'Specialty.name as specialtyName'
                )
                .where('Doctor.doctorId', doctorId)
                .first();
                
            return doctor;
        } catch (error) {
            console.error('Error fetching doctor profile:', error);
            throw new Error('Unable to load doctor profile');
        }
    }
}; 