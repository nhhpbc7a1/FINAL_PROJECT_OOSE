import Doctor from './Doctor.js';
import Appointment from './Appointment.js';
import TestResult from './TestResult.js';
import Room from './Room.js';
import moment from 'moment';

/**
 * DoctorDashboard model handles the dashboard functionality for doctors
 */
class DoctorDashboard {
    /**
     * Get dashboard data for a specific doctor
     * @param {number} doctorId 
     * @returns {Object} Dashboard data
     */
    static async getDashboardData(doctorId) {
        try {
            const today = moment().format('YYYY-MM-DD');
            console.log("Today's date for query:", today);
            
            // Validate that doctor exists
            const doctor = await Doctor.findById(doctorId);
            if (!doctor) {
                throw new Error(`Doctor with ID ${doctorId} not found`);
            }
            
            // Get all appointments for this doctor
            const allAppointments = await Appointment.findByDoctor(doctorId);
            console.log(`Found ${allAppointments.length} total appointments for doctor ${doctorId}`);
            
            if (allAppointments.length > 0) {
                console.log("Sample appointment data:", {
                    id: allAppointments[0].appointmentId,
                    date: allAppointments[0].appointmentDate,
                    patientName: allAppointments[0].patientName,
                    estimatedTime: allAppointments[0].estimatedTime
                });
            }
            
            // Filter today's appointments
            const todayAppointments = allAppointments.filter(appointment => {
                // Convert both dates to Date objects for proper comparison
                const appointmentDate = new Date(appointment.appointmentDate);
                const todayDate = new Date(today);
                
                // Set hours to 0 for both dates to compare only the date part
                appointmentDate.setHours(0, 0, 0, 0);
                todayDate.setHours(0, 0, 0, 0);
                
                return appointmentDate.getTime() === todayDate.getTime();
            });
            
            console.log(`After date filtering: Found ${todayAppointments.length} appointments for today (${today})`);
            
            if (todayAppointments.length > 0) {
                console.log("Today's appointments:");
                todayAppointments.forEach(app => {
                    console.log(`ID: ${app.appointmentId}, Patient: ${app.patientName}, Time: ${app.estimatedTime || 'N/A'}`);
                });
            } else {
                console.log("No appointments found for today after filtering");
            }
            
            // Count unique patients
            const patientIds = new Set();
            allAppointments.forEach(appointment => {
                if (appointment.patientId) {
                    patientIds.add(appointment.patientId);
                }
            });
            const totalPatients = patientIds.size;
            
            // Get pending test results count for the last 7 days
            const pendingTestResults = await TestResult.countCompletedByDoctor(doctorId, 7);
            
            // Get appointments for schedule view
            const schedule = [];
            for (const appointment of todayAppointments) {
                // Add room information if missing
                if (appointment.roomId && !appointment.roomNumber) {
                    try {
                        const room = await Room.findById(appointment.roomId);
                        if (room && room.roomNumber) {
                            appointment.roomNumber = room.roomNumber;
                        }
                    } catch (error) {
                        console.error(`Error fetching room for appointment ${appointment.appointmentId}:`, error);
                    }
                }
                schedule.push(appointment);
            }
            
            // Process appointment status counts
            const appointmentCounts = this.processAppointmentCounts(todayAppointments);
            
            // Format the schedule items
            const formattedSchedule = this.formatScheduleItems(schedule);
            
            // Format calendar events with all appointments
            const calendarEvents = this.formatCalendarEvents(allAppointments);
            
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
            // Return a default object with empty data to avoid application crash
            return {
                totalPatients: 0,
                appointments: {
                    total: 0,
                    completed: 0,
                    examining: 0,
                    waiting: 0
                },
                pendingTestResults: 0,
                todaySchedule: [],
                calendarEvents: [],
                todayFormatted: moment().format('dddd, MMMM D, YYYY')
            };
        }
    }

    /**
     * Get doctor's profile information
     * @param {number} doctorId - The doctor's ID
     * @returns {Object} Doctor profile data
     */
    static async getDoctorProfile(doctorId) {
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
            return null;
        }
    }

    /**
     * Process appointment counts by status
     * @param {Array} appointments - List of appointments
     * @returns {Object} Count by status
     */
    static processAppointmentCounts(appointments) {
        const counts = {
            total: appointments.length,
            completed: 0,
            examining: 0,
            waiting: 0
        };
        
        // Count today's appointments by status
        appointments.forEach(appointment => {
            if (appointment.patientAppointmentStatus === 'examined') {
                counts.completed++;
            } else if (appointment.patientAppointmentStatus === 'examining') {
                counts.examining++;
            } else if (appointment.patientAppointmentStatus === 'waiting') {
                counts.waiting++;
            }
        });
        
        return counts;
    }

    /**
     * Format schedule items for display
     * @param {Array} schedule - List of appointments
     * @returns {Array} Formatted schedule items
     */
    static formatScheduleItems(schedule) {
        return schedule.map(appointment => {
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
            
            // Ensure we have room information
            const roomInfo = appointment.roomNumber || 'Not assigned';
            
            return {
                ...appointment,
                timeFormatted,
                statusClass,
                dateFormatted: moment(appointment.appointmentDate).format('MMM D, YYYY'),
                patientAppointmentStatus: appointment.patientAppointmentStatus,
                roomNumber: roomInfo,
                roomId: appointment.roomId || 'None',
                hasRoomNumber: !!appointment.roomNumber
            };
        });
    }

    /**
     * Format calendar events for display
     * @param {Array} appointments - List of appointments
     * @returns {Array} Formatted calendar events
     */
    static formatCalendarEvents(appointments) {
        return appointments.map(appointment => {
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
    }
}

export default DoctorDashboard; 