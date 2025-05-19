import db from '../ultis/db.js';

/**
 * Data Access Object for AdminDashboard-related database operations
 */
class AdminDashboardDAO {
    /**
     * Get dashboard statistics
     * @returns {Promise<Object>} Dashboard statistics
     */
    static async getDashboardStats() {
        try {
            // Get today's appointments count
            const todayAppointments = await db('Appointment')
                .where('appointmentDate', new Date().toISOString().split('T')[0])
                .count('* as count')
                .first();

            // Get last week's appointments count for comparison
            const lastWeekAppointments = await db('Appointment')
                .where('appointmentDate', '<', new Date().toISOString().split('T')[0])
                .where('appointmentDate', '>=', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
                .count('* as count')
                .first();

            // Calculate appointment trend
            const appointmentTrend = lastWeekAppointments.count > 0 
                ? ((todayAppointments.count - lastWeekAppointments.count) / lastWeekAppointments.count) * 100 
                : 0;

            // Get new patients this month by joining with User table
            const newPatients = await db('Patient')
                .join('User', 'Patient.userId', '=', 'User.userId')
                .where('User.createdDate', '>=', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString())
                .count('Patient.patientId as count')
                .first();

            // Get last month's new patients for comparison
            const lastMonthPatients = await db('Patient')
                .join('User', 'Patient.userId', '=', 'User.userId')
                .where('User.createdDate', '>=', new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1).toISOString())
                .where('User.createdDate', '<', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString())
                .count('Patient.patientId as count')
                .first();

            // Calculate patient trend
            const patientTrend = lastMonthPatients.count > 0 
                ? ((newPatients.count - lastMonthPatients.count) / lastMonthPatients.count) * 100 
                : 0;

            // Get doctor schedules for this week
            const doctorSchedules = await db('Schedule')
                .where('workDate', '>=', new Date().toISOString().split('T')[0])
                .where('workDate', '<=', new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
                .count('* as count')
                .first();

            // Get monthly revenue
            const monthlyRevenue = await db('AppointmentServices')
                .join('Appointment', 'AppointmentServices.appointmentId', '=', 'Appointment.appointmentId')
                .where('Appointment.appointmentDate', '>=', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString())
                .sum('AppointmentServices.price as total')
                .first();

            // Get last month's revenue for comparison
            const lastMonthRevenue = await db('AppointmentServices')
                .join('Appointment', 'AppointmentServices.appointmentId', '=', 'Appointment.appointmentId')
                .where('Appointment.appointmentDate', '>=', new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1).toISOString())
                .where('Appointment.appointmentDate', '<', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString())
                .sum('AppointmentServices.price as total')
                .first();

            // Calculate revenue trend
            const revenueTrend = lastMonthRevenue.total > 0 
                ? ((monthlyRevenue.total - lastMonthRevenue.total) / lastMonthRevenue.total) * 100 
                : 0;

            return {
                todayAppointments: todayAppointments.count,
                appointmentTrend,
                appointmentTrendIcon: appointmentTrend >= 0 ? 'up' : 'down',
                appointmentPercentage: Math.abs(Math.round(appointmentTrend)),
                newPatients: newPatients.count,
                patientTrend,
                patientTrendIcon: patientTrend >= 0 ? 'up' : 'down',
                patientPercentage: Math.abs(Math.round(patientTrend)),
                doctorSchedules: doctorSchedules.count,
                monthlyRevenue: Math.round(monthlyRevenue.total / 1000), // Convert to thousands
                revenueTrend,
                revenueTrendIcon: revenueTrend >= 0 ? 'up' : 'down',
                revenuePercentage: Math.abs(Math.round(revenueTrend))
            };
        } catch (error) {
            console.error('Error fetching dashboard stats:', error);
            throw new Error('Unable to load dashboard statistics');
        }
    }

