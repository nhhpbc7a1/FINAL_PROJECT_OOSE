import ServiceDAO from '../dao/ServiceDAO.js';

/**
 * Service Model Class
 * Represents a medical service in the system
 */
class Service {
    /**
     * Create a new Service instance
     * @param {Object} serviceData - Service data from database or form
     */
    constructor(serviceData = {}) {
        this.serviceId = serviceData.serviceId || null;
        this.name = serviceData.name || '';
        this.description = serviceData.description || null;
        this.price = serviceData.price || 0;
        this.duration = serviceData.duration || null;
        this.type = serviceData.type || 'service';
        this.category = serviceData.category || null;
        this.specialtyId = serviceData.specialtyId || null;
        this.status = serviceData.status || 'active';
        this.image = serviceData.image || '/public/images/services/default-service.jpg';
        this.specialtyName = serviceData.specialtyName || null;
    }

    /**
     * Save the service to the database (create or update)
     * @returns {Promise<Service>} The saved service
     */
    async save() {
        // Validate price
        if (isNaN(this.price) || this.price < 0) {
            throw new Error('Invalid price provided. Price must be a non-negative number.');
        }
        
        // Validate type
        if (!['service', 'test'].includes(this.type)) {
            throw new Error('Invalid service type provided.');
        }
        
        // Validate duration
        if (this.duration !== null && (isNaN(this.duration) || this.duration < 0)) {
            throw new Error('Invalid duration provided. Duration must be a non-negative integer.');
        }

        if (this.serviceId) {
            // Update existing service
            const serviceData = {
                name: this.name,
                description: this.description,
                price: parseFloat(this.price),
                duration: this.duration,
                type: this.type,
                category: this.category,
                specialtyId: this.specialtyId,
                status: this.status,
                image: this.image
            };
            
            await ServiceDAO.update(this.serviceId, serviceData);
            return this;
        } else {
            // Create new service
            const serviceData = {
                name: this.name,
                description: this.description,
                price: parseFloat(this.price),
                duration: this.duration,
                type: this.type,
                category: this.category,
                specialtyId: this.specialtyId,
                status: this.status,
                image: this.image
            };
            
            const serviceId = await ServiceDAO.add(serviceData);
            this.serviceId = serviceId;
            return this;
        }
    }

    /**
     * Delete the service from the database
     * @returns {Promise<boolean>} True if deletion was successful
     */
    async delete() {
        if (!this.serviceId) {
            throw new Error('Cannot delete unsaved service');
        }
        
        return await ServiceDAO.delete(this.serviceId);
    }

    /**
     * Check if service has dependencies before attempting to delete
     * @returns {Promise<Object>} Dependency information
     */
    async checkDependencies() {
        if (!this.serviceId) {
            throw new Error('Cannot check dependencies for unsaved service');
        }
        
        return await ServiceDAO.checkDependencies(this.serviceId);
    }

    /**
     * Get all services
     * @param {boolean} includeInactive - Whether to include inactive services
     * @returns {Promise<Service[]>} Array of all services
     */
    static async findAll(includeInactive = false) {
        const servicesData = await ServiceDAO.findAll(includeInactive);
        return servicesData.map(serviceData => new Service(serviceData));
    }

    /**
     * Get all active services
     * @returns {Promise<Service[]>} Array of active services
     */
    static async getAllActive() {
        const servicesData = await ServiceDAO.getAllActive();
        return servicesData.map(serviceData => new Service(serviceData));
    }

    /**
     * Find services by specialty
     * @param {number} specialtyId - Specialty ID to filter by
     * @param {boolean} includeInactive - Whether to include inactive services
     * @returns {Promise<Service[]>} Array of services for the specified specialty
     */
    static async findBySpecialty(specialtyId, includeInactive = false) {
        const servicesData = await ServiceDAO.findBySpecialty(specialtyId, includeInactive);
        return servicesData.map(serviceData => new Service(serviceData));
    }

    /**
     * Find a service by ID
     * @param {number} serviceId - Service ID to find
     * @returns {Promise<Service|null>} The found service or null
     */
    static async findById(serviceId) {
        const serviceData = await ServiceDAO.findById(serviceId);
        return serviceData ? new Service(serviceData) : null;
    }

    /**
     * Check if a service name is unique
     * @param {string} name - Name to check
     * @param {number|null} excludeId - ID to exclude from check (for updates)
     * @returns {Promise<boolean>} True if name is unique
     */
    static async isNameUnique(name, excludeId = null) {
        return await ServiceDAO.isNameUnique(name, excludeId);
    }

    /**
     * Search for services by name
     * @param {string} query - Search query
     * @returns {Promise<Service[]>} Array of matching services
     */
    static async search(query) {
        const servicesData = await ServiceDAO.search(query);
        return servicesData.map(serviceData => new Service(serviceData));
    }
}

export default Service; 