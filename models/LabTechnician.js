import LabTechnicianDAO from '../dao/LabTechnicianDAO.js';

/**
 * LabTechnician Model Class
 * Represents a laboratory technician in the system
 */
class LabTechnician {
    /**
     * Create a new LabTechnician instance
     * @param {Object} technicianData - Lab technician data from database or form
     */
    constructor(technicianData = {}) {
        this.technicianId = technicianData.technicianId || null;
        this.userId = technicianData.userId || null;
        this.specialtyId = technicianData.specialtyId || null;
        this.specialization = technicianData.specialization || null;
        
        // Include user-related properties if available
        this.email = technicianData.email || null;
        this.fullName = technicianData.fullName || null;
        this.phoneNumber = technicianData.phoneNumber || null;
        this.address = technicianData.address || null;
        this.accountStatus = technicianData.accountStatus || null;
        this.gender = technicianData.gender || null;
        this.dob = technicianData.dob || null;
        this.profileImage = technicianData.profileImage || null;
        
        // Include specialty name if available
        this.specialtyName = technicianData.specialtyName || null;
    }

    /**
     * Save the lab technician to the database (create or update)
     * @returns {Promise<LabTechnician>} The saved lab technician
     */
    async save() {
        try {
            if (this.technicianId) {
                // Update existing lab technician
                const technicianData = {
                    specialtyId: this.specialtyId,
                    specialization: this.specialization
                };
                
                const success = await LabTechnicianDAO.update(this.technicianId, technicianData);
                if (!success) {
                    throw new Error(`Failed to update lab technician with ID ${this.technicianId}`);
                }
                return this;
            } else {
                // Create new lab technician
                const technicianData = {
                    userId: this.userId,
                    specialtyId: this.specialtyId,
                    specialization: this.specialization
                };
                
                const technicianId = await LabTechnicianDAO.add(technicianData);
                this.technicianId = technicianId;
                return this;
            }
        } catch (error) {
            console.error('Error saving lab technician:', error);
            throw new Error('Failed to save lab technician: ' + error.message);
        }
    }

    /**
     * Delete the lab technician from the database
     * @returns {Promise<boolean>} True if deletion was successful
     */
    async delete() {
        try {
            if (!this.technicianId) {
                throw new Error('Cannot delete unsaved lab technician');
            }
            
            return await LabTechnicianDAO.delete(this.technicianId);
        } catch (error) {
            console.error('Error deleting lab technician:', error);
            throw new Error('Failed to delete lab technician: ' + error.message);
        }
    }

    /**
     * Check if the lab technician has dependencies (e.g., test results)
     * @returns {Promise<boolean>} True if dependencies exist, false otherwise
     */
    async checkDependencies() {
        try {
            // This assumes you have a TestResultDAO with appropriate methods
            const testResults = await LabTechnicianDAO.checkDependencies(this.technicianId);
            return testResults > 0;
        } catch (error) {
            console.error(`Error checking dependencies for lab technician ${this.technicianId}:`, error);
            throw new Error('Failed to check dependencies: ' + error.message);
        }
    }

    /**
     * Get all lab technicians
     * @returns {Promise<LabTechnician[]>} Array of all lab technicians
     */
    static async findAll() {
        try {
            const techniciansData = await LabTechnicianDAO.findAll();
            return techniciansData.map(technicianData => new LabTechnician(technicianData));
        } catch (error) {
            console.error('Error finding all lab technicians:', error);
            throw new Error('Failed to find all lab technicians: ' + error.message);
        }
    }

    /**
     * Find lab technician by ID
     * @param {number} technicianId - Lab technician ID to find
     * @returns {Promise<LabTechnician|null>} The found lab technician or null
     */
    static async findById(technicianId) {
        try {
            const technicianData = await LabTechnicianDAO.findById(technicianId);
            return technicianData ? new LabTechnician(technicianData) : null;
        } catch (error) {
            console.error(`Error finding lab technician with ID ${technicianId}:`, error);
            throw new Error('Failed to find lab technician: ' + error.message);
        }
    }

    /**
     * Find lab technician by user ID
     * @param {number} userId - User ID to find lab technician for
     * @returns {Promise<LabTechnician|null>} The found lab technician or null
     */
    static async findByUserId(userId) {
        try {
            const technicianData = await LabTechnicianDAO.findByUserId(userId);
            return technicianData ? new LabTechnician(technicianData) : null;
        } catch (error) {
            console.error(`Error finding lab technician with user ID ${userId}:`, error);
            throw new Error('Failed to find lab technician by user ID: ' + error.message);
        }
    }

    /**
     * Find lab technicians by specialty
     * @param {number} specialtyId - Specialty ID to find lab technicians for
     * @returns {Promise<LabTechnician[]>} Array of lab technicians with the specialty
     */
    static async findBySpecialty(specialtyId) {
        try {
            const techniciansData = await LabTechnicianDAO.findBySpecialty(specialtyId);
            return techniciansData.map(technicianData => new LabTechnician(technicianData));
        } catch (error) {
            console.error(`Error finding lab technicians with specialty ID ${specialtyId}:`, error);
            throw new Error('Failed to find lab technicians by specialty: ' + error.message);
        }
    }

    /**
     * Find active lab technicians for dropdown selection
     * @returns {Promise<Array>} Array of active lab technicians for dropdown
     */
    static async findAllForDropdown() {
        try {
            return await LabTechnicianDAO.findAllForDropdown();
        } catch (error) {
            console.error('Error finding lab technicians for dropdown:', error);
            throw new Error('Failed to find lab technicians for dropdown: ' + error.message);
        }
    }

    /**
     * Search lab technicians by name, email, or specialization
     * @param {string} searchQuery - Search query
     * @returns {Promise<LabTechnician[]>} Array of matching lab technicians
     */
    static async search(searchQuery) {
        try {
            const techniciansData = await LabTechnicianDAO.search(searchQuery);
            return techniciansData.map(technicianData => new LabTechnician(technicianData));
        } catch (error) {
            console.error(`Error searching lab technicians with query "${searchQuery}":`, error);
            throw new Error('Failed to search lab technicians: ' + error.message);
        }
    }

    /**
     * Count lab technicians by specialty
     * @returns {Promise<Array>} Count of lab technicians by specialty
     */
    static async countBySpecialty() {
        try {
            return await LabTechnicianDAO.countBySpecialty();
        } catch (error) {
            console.error('Error counting lab technicians by specialty:', error);
            throw new Error('Failed to count lab technicians by specialty: ' + error.message);
        }
    }
}

export default LabTechnician; 