    /**
     * Get appointment chart data
     * @param {number} months - Number of months to include
     * @returns {Promise<Object>} Chart data object
     */
    static async getAppointmentChartData(months = 6) {
        try {
            const startDate = new Date();
            startDate.setMonth(startDate.getMonth() - months);

            // Use a single raw query to avoid alias issues
            const result = await db.raw(`
                SELECT 
                    DATE_FORMAT(appointmentDate, '%Y-%m') as month,
                    COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
                    COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled
                FROM Appointment
                WHERE appointmentDate >= ?
                GROUP BY DATE_FORMAT(appointmentDate, '%Y-%m')
                ORDER BY month
            `, [startDate.toISOString().split('T')[0]]);
            
            // Extract rows from the raw query result (first element of the result array)
            const appointments = result[0];
            
            // If we don't have any data, return empty chart data
            if (!appointments || appointments.length === 0) {
                return {
                    labels: [],
                    completed: [],
                    cancelled: []
                };
            }

            // Format data for chart
            const labels = appointments.map(a => {
                if (!a.month) return '';
                const [year, month] = a.month.split('-');
                return new Date(year, month - 1).toLocaleString('default', { month: 'short' });
            });
            const completed = appointments.map(a => a.completed || 0);
            const cancelled = appointments.map(a => a.cancelled || 0);

            return {
                labels,
                completed,
                cancelled
            };
        } catch (error) {
            console.error('Error fetching appointment chart data:', error);
            console.error('Error details:', error.stack);
            throw new Error('Unable to load appointment chart data');
        }
    }

    /**
     * Get specialty distribution data
     * @returns {Promise<Object>} Specialty distribution data
     */
    static async getSpecialtyDistribution() {
        try {
            const specialties = await db('Appointment')
                .join('Specialty', 'Appointment.specialtyId', '=', 'Specialty.specialtyId')
                .where('Appointment.appointmentDate', '>=', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString())
                .select(
                    'Specialty.name',
                    db.raw('COUNT(*) as count')
                )
                .groupBy('Specialty.specialtyId', 'Specialty.name')
                .orderBy('count', 'desc');

            return {
                labels: specialties.map(s => s.name),
                data: specialties.map(s => s.count)
            };
        } catch (error) {
            console.error('Error fetching specialty distribution:', error);
            throw new Error('Unable to load specialty distribution data');
        }
    }

    /**
     * Get active doctors data
     * @returns {Promise<Array>} Array of active doctors
     */
    static async getActiveDoctors() {
        try {
            // Use raw SQL query to avoid quoting issues
            const result = await db.raw(`
                SELECT 
                    Doctor.doctorId,
                    User.fullName,
                    Specialty.name as specialtyName,
                    COUNT(DISTINCT Appointment.appointmentId) as appointmentCount
                FROM 
                    Doctor
                INNER JOIN 
                    User ON Doctor.userId = User.userId
                INNER JOIN 
                    Specialty ON Doctor.specialtyId = Specialty.specialtyId
                LEFT JOIN 
                    Appointment ON Doctor.doctorId = Appointment.doctorId
                    AND Appointment.appointmentDate >= DATE_FORMAT(NOW(), '%Y-%m-01')
                    AND Appointment.status = 'completed'
                WHERE 
                    User.accountStatus = 'active'
                GROUP BY 
                    Doctor.doctorId, User.fullName, Specialty.name
                ORDER BY 
                    appointmentCount DESC
                LIMIT 5
            `);
            
            return result[0];
        } catch (error) {
            console.error('Error fetching active doctors:', error);
            console.error('Error details:', error.stack);
            throw new Error('Unable to load active doctors data');
        }
    }

    /**
     * Get popular services data
     * @returns {Promise<Array>} Array of popular services
     */
    static async getPopularServices() {
        try {
            const services = await db('AppointmentServices')
                .join('Service', 'AppointmentServices.serviceId', '=', 'Service.serviceId')
                .join('Specialty', 'Service.specialtyId', '=', 'Specialty.specialtyId')
                .join('Appointment', 'AppointmentServices.appointmentId', '=', 'Appointment.appointmentId')
                .where('Appointment.appointmentDate', '>=', db.raw("DATE_FORMAT(NOW(), '%Y-%m-01')"))
                .where('Appointment.status', '=', 'completed')
                .select(
                    'Service.name as serviceName',
                    'Specialty.name as specialtyName',
                    db.raw('COUNT(*) as performedCount'),
                    db.raw('SUM(AppointmentServices.price) as totalRevenue')
                )
                .groupBy('Service.serviceId', 'Service.name', 'Specialty.name')
                .orderBy('performedCount', 'desc')
                .limit(5);

            return services;
        } catch (error) {
            console.error('Error fetching popular services:', error);
            throw new Error('Unable to load popular services data');
        }
    }
}

export default AdminDashboardDAO; 