import db from '../ultis/db.js';

/**
 * Data Access Object for Service-related database operations
 */
class ServiceDAO {
    /**
     * Get all services
     * @param {boolean} includeInactive - Whether to include inactive services
     * @returns {Promise<Array>} Array of service objects
     */
    static async findAll(includeInactive = false) {
        try {
            const query = db('Service')
                .leftJoin('Specialty', 'Service.specialtyId', '=', 'Specialty.specialtyId')
                .select(
                    'Service.*',
                    'Specialty.name as specialtyName'
                )
                .orderBy('Service.name');

            if (!includeInactive) {
                query.where('Service.status', 'active');
            }

            return await query;
        } catch (error) {
            console.error('Error fetching services:', error);
            throw new Error('Unable to load services');
        }
    }

    /**
     * Get all active services
     * @returns {Promise<Array>} Array of active service objects
     */
    static async getAllActive() {
        try {
            return await db('Service')
                .where('status', 'active')
                .orderBy('name');
        } catch (error) {
            console.error('Error fetching active services:', error);
            throw new Error('Unable to load active services');
        }
    }

    /**
     * Find services by specialty
     * @param {number} specialtyId - Specialty ID to filter by
     * @param {boolean} includeInactive - Whether to include inactive services
     * @returns {Promise<Array>} Array of service objects
     */
    static async findBySpecialty(specialtyId, includeInactive = false) {
        try {
            const query = db('Service')
                .where('specialtyId', specialtyId)
                .orderBy('name');

            if (!includeInactive) {
                query.where('status', 'active');
            }

            return await query;
        } catch (error) {
            console.error(`Error fetching services for specialty ID ${specialtyId}:`, error);
            throw new Error('Unable to load services for this specialty');
        }
    }

    /**
     * Find a service by ID
     * @param {number} serviceId - Service ID to find
     * @returns {Promise<Object|null>} Service object or null
     */
    static async findById(serviceId) {
        try {
            const service = await db('Service')
                .leftJoin('Specialty', 'Service.specialtyId', '=', 'Specialty.specialtyId')
                .select(
                    'Service.*',
                    'Specialty.name as specialtyName'
                )
                .where('serviceId', serviceId)
                .first();
            
            if (service && service.image) {
                // Ensure image path is properly formatted
                if (!service.image.startsWith('http') && !service.image.startsWith('/')) {
                    service.image = '/' + service.image;
                }
            }
            
            return service || null;
        } catch (error) {
            console.error(`Error fetching service with ID ${serviceId}:`, error);
            throw new Error('Unable to find service');
        }
    }

    /**
     * Check if a service name is unique
     * @param {string} name - Name to check
     * @param {number|null} excludeId - ID to exclude from check (for updates)
     * @returns {Promise<boolean>} True if name is unique
     */
    static async isNameUnique(name, excludeId = null) {
        try {
            // Case-insensitive check might be useful here depending on requirements
            const query = db('Service').whereRaw('LOWER(name) = LOWER(?)', [name]);
            if (excludeId) {
                query.andWhereNot('serviceId', excludeId);
            }
            const existing = await query.first();
            return !existing; // Return true if no existing record found
        } catch (error) {
            console.error('Error checking service name uniqueness:', error);
            return false; // Treat errors as non-unique to be safe
        }
    }

    /**
     * Add a new service
     * @param {Object} service - Service data to add
     * @returns {Promise<number>} ID of the new service
     */
    static async add(service) {
        try {
            // Prepare data for insertion, handling optional fields
            const serviceData = {
                name: service.name,
                description: service.description || null,
                price: parseFloat(service.price), // Ensure price is a number
                duration: service.duration ? parseInt(service.duration, 10) : null,
                type: service.type, // Required field
                category: service.category || null,
                specialtyId: service.specialtyId ? parseInt(service.specialtyId, 10) : null,
                status: service.status || 'active', // Default status
                image: service.image || '/public/images/services/default-service.jpg'
            };

            // Basic validation
            if (isNaN(serviceData.price) || serviceData.price < 0) {
                throw new Error('Invalid price provided. Price must be a non-negative number.');
            }
             if (!['service', 'test'].includes(serviceData.type)) {
                 throw new Error('Invalid service type provided.');
             }
             if (serviceData.duration !== null && (isNaN(serviceData.duration) || serviceData.duration < 0)) {
                throw new Error('Invalid duration provided. Duration must be a non-negative integer.');
            }

            const [serviceId] = await db('Service').insert(serviceData);
            return serviceId;
        } catch (error) {
            console.error('Error adding service:', error);
            if (error.code === 'ER_DUP_ENTRY' || (error.message && error.message.includes('Duplicate entry'))) {
                 throw new Error(`Service name "${service.name}" already exists.`);
            } else if (error.code === 'ER_NO_REFERENCED_ROW_2') {
                 throw new Error('Invalid Specialty ID provided.');
            }
             // Rethrow other errors (like validation errors)
            throw new Error(error.message || 'Unable to add service');
        }
    }

