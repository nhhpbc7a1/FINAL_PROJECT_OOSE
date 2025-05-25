import db from '../ultis/db.js';

/**
 * Data Access Object for AppointmentServices table
 */
class AppointmentServiceDAO {
    /**
     * Add a new appointment service record
     * @param {Object} data - The appointment service data
     * @returns {Promise<number>} The ID of the newly created record
     */
    static async add(data) {
        try {
            const [id] = await db('AppointmentServices').insert({
                appointmentId: data.appointmentId,
                serviceId: data.serviceId,
                price: data.price,
                status: data.status || 'pending'
            });
            
            return id;
        } catch (error) {
            console.error('Error adding appointment service:', error);
            throw new Error('Failed to add appointment service: ' + error.message);
        }
    }

    /**
     * Update an existing appointment service record
     * @param {number} id - The ID of the record to update
     * @param {Object} data - The updated data
     * @returns {Promise<boolean>} True if update was successful
     */
    static async update(id, data) {
        try {
            await db('AppointmentServices')
                .where('id', id)
                .update({
                    appointmentId: data.appointmentId,
                    serviceId: data.serviceId,
                    price: data.price,
                    status: data.status
                });
                
            return true;
        } catch (error) {
            console.error('Error updating appointment service:', error);
            throw new Error('Failed to update appointment service: ' + error.message);
        }
    }

    /**
     * Delete an appointment service record
     * @param {number} id - The ID of the record to delete
     * @returns {Promise<boolean>} True if deletion was successful
     */
    static async delete(id) {
        try {
            await db('AppointmentServices')
                .where('id', id)
                .delete();
                
            return true;
        } catch (error) {
            console.error('Error deleting appointment service:', error);
            throw new Error('Failed to delete appointment service: ' + error.message);
        }
    }

    /**
     * Find all services for an appointment
     * @param {number} appointmentId - The appointment ID
     * @returns {Promise<Object[]>} List of appointment services with service details
     */
    static async findByAppointmentId(appointmentId) {
        try {
            return await db('AppointmentServices')
                .select(
                    'AppointmentServices.*',
                    'Service.name as serviceName',
                    'Service.description as serviceDescription',
                    'Service.type as serviceType'
                )
                .leftJoin('Service', 'AppointmentServices.serviceId', 'Service.serviceId')
                .where('AppointmentServices.appointmentId', appointmentId);
        } catch (error) {
            console.error('Error finding services for appointment:', error);
            throw new Error('Failed to find appointment services: ' + error.message);
        }
    }

    /**
     * Find all appointments for a service
     * @param {number} serviceId - The service ID
     * @returns {Promise<Object[]>} List of appointments with service
     */
    static async findByServiceId(serviceId) {
        try {
            return await db('AppointmentServices')
                .select(
                    'AppointmentServices.*',
                    'Appointment.appointmentDate',
                    'Appointment.appointmentTime',
                    'Appointment.status as appointmentStatus'
                )
                .leftJoin('Appointment', 'AppointmentServices.appointmentId', 'Appointment.appointmentId')
                .where('AppointmentServices.serviceId', serviceId);
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
            const result = await db('AppointmentServices')
                .sum('price as total')
                .where('appointmentId', appointmentId)
                .first();
                
            return result ? result.total || 0 : 0;
        } catch (error) {
            console.error('Error calculating total price:', error);
            throw new Error('Failed to calculate total price: ' + error.message);
        }
    }

    /**
     * Delete all services for an appointment
     * @param {number} appointmentId - The appointment ID
     * @returns {Promise<number>} Number of deleted records
     */
    static async deleteByAppointmentId(appointmentId) {
        try {
            return await db('AppointmentServices')
                .where('appointmentId', appointmentId)
                .delete();
        } catch (error) {
            console.error('Error deleting appointment services:', error);
            throw new Error('Failed to delete appointment services: ' + error.message);
        }
    }
}

export default AppointmentServiceDAO; 