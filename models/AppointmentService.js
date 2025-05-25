import AppointmentServiceDAO from '../dao/AppointmentServiceDAO.js';

/**
 * AppointmentService model representing a link between an appointment and a service
 */
class AppointmentService {
    /**
     * Create a new AppointmentService instance
     * @param {Object} data - The appointment service data
     */
    constructor(data = {}) {
        this.id = data.id || null;
        this.appointmentId = data.appointmentId;
        this.serviceId = data.serviceId;
        this.price = data.price || 0;
        this.status = data.status || 'pending'; // pending, completed, cancelled
        
        // Joined data
        this.serviceName = data.serviceName;
        this.serviceDescription = data.serviceDescription;
        this.serviceType = data.serviceType;
    }

    /**
     * Save the appointment service (create or update)
     * @returns {Promise<AppointmentService>} The saved appointment service
     */
    async save() {
        try {
            const data = {
                appointmentId: this.appointmentId,
                serviceId: this.serviceId,
                price: this.price,
                status: this.status
            };
            
            if (this.id) {
                // Update existing record
                await AppointmentServiceDAO.update(this.id, data);
            } else {
                // Create new record
                this.id = await AppointmentServiceDAO.add(data);
            }
            
            return this;
        } catch (error) {
            console.error('Error saving appointment service:', error);
            throw new Error('Failed to save appointment service: ' + error.message);
        }
    }

    /**
     * Delete the appointment service
     * @returns {Promise<boolean>} True if deleted successfully
     */
    async delete() {
        try {
            if (!this.id) {
                throw new Error('Cannot delete unsaved appointment service');
            }
            await AppointmentServiceDAO.delete(this.id);
            return true;
        } catch (error) {
            console.error('Error deleting appointment service:', error);
            throw new Error('Failed to delete appointment service: ' + error.message);
        }
    }

    /**
     * Find all services for an appointment
     * @param {number} appointmentId - The appointment ID
     * @returns {Promise<AppointmentService[]>} List of appointment services
     */
    static async findByAppointmentId(appointmentId) {
        try {
            const services = await AppointmentServiceDAO.findByAppointmentId(appointmentId);
            return services.map(service => new AppointmentService(service));
        } catch (error) {
            console.error('Error finding services for appointment:', error);
            throw new Error('Failed to find appointment services: ' + error.message);
        }
    }

    /**
     * Find all appointments for a service
     * @param {number} serviceId - The service ID
     * @returns {Promise<AppointmentService[]>} List of appointment services
     */
    static async findByServiceId(serviceId) {
        try {
            const appointments = await AppointmentServiceDAO.findByServiceId(serviceId);
            return appointments.map(appointment => new AppointmentService(appointment));
        } catch (error) {
            console.error('Error finding appointments for service:', error);
            throw new Error('Failed to find service appointments: ' + error.message);
        }
    }

    /**
     * Get total price of services for an appointment
     * @param {number} appointmentId - The appointment ID
     * @returns {Promise<number>} Total price
     */
    static async getTotalPrice(appointmentId) {
        try {
            return await AppointmentServiceDAO.getTotalPrice(appointmentId);
        } catch (error) {
            console.error('Error calculating total price:', error);
            throw new Error('Failed to calculate total price: ' + error.message);
        }
    }
}

export default AppointmentService; 