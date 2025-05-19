import MedicationDAO from '../dao/MedicationDAO.js';

/**
 * Medication Model Class
 * Represents a medication in the system
 */
class Medication {
    /**
     * Create a new Medication instance
     * @param {Object} medicationData - Medication data from database or form
     */
    constructor(medicationData = {}) {
        this.medicationId = medicationData.medicationId || null;
        this.name = medicationData.name || '';
        this.description = medicationData.description || null;
        this.dosage = medicationData.dosage || null;
        this.price = medicationData.price || 0;
        this.category = medicationData.category || null;
        this.manufacturer = medicationData.manufacturer || null;
        this.sideEffects = medicationData.sideEffects || null;
        this.stockQuantity = medicationData.stockQuantity || 0;
    }

    /**
     * Save the medication to the database (create or update)
     * @returns {Promise<Medication>} The saved medication
     */
    async save() {
        try {
            if (this.medicationId) {
                // Update existing medication
                const medicationData = {
                    name: this.name,
                    description: this.description,
                    dosage: this.dosage,
                    price: this.price,
                    category: this.category,
                    manufacturer: this.manufacturer,
                    sideEffects: this.sideEffects,
                    stockQuantity: this.stockQuantity
                };
                
                const success = await MedicationDAO.update(this.medicationId, medicationData);
                if (!success) {
                    throw new Error(`Failed to update medication with ID ${this.medicationId}`);
                }
                return this;
            } else {
                // Create new medication
                const medicationData = {
                    name: this.name,
                    description: this.description,
                    dosage: this.dosage,
                    price: this.price,
                    category: this.category,
                    manufacturer: this.manufacturer,
                    sideEffects: this.sideEffects,
                    stockQuantity: this.stockQuantity
                };
                
                const medicationId = await MedicationDAO.add(medicationData);
                this.medicationId = medicationId;
                return this;
            }
        } catch (error) {
            console.error('Error saving medication:', error);
            throw new Error('Failed to save medication: ' + error.message);
        }
    }

    /**
     * Delete the medication from the database
     * @returns {Promise<boolean>} True if deletion was successful
     */
    async delete() {
        try {
            if (!this.medicationId) {
                throw new Error('Cannot delete unsaved medication');
            }
            
            return await MedicationDAO.delete(this.medicationId);
        } catch (error) {
            console.error('Error deleting medication:', error);
            throw new Error('Failed to delete medication: ' + error.message);
        }
    }

    /**
     * Check if medication has dependencies
     * @returns {Promise<boolean>} True if dependencies exist
     */
    async checkDependencies() {
        try {
            if (!this.medicationId) {
                throw new Error('Cannot check dependencies for unsaved medication');
            }
            
            return await MedicationDAO.checkDependencies(this.medicationId);
        } catch (error) {
            console.error('Error checking medication dependencies:', error);
            throw new Error('Failed to check medication dependencies: ' + error.message);
        }
    }

    /**
     * Update medication stock quantity
     * @param {number} quantity - Quantity to add (positive) or subtract (negative)
     * @returns {Promise<Medication>} The updated medication
     */
    async updateStock(quantity) {
        try {
            if (!this.medicationId) {
                throw new Error('Cannot update stock for unsaved medication');
            }
            
            this.stockQuantity += quantity;
            if (this.stockQuantity < 0) {
                this.stockQuantity = 0;
            }
            
            await this.save();
            return this;
        } catch (error) {
            console.error('Error updating medication stock:', error);
            throw new Error('Failed to update medication stock: ' + error.message);
        }
    }

    /**
     * Get all medications
     * @returns {Promise<Medication[]>} Array of all medications
     */
    static async findAll() {
        try {
            const medicationsData = await MedicationDAO.findAll();
            return medicationsData.map(medicationData => new Medication(medicationData));
        } catch (error) {
            console.error('Error finding all medications:', error);
            throw new Error('Failed to find all medications: ' + error.message);
        }
    }

    /**
     * Find medication by ID
     * @param {number} medicationId - Medication ID to find
     * @returns {Promise<Medication|null>} The found medication or null
     */
    static async findById(medicationId) {
        try {
            const medicationData = await MedicationDAO.findById(medicationId);
            return medicationData ? new Medication(medicationData) : null;
        } catch (error) {
            console.error(`Error finding medication with ID ${medicationId}:`, error);
            throw new Error('Failed to find medication: ' + error.message);
        }
    }

    /**
     * Search medications by name, description, category, or manufacturer
     * @param {string} query - Search query
     * @returns {Promise<Medication[]>} Array of matching medications
     */
    static async search(query) {
        try {
            const medicationsData = await MedicationDAO.search(query);
            return medicationsData.map(medicationData => new Medication(medicationData));
        } catch (error) {
            console.error(`Error searching medications with query "${query}":`, error);
            throw new Error('Failed to search medications: ' + error.message);
        }
    }

    /**
     * Check if a medication name is unique
     * @param {string} name - Name to check
     * @param {number|null} excludeMedicationId - Optional medication ID to exclude
     * @returns {Promise<boolean>} True if the name is unique
     */
    static async isNameUnique(name, excludeMedicationId = null) {
        try {
            return await MedicationDAO.isNameUnique(name, excludeMedicationId);
        } catch (error) {
            console.error(`Error checking if medication name "${name}" is unique:`, error);
            throw new Error('Failed to check medication name uniqueness: ' + error.message);
        }
    }
}

export default Medication; 