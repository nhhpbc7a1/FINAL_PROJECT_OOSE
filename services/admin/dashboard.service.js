import db from '../../ultis/db.js';

export default {
    async getDashboardStats() {
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
    },

    async getAppointmentChartData(months = 6) {
        try {
            const startDate = new Date();
            startDate.setMonth(startDate.getMonth() - months);

            const appointments = await db('Appointment')
                .where('appointmentDate', '>=', startDate.toISOString().split('T')[0])
                .select(
                    db.raw("DATE_FORMAT(appointmentDate, '%Y-%m') as month"),
                    db.raw('COUNT(CASE WHEN status = "completed" THEN 1 END) as completed'),
                    db.raw('COUNT(CASE WHEN status = "cancelled" THEN 1 END) as cancelled')
                )
                .groupBy('month')
                .orderBy('month');

            // Format data for chart
            const labels = appointments.map(a => {
                const [year, month] = a.month.split('-');
                return new Date(year, month - 1).toLocaleString('default', { month: 'short' });
            });
            const completed = appointments.map(a => a.completed);
            const cancelled = appointments.map(a => a.cancelled);

            return {
                labels,
                completed,
                cancelled
            };
        } catch (error) {
            console.error('Error fetching appointment chart data:', error);
            throw new Error('Unable to load appointment chart data');
        }
    },

    async getSpecialtyDistribution() {
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
    },

    async getActiveDoctors() {
        try {
            const doctors = await db('Doctor')
                .join('User', 'Doctor.userId', '=', 'User.userId')
                .join('Specialty', 'Doctor.specialtyId', '=', 'Specialty.specialtyId')
                .leftJoin('Appointment', function() {
                    this.on('Doctor.doctorId', '=', 'Appointment.doctorId')
                        .andOn('Appointment.appointmentDate', '>=', db.raw('DATE_FORMAT(NOW(), "%Y-%m-01")'))
                        .andOn('Appointment.status', '=', db.raw('"completed"'));
                })
                .select(
                    'Doctor.doctorId',
                    'User.fullName',
                    'Specialty.name as specialtyName',
                    db.raw('COUNT(DISTINCT Appointment.appointmentId) as appointmentCount'),
                )
                .where('User.accountStatus', '=', 'active')
                .groupBy('Doctor.doctorId', 'User.fullName', 'Specialty.name')
                .orderBy('appointmentCount', 'desc')
                .limit(5);

            console.log('Active Doctors Data:', doctors);
            return doctors;
        } catch (error) {
            console.error('Error fetching active doctors:', error);
            throw new Error('Unable to load active doctors data');
        }
    },

    async getPopularServices() {
        try {
            const services = await db('AppointmentServices')
                .join('Service', 'AppointmentServices.serviceId', '=', 'Service.serviceId')
                .join('Specialty', 'Service.specialtyId', '=', 'Specialty.specialtyId')
                .join('Appointment', 'AppointmentServices.appointmentId', '=', 'Appointment.appointmentId')
                .where('Appointment.appointmentDate', '>=', db.raw('DATE_FORMAT(NOW(), "%Y-%m-01")'))
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

            console.log('Popular Services Data:', services);
            return services;
        } catch (error) {
            console.error('Error fetching popular services:', error);
            throw new Error('Unable to load popular services data');
        }
    }
}; 