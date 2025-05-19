import AdminDashboardDAO from '../dao/AdminDashboardDAO.js';

/**
 * AdminDashboard Model Class
 * Represents admin dashboard data and statistics
 */
class AdminDashboard {
    /**
     * Create a new AdminDashboard instance
     * @param {Object} dashboardData - Dashboard data
     */
    constructor(dashboardData = {}) {
        this.todayAppointments = dashboardData.todayAppointments || 0;
        this.appointmentTrend = dashboardData.appointmentTrend || 0;
        this.appointmentTrendIcon = dashboardData.appointmentTrendIcon || 'up';
        this.appointmentPercentage = dashboardData.appointmentPercentage || 0;
        this.newPatients = dashboardData.newPatients || 0;
        this.patientTrend = dashboardData.patientTrend || 0;
        this.patientTrendIcon = dashboardData.patientTrendIcon || 'up';
        this.patientPercentage = dashboardData.patientPercentage || 0;
        this.doctorSchedules = dashboardData.doctorSchedules || 0;
        this.monthlyRevenue = dashboardData.monthlyRevenue || 0;
        this.revenueTrend = dashboardData.revenueTrend || 0;
        this.revenueTrendIcon = dashboardData.revenueTrendIcon || 'up';
        this.revenuePercentage = dashboardData.revenuePercentage || 0;
    }

    /**
     * Get dashboard statistics
     * @returns {Promise<AdminDashboard>} Dashboard statistics
     */
    static async getDashboardStats() {
        const dashboardData = await AdminDashboardDAO.getDashboardStats();
        return new AdminDashboard(dashboardData);
    }

    /**
     * Get appointment chart data
     * @param {number} months - Number of months to include
     * @returns {Promise<Object>} Chart data object
     */
    static async getAppointmentChartData(months = 6) {
        return await AdminDashboardDAO.getAppointmentChartData(months);
    }

    /**
     * Get specialty distribution data
     * @returns {Promise<Object>} Specialty distribution data
     */
    static async getSpecialtyDistribution() {
        return await AdminDashboardDAO.getSpecialtyDistribution();
    }

    /**
     * Get active doctors data
     * @returns {Promise<Array>} Array of active doctors
     */
    static async getActiveDoctors() {
        return await AdminDashboardDAO.getActiveDoctors();
    }

    /**
     * Get popular services data
     * @returns {Promise<Array>} Array of popular services
     */
    static async getPopularServices() {
        return await AdminDashboardDAO.getPopularServices();
    }
}

export default AdminDashboard; 