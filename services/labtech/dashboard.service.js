import db from '../../ultis/db.js';
import moment from 'moment';

export default {
    /**
     * Get dashboard statistics for a lab technician
     * @param {number} technicianId - The ID of the lab technician
     * @returns {Object} Dashboard statistics
     */
    async getDashboardStats(technicianId) {
        try {
            // Lấy thông tin về lab technician để biết chuyên khoa
            const labTechnician = await db('LabTechnician')
                .select('specialtyId')
                .where('technicianId', technicianId)
                .first();
                
            if (!labTechnician) {
                throw new Error('Lab technician not found');
            }

            const specialtyId = labTechnician.specialtyId;

            // Get counts for different test statuses
            const pendingCount = await db('TestRequest')
                .count('TestRequest.requestId as count')
                .join('Service', 'TestRequest.serviceId', 'Service.serviceId')
                .where('TestRequest.status', 'pending')
                .where('Service.specialtyId', specialtyId)
                .first();
                
            const inProgressCount = await db('TestResult')
                .count('TestResult.resultId as count')
                .join('TestRequest', 'TestResult.requestId', 'TestRequest.requestId')
                .join('Service', 'TestRequest.serviceId', 'Service.serviceId')
                .where('TestResult.status', 'in_progress')
                .where(function() {
                    this.where('TestResult.technicianId', technicianId)
                        .orWhere('Service.specialtyId', specialtyId);
                })
                .first();
                
            const completedCount = await db('TestResult')
                .count('TestResult.resultId as count')
                .join('TestRequest', 'TestResult.requestId', 'TestRequest.requestId')
                .join('Service', 'TestRequest.serviceId', 'Service.serviceId')
                .where('TestResult.status', 'completed')
                .where(function() {
                    this.where('TestResult.technicianId', technicianId)
                        .orWhere('Service.specialtyId', specialtyId);
                })
                .whereRaw('MONTH(TestResult.reportedDate) = MONTH(CURRENT_DATE())')
                .whereRaw('YEAR(TestResult.reportedDate) = YEAR(CURRENT_DATE())')
                .first();
                
            const totalCount = await db('TestResult')
                .count('TestResult.resultId as count')
                .join('TestRequest', 'TestResult.requestId', 'TestRequest.requestId')
                .join('Service', 'TestRequest.serviceId', 'Service.serviceId')
                .where(function() {
                    this.where('TestResult.technicianId', technicianId)
                        .orWhere('Service.specialtyId', specialtyId);
                })
                .first();
            
            return {
                pendingCount: pendingCount ? pendingCount.count : 0,
                inProgressCount: inProgressCount ? inProgressCount.count : 0,
                completedCount: completedCount ? completedCount.count : 0,
                totalCount: totalCount ? totalCount.count : 0
            };
        } catch (error) {
            console.error('Error getting dashboard stats:', error);
            throw new Error('Failed to load dashboard statistics');
        }
    },
    
    /**
     * Get recent test requests for a lab technician
     * @param {number} technicianId - The ID of the lab technician
     * @param {number} specialtyId - The specialty ID of the lab technician
     * @param {number} limit - Maximum number of results to return
     * @returns {Array} List of recent test requests
     */
    async getRecentRequests(technicianId, specialtyId, limit = 10) {
        try {
            // Get recent test requests for this lab technician's specialty
            const recentRequests = await db('TestRequest')
                .select(
                    'TestRequest.requestId',
                    'TestRequest.requestDate',
                    'TestRequest.status',
                    'TestRequest.notes',
                    'Service.name as testName',
                    'Doctor.doctorId',
                    'DoctorUser.fullName as doctorName',
                    'Patient.patientId',
                    'PatientUser.fullName as patientName',
                    'Appointment.appointmentId'
                )
                .join('Service', 'TestRequest.serviceId', 'Service.serviceId')
                .join('Doctor', 'TestRequest.requestedByDoctorId', 'Doctor.doctorId')
                .join('User as DoctorUser', 'Doctor.userId', 'DoctorUser.userId')
                .join('Appointment', 'TestRequest.appointmentId', 'Appointment.appointmentId')
                .join('Patient', 'Appointment.patientId', 'Patient.patientId')
                .join('User as PatientUser', 'Patient.userId', 'PatientUser.userId')
                .join('Specialty', 'Service.specialtyId', 'Specialty.specialtyId')
                .where(function() {
                    if (specialtyId) {
                        this.where('Specialty.specialtyId', specialtyId)
                    }
                })
                .orderBy('TestRequest.requestDate', 'desc')
                .limit(limit);
            
            // Format the data for display
            const formattedRequests = recentRequests.map(request => {
                // Map status to a CSS class for styling
                let statusClass = 'pending';
                switch (request.status) {
                    case 'completed':
                        statusClass = 'completed';
                        break;
                    case 'in_progress':
                        statusClass = 'in-progress';
                        break;
                    case 'cancelled':
                        statusClass = 'cancelled';
                        break;
                    default:
                        statusClass = 'pending';
                }
                
                return {
                    ...request,
                    statusClass
                };
            });
            
            return formattedRequests;
        } catch (error) {
            console.error('Error getting recent test requests:', error);
            throw new Error('Failed to load recent test requests');
        }
    },
    
    /**
     * Get schedule data for a lab technician
     * @param {number} technicianId - The ID of the lab technician
     * @param {Date} date - Date to get schedule for
     * @returns {Array} Schedule data in calendar format
     */
    async getScheduleData(technicianId, date) {
        try {
            // Lấy thông tin về lab technician để biết chuyên khoa
            const labTechnician = await db('LabTechnician')
                .select('specialtyId')
                .where('technicianId', technicianId)
                .first();
                
            if (!labTechnician) {
                throw new Error('Lab technician not found');
            }

            const specialtyId = labTechnician.specialtyId;

            // Convert to moment object if not already
            const momentDate = moment(date);
            const year = momentDate.year();
            const month = momentDate.month();
            
            // Get first and last day of the month
            const startOfMonth = moment([year, month, 1]).format('YYYY-MM-DD');
            const endOfMonth = moment([year, month, 1]).endOf('month').format('YYYY-MM-DD');
                    
            // Thêm các lịch làm việc từ bảng Schedule
            const workSchedules = await db('Schedule')
                .select(
                    'Schedule.scheduleId',
                    'Schedule.workDate',
                    'Schedule.startTime',
                    'Schedule.endTime',
                    'Schedule.status',
                    'Room.roomNumber'
                )
                .leftJoin('Room', 'Schedule.roomId', 'Room.roomId')
                .where('Schedule.labTechnicianId', technicianId)
                .whereBetween('Schedule.workDate', [startOfMonth, endOfMonth]);

            // Format for calendar view
            const calendarData = [
                // Format work schedules for calendar
                ...workSchedules.map(schedule => {
                    const scheduleDate = moment(schedule.workDate).format('YYYY-MM-DD');
                    const startTime = moment(schedule.startTime, 'HH:mm:ss').format('HH:mm');
                    const endTime = moment(schedule.endTime, 'HH:mm:ss').format('HH:mm');
                    
                    return {
                        date: scheduleDate,
                        time: `${startTime}-${endTime}`,
                        title: `(Room ${schedule.roomNumber || 'TBD'})`,
                        status: schedule.status === 'available' ? 'pending' : 'completed',
                        id: schedule.scheduleId,
                        type: 'shift'
                    };
                })
            ];
            
            return calendarData;
        } catch (error) {
            console.error('Error getting schedule data:', error);
            throw new Error('Failed to load schedule data');
        }
    }
}; 