    /**
     * Update a service
     * @param {number} serviceId - ID of the service to update
     * @param {Object} service - Service data to update
     * @returns {Promise<boolean>} True if update was successful
     */
    static async update(serviceId, service) {
        try {
            // Prepare data for update, only include provided fields
            const serviceData = {};
            if (service.hasOwnProperty('name')) serviceData.name = service.name;
            if (service.hasOwnProperty('description')) serviceData.description = service.description;
            if (service.hasOwnProperty('price')) {
                serviceData.price = parseFloat(service.price);
                if (isNaN(serviceData.price) || serviceData.price < 0) {
                    throw new Error('Invalid price provided. Price must be a non-negative number.');
                }
            }
            if (service.hasOwnProperty('duration')) {
                 serviceData.duration = service.duration ? parseInt(service.duration, 10) : null;
                 if (serviceData.duration !== null && (isNaN(serviceData.duration) || serviceData.duration < 0)) {
                    throw new Error('Invalid duration provided. Duration must be a non-negative integer.');
                }
            }
            if (service.hasOwnProperty('type')) {
                 if (!['service', 'test'].includes(service.type)) {
                    throw new Error('Invalid service type provided.');
                 }
                 serviceData.type = service.type;
            }
            if (service.hasOwnProperty('category')) serviceData.category = service.category;
             // Allow setting specialtyId to null
             if (service.hasOwnProperty('specialtyId')) {
                 serviceData.specialtyId = service.specialtyId ? parseInt(service.specialtyId, 10) : null;
            }
            if (service.hasOwnProperty('status')) {
                 if (!['active', 'inactive'].includes(service.status)) {
                     throw new Error('Invalid status provided.');
                 }
                 serviceData.status = service.status;
            }
            
            // Handle image path
            if (service.hasOwnProperty('image')) {
                serviceData.image = service.image;
            }

            if (Object.keys(serviceData).length === 0) {
                 return true; // Nothing to update
            }

            const result = await db('Service')
                .where('serviceId', serviceId)
                .update(serviceData);

            return result > 0;
        } catch (error) {
            console.error(`Error updating service with ID ${serviceId}:`, error);
            if (error.code === 'ER_DUP_ENTRY' || (error.message && error.message.includes('Duplicate entry'))) {
                 throw new Error(`Service name "${service.name}" already exists.`);
            } else if (error.code === 'ER_NO_REFERENCED_ROW_2') {
                 throw new Error('Invalid Specialty ID provided.');
            }
            throw new Error(error.message || 'Unable to update service');
        }
    }

    /**
     * Check if a service has dependencies
     * @param {number} serviceId - ID of the service to check
     * @returns {Promise<Object>} Object with dependency information
     */
    static async checkDependencies(serviceId) {
        try {
            const hasAppointments = await db('AppointmentServices')
                .where('serviceId', serviceId)
                .first();
                
            return {
                hasAppointments: !!hasAppointments
            };
        } catch (error) {
            console.error(`Error checking dependencies for service with ID ${serviceId}:`, error);
            throw new Error('Unable to check service dependencies');
        }
    }

    /**
     * Delete a service
     * @param {number} serviceId - ID of the service to delete
     * @returns {Promise<boolean>} True if deletion was successful
     */
    static async delete(serviceId) {
        try {
            const result = await db('Service')
                .where('serviceId', serviceId)
                .delete();
            return result > 0;
        } catch (error) {
            console.error(`Error deleting service with ID ${serviceId}:`, error);
            if (error.code === 'ER_ROW_IS_REFERENCED_2') {
                throw new Error('Cannot delete this service because it is referenced by other records (appointments, etc.).');
            }
            throw new Error('Unable to delete service');
        }
    }

    /**
     * Search for services by name
     * @param {string} query - Search query
     * @returns {Promise<Array>} Array of matching services
     */
    static async search(query) {
        try {
            return await db('Service')
                .leftJoin('Specialty', 'Service.specialtyId', '=', 'Specialty.specialtyId')
                .select(
                    'Service.*',
                    'Specialty.name as specialtyName'
                )
                .where('Service.name', 'like', `%${query}%`)
                .orWhere('Service.description', 'like', `%${query}%`)
                .orderBy('Service.name');
        } catch (error) {
            console.error(`Error searching services with query ${query}:`, error);
            throw new Error('Unable to search services');
        }
    }
}

export default ServiceDAO; 