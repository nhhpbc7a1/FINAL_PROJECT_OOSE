import SpecialtyDAO from '../dao/SpecialtyDAO.js';

/**
 * Specialty Model Class
 * Represents a medical specialty in the system
 */
class Specialty {
    /**
     * Create a new Specialty instance
     * @param {Object} specialtyData - Specialty data from database or form
     */
    constructor(specialtyData = {}) {
        this.specialtyId = specialtyData.specialtyId || null;
        this.name = specialtyData.name || '';
        this.description = specialtyData.description || null;
        this.headDoctorId = specialtyData.headDoctorId || null;
        this.hospitalId = specialtyData.hospitalId || 1; // Default to 1
        this.icon = specialtyData.icon || '/public/images/specialties/default-specialty.jpg';
        this.headDoctorName = specialtyData.headDoctorName || null;
        // Include other properties like status if they exist
        if (specialtyData.status) {
            this.status = specialtyData.status;
        }
        // Include count properties if they exist
        if (specialtyData.doctorCount !== undefined) {
            this.doctorCount = specialtyData.doctorCount;
        }
        if (specialtyData.serviceCount !== undefined) {
            this.serviceCount = specialtyData.serviceCount;
        }
    }

    /**
     * Save the specialty to the database (create or update)
     * @returns {Promise<Specialty>} The saved specialty
     */
    async save() {
        if (this.specialtyId) {
            // Update existing specialty
            const specialtyData = {
                name: this.name,
                description: this.description,
                headDoctorId: this.headDoctorId,
                hospitalId: this.hospitalId,
                icon: this.icon
            };
            
            // Add status if it exists
            if (this.status) {
                specialtyData.status = this.status;
            }
            
            await SpecialtyDAO.update(this.specialtyId, specialtyData);
            return this;
        } else {
            // Create new specialty
            const specialtyData = {
                name: this.name,
                description: this.description,
                headDoctorId: this.headDoctorId,
                hospitalId: this.hospitalId,
                icon: this.icon
            };
            
            // Add status if it exists
            if (this.status) {
                specialtyData.status = this.status;
            }
            
            const specialtyId = await SpecialtyDAO.add(specialtyData);
            this.specialtyId = specialtyId;
            return this;
        }
    }

    /**
     * Delete the specialty from the database
     * @returns {Promise<boolean>} True if deletion was successful
     */
    async delete() {
        if (!this.specialtyId) {
            throw new Error('Cannot delete unsaved specialty');
        }
        
        return await SpecialtyDAO.delete(this.specialtyId);
    }

    /**
     * Check if specialty has dependencies before attempting to delete
     * @returns {Promise<Object>} Dependency information
     */
    async checkDependencies() {
        if (!this.specialtyId) {
            throw new Error('Cannot check dependencies for unsaved specialty');
        }
        
        return await SpecialtyDAO.checkDependencies(this.specialtyId);
    }

    /**
     * Get all specialties
     * @returns {Promise<Specialty[]>} Array of all specialties
     */
    static async findAll() {
        const specialtiesData = await SpecialtyDAO.findAll();
        return specialtiesData.map(specialtyData => new Specialty(specialtyData));
    }

    /**
     * Get all active specialties
     * @returns {Promise<Specialty[]>} Array of active specialties
     */
    static async getAllActive() {
        const specialtiesData = await SpecialtyDAO.getAllActive();
        return specialtiesData.map(specialtyData => new Specialty(specialtyData));
    }

    /**
     * Find a specialty by ID
     * @param {number} specialtyId - Specialty ID to find
     * @returns {Promise<Specialty|null>} The found specialty or null
     */
    static async findById(specialtyId) {
        const specialtyData = await SpecialtyDAO.findById(specialtyId);
        return specialtyData ? new Specialty(specialtyData) : null;
    }

    /**
     * Check if a specialty name is unique
     * @param {string} name - Name to check
     * @param {number|null} excludeId - ID to exclude from check (for updates)
     * @returns {Promise<boolean>} True if name is unique
     */
    static async isNameUnique(name, excludeId = null) {
        return await SpecialtyDAO.isNameUnique(name, excludeId);
    }

    /**
     * Count doctors by specialty
     * @returns {Promise<Specialty[]>} Array of specialties with doctor counts
     */
    static async countDoctorsBySpecialty() {
        try {
            const specialtiesWithCounts = await SpecialtyDAO.countDoctorsBySpecialty();
            return specialtiesWithCounts.map(data => new Specialty(data));
        } catch (error) {
            console.error('Error counting doctors by specialty:', error);
            throw new Error('Failed to count doctors by specialty: ' + error.message);
        }
    }

    /**
     * Count services by specialty
     * @returns {Promise<Specialty[]>} Array of specialties with service counts
     */
    static async countServicesBySpecialty() {
        try {
            const specialtiesWithCounts = await SpecialtyDAO.countServicesBySpecialty();
            return specialtiesWithCounts.map(data => new Specialty(data));
        } catch (error) {
            console.error('Error counting services by specialty:', error);
            throw new Error('Failed to count services by specialty: ' + error.message);
        }
    }
}

export default Specialty; 