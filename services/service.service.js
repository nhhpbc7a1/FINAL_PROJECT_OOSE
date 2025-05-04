import db from '../ultis/db.js';

export default {
    async findAll() {
        try {
            return await db('Service')
                .select('*')
                .orderBy('name');
        } catch (error) {
            console.error('Error fetching services:', error);
            throw new Error('Unable to load services');
        }
    },

    async findById(serviceId) {
        try {
            const service = await db('Service')
                .where('serviceId', serviceId)
                .first();
            return service || null;
        } catch (error) {
            console.error(`Error fetching service with ID ${serviceId}:`, error);
            throw new Error('Unable to find service');
        }
    },

    async findByType(type) {
        try {
            return await db('Service')
                .where('type', type)
                .orderBy('name');
        } catch (error) {
            console.error(`Error fetching services of type ${type}:`, error);
            throw new Error('Unable to find services by type');
        }
    },

    async findBySpecialty(specialtyId) {
        try {
            return await db('Service')
                .where('specialtyId', specialtyId)
                .orderBy('name');
        } catch (error) {
            console.error(`Error fetching services for specialty ID ${specialtyId}:`, error);
            throw new Error('Unable to find services by specialty');
        }
    },

    async searchByName(query) {
        try {
            return await db('Service')
                .where('name', 'like', `%${query}%`)
                .orderBy('name');
        } catch (error) {
            console.error(`Error searching for services with query '${query}':`, error);
            throw new Error('Unable to search services');
        }
    },

    async findByAppointment(appointmentId) {
        try {
            return await db('AppointmentServices')
                .join('Service', 'AppointmentServices.serviceId', '=', 'Service.serviceId')
                .select(
                    'Service.*',
                    'AppointmentServices.price as appliedPrice',
                    'AppointmentServices.appointmentServiceId'
                )
                .where('AppointmentServices.appointmentId', appointmentId)
                .orderBy('Service.name');
        } catch (error) {
            console.error(`Error fetching services for appointment ID ${appointmentId}:`, error);
            throw new Error('Unable to find services by appointment');
        }
    },

    async add(service) {
        try {
            const [serviceId] = await db('Service').insert(service);
            return serviceId;
        } catch (error) {
            console.error('Error adding service:', error);
            throw new Error('Unable to add service');
        }
    },

    async update(serviceId, service) {
        try {
            const result = await db('Service')
                .where('serviceId', serviceId)
                .update(service);
            return result > 0;
        } catch (error) {
            console.error(`Error updating service with ID ${serviceId}:`, error);
            throw new Error('Unable to update service');
        }
    },

    async delete(serviceId) {
        try {
            // Check if service is used in any appointment
            const usedInAppointment = await db('AppointmentServices')
                .where('serviceId', serviceId)
                .first();
            
            if (usedInAppointment) {
                throw new Error('Cannot delete service that is used in appointments');
            }
            
            // Check if service is used in any test result
            const usedInTestResult = await db('TestResult')
                .where('serviceId', serviceId)
                .first();
            
            if (usedInTestResult) {
                throw new Error('Cannot delete service that is used in test results');
            }
            
            const result = await db('Service')
                .where('serviceId', serviceId)
                .delete();
            return result > 0;
        } catch (error) {
            console.error(`Error deleting service with ID ${serviceId}:`, error);
            throw error; // Throw the specific error to handle in controller
        }
    },

    async countByType() {
        try {
            return await db('Service')
                .select('type')
                .count('serviceId as count')
                .groupBy('type');
        } catch (error) {
            console.error('Error counting services by type:', error);
            throw new Error('Unable to count services by type');
        }
    },

    async countBySpecialty() {
        try {
            return await db('Service')
                .leftJoin('Specialty', 'Service.specialtyId', '=', 'Specialty.specialtyId')
                .select('Specialty.name as specialtyName')
                .count('Service.serviceId as count')
                .groupBy('Service.specialtyId', 'Specialty.name')
                .orderBy('count', 'desc');
        } catch (error) {
            console.error('Error counting services by specialty:', error);
            throw new Error('Unable to count services by specialty');
        }
    },

    async getMostRequestedServices(limit = 10) {
        try {
            return await db('AppointmentServices')
                .join('Service', 'AppointmentServices.serviceId', '=', 'Service.serviceId')
                .select('Service.serviceId', 'Service.name', 'Service.type')
                .count('AppointmentServices.appointmentServiceId as requestCount')
                .groupBy('Service.serviceId', 'Service.name', 'Service.type')
                .orderBy('requestCount', 'desc')
                .limit(limit);
        } catch (error) {
            console.error(`Error fetching most requested services (limit: ${limit}):`, error);
            throw new Error('Unable to get most requested services');
        }
    },

    // Methods for appointment services
    async addServiceToAppointment(appointmentService) {
        try {
            // If price is not provided, use default service price
            if (!appointmentService.price && appointmentService.serviceId) {
                const service = await this.findById(appointmentService.serviceId);
                if (service) {
                    appointmentService.price = service.price;
                }
            }
            
            const [appointmentServiceId] = await db('AppointmentServices').insert(appointmentService);
            return appointmentServiceId;
        } catch (error) {
            console.error('Error adding service to appointment:', error);
            throw new Error('Unable to add service to appointment');
        }
    },

    async removeServiceFromAppointment(appointmentServiceId) {
        try {
            const result = await db('AppointmentServices')
                .where('appointmentServiceId', appointmentServiceId)
                .delete();
            return result > 0;
        } catch (error) {
            console.error(`Error removing appointment service with ID ${appointmentServiceId}:`, error);
            throw new Error('Unable to remove service from appointment');
        }
    },

    async updateAppointmentService(appointmentServiceId, data) {
        try {
            const result = await db('AppointmentServices')
                .where('appointmentServiceId', appointmentServiceId)
                .update(data);
            return result > 0;
        } catch (error) {
            console.error(`Error updating appointment service with ID ${appointmentServiceId}:`, error);
            throw new Error('Unable to update appointment service');
        }
    },

    async getTotalServiceCost(appointmentId) {
        try {
            const result = await db('AppointmentServices')
                .where('appointmentId', appointmentId)
                .sum('price as totalCost')
                .first();
            return result.totalCost || 0;
        } catch (error) {
            console.error(`Error calculating total service cost for appointment ID ${appointmentId}:`, error);
            throw new Error('Unable to calculate total service cost');
        }
    }
}; 