import db from '../ultis/db.js';

export default {
    async findAll() {
        try {
            return await db('AppointmentServices')
                .join('Service', 'AppointmentServices.serviceId', '=', 'Service.serviceId')
                .join('Appointment', 'AppointmentServices.appointmentId', '=', 'Appointment.appointmentId')
                .join('Patient', 'Appointment.patientId', '=', 'Patient.patientId')
                .join('User as PatientUser', 'Patient.userId', '=', 'PatientUser.userId')
                .leftJoin('Doctor', 'Appointment.doctorId', '=', 'Doctor.doctorId')
                .leftJoin('User as DoctorUser', 'Doctor.userId', '=', 'DoctorUser.userId')
                .select(
                    'AppointmentServices.*',
                    'Service.name as serviceName',
                    'Service.type as serviceType',
                    'Appointment.appointmentDate',
                    'Appointment.status as appointmentStatus',
                    'PatientUser.fullName as patientName',
                    'DoctorUser.fullName as doctorName'
                )
                .orderBy('Appointment.appointmentDate', 'desc');
        } catch (error) {
            console.error('Error fetching appointment services:', error);
            throw new Error('Unable to load appointment services');
        }
    },

    async findById(appointmentServiceId) {
        try {
            const service = await db('AppointmentServices')
                .join('Service', 'AppointmentServices.serviceId', '=', 'Service.serviceId')
                .join('Appointment', 'AppointmentServices.appointmentId', '=', 'Appointment.appointmentId')
                .join('Patient', 'Appointment.patientId', '=', 'Patient.patientId')
                .join('User as PatientUser', 'Patient.userId', '=', 'PatientUser.userId')
                .leftJoin('Doctor', 'Appointment.doctorId', '=', 'Doctor.doctorId')
                .leftJoin('User as DoctorUser', 'Doctor.userId', '=', 'DoctorUser.userId')
                .select(
                    'AppointmentServices.*',
                    'Service.name as serviceName',
                    'Service.description as serviceDescription',
                    'Service.type as serviceType',
                    'Appointment.appointmentDate',
                    'Appointment.status as appointmentStatus',
                    'PatientUser.fullName as patientName',
                    'DoctorUser.fullName as doctorName'
                )
                .where('AppointmentServices.appointmentServiceId', appointmentServiceId)
                .first();
            return service || null;
        } catch (error) {
            console.error(`Error fetching appointment service with ID ${appointmentServiceId}:`, error);
            throw new Error('Unable to find appointment service');
        }
    },

    async findByAppointment(appointmentId) {
        try {
            return await db('AppointmentServices')
                .join('Service', 'AppointmentServices.serviceId', '=', 'Service.serviceId')
                .select(
                    'AppointmentServices.*',
                    'Service.name as serviceName',
                    'Service.description as serviceDescription',
                    'Service.type as serviceType'
                )
                .where('AppointmentServices.appointmentId', appointmentId)
                .orderBy('Service.name');
        } catch (error) {
            console.error(`Error fetching services for appointment ID ${appointmentId}:`, error);
            throw new Error('Unable to find services by appointment');
        }
    },

    async findByService(serviceId) {
        try {
            return await db('AppointmentServices')
                .join('Appointment', 'AppointmentServices.appointmentId', '=', 'Appointment.appointmentId')
                .join('Patient', 'Appointment.patientId', '=', 'Patient.patientId')
                .join('User as PatientUser', 'Patient.userId', '=', 'PatientUser.userId')
                .select(
                    'AppointmentServices.*',
                    'Appointment.appointmentDate',
                    'Appointment.status as appointmentStatus',
                    'PatientUser.fullName as patientName'
                )
                .where('AppointmentServices.serviceId', serviceId)
                .orderBy('Appointment.appointmentDate', 'desc');
        } catch (error) {
            console.error(`Error fetching appointments for service ID ${serviceId}:`, error);
            throw new Error('Unable to find appointments by service');
        }
    },

    async add(appointmentService) {
        try {
            // If price is not provided, get default price from service
            if (!appointmentService.price && appointmentService.serviceId) {
                const service = await db('Service')
                    .where('serviceId', appointmentService.serviceId)
                    .first();
                
                if (service) {
                    appointmentService.price = service.price;
                }
            }
            
            const [appointmentServiceId] = await db('AppointmentServices').insert(appointmentService);
            return appointmentServiceId;
        } catch (error) {
            console.error('Error adding appointment service:', error);
            throw new Error('Unable to add appointment service');
        }
    },

    async update(appointmentServiceId, appointmentService) {
        try {
            const result = await db('AppointmentServices')
                .where('appointmentServiceId', appointmentServiceId)
                .update(appointmentService);
            return result > 0;
        } catch (error) {
            console.error(`Error updating appointment service with ID ${appointmentServiceId}:`, error);
            throw new Error('Unable to update appointment service');
        }
    },

    async delete(appointmentServiceId) {
        try {
            const result = await db('AppointmentServices')
                .where('appointmentServiceId', appointmentServiceId)
                .delete();
            return result > 0;
        } catch (error) {
            console.error(`Error deleting appointment service with ID ${appointmentServiceId}:`, error);
            throw new Error('Unable to delete appointment service');
        }
    },

    async addMultipleServices(appointmentId, services) {
        try {
            // Begin transaction
            await db.transaction(async trx => {
                // Prepare service records
                const serviceRecords = await Promise.all(services.map(async serviceId => {
                    // Get service price if available
                    const service = await trx('Service')
                        .where('serviceId', serviceId)
                        .first();
                    
                    return {
                        appointmentId,
                        serviceId,
                        price: service ? service.price : 0
                    };
                }));
                
                // Insert all services
                await trx('AppointmentServices').insert(serviceRecords);
            });
            
            return true;
        } catch (error) {
            console.error(`Error adding multiple services to appointment ID ${appointmentId}:`, error);
            throw new Error('Unable to add services to appointment');
        }
    },

    async removeAllFromAppointment(appointmentId) {
        try {
            const result = await db('AppointmentServices')
                .where('appointmentId', appointmentId)
                .delete();
            return result > 0;
        } catch (error) {
            console.error(`Error removing all services from appointment ID ${appointmentId}:`, error);
            throw new Error('Unable to remove services from appointment');
        }
    },

    async calculateTotalCost(appointmentId) {
        try {
            const result = await db('AppointmentServices')
                .where('appointmentId', appointmentId)
                .sum('price as totalCost')
                .first();
            return result.totalCost || 0;
        } catch (error) {
            console.error(`Error calculating total cost for appointment ID ${appointmentId}:`, error);
            throw new Error('Unable to calculate total cost');
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

    async getServiceRevenueByType() {
        try {
            return await db('AppointmentServices')
                .join('Service', 'AppointmentServices.serviceId', '=', 'Service.serviceId')
                .join('Appointment', 'AppointmentServices.appointmentId', '=', 'Appointment.appointmentId')
                .join('Payment', 'Appointment.appointmentId', '=', 'Payment.appointmentId')
                .select('Service.type as serviceType')
                .sum('AppointmentServices.price as totalRevenue')
                .where('Payment.status', 'completed')
                .groupBy('Service.type')
                .orderBy('totalRevenue', 'desc');
        } catch (error) {
            console.error('Error calculating service revenue by type:', error);
            throw new Error('Unable to calculate service revenue by type');
        }
    }
}; 