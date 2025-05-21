import MedicationDAO from '../../dao/MedicationDAO.js';

export default {
    async findAll() {
        try {
            return await MedicationDAO.findAll();
        } catch (error) {
            console.error('Error in medicationService.findAll:', error);
            throw new Error('Unable to fetch medications: ' + error.message);
        }
    },

    async findById(medicationId) {
        try {
            return await MedicationDAO.findById(medicationId);
        } catch (error) {
            console.error(`Error in medicationService.findById(${medicationId}):`, error);
            throw new Error('Unable to find medication: ' + error.message);
        }
    },

    /**
     * Checks if a medication name already exists, optionally excluding a specific ID.
     * @param {string} name - The medication name to check.
     * @param {number|null} excludeId - The medication ID to exclude (for updates).
     * @returns {boolean} - True if the name is unique, false otherwise.
     */
    async isNameUnique(name, excludeId = null) {
        try {
            return await MedicationDAO.isNameUnique(name, excludeId);
        } catch (error) {
            console.error('Error checking medication name uniqueness:', error);
            return false; // Treat errors as non-unique to be safe
        }
    },

    async add(medication) {
        try {
            // Validate medication data
            if (!medication.name || medication.name.trim() === '') {
                throw new Error('Medication name is required');
            }

            // Ensure price is a valid number
            const price = parseFloat(medication.price);
            if (isNaN(price) || price < 0) {
                throw new Error('Invalid price provided. Price must be a non-negative number.');
            }

            // Prepare data for insertion, handling optional fields
            const medicationData = {
                name: medication.name,
                description: medication.description || null,
                dosage: medication.dosage || null,
                price: price,
                category: medication.category || null,
                manufacturer: medication.manufacturer || null,
                sideEffects: medication.sideEffects || null
            };

            // Check for duplicate name
            const isUnique = await this.isNameUnique(medicationData.name);
            if (!isUnique) {
                throw new Error(`Medication name "${medicationData.name}" already exists.`);
            }

            // Use DAO to add the medication
            return await MedicationDAO.add(medicationData);
        } catch (error) {
            console.error('Error adding medication:', error);
            throw new Error(error.message || 'Unable to add medication');
        }
    },

    async update(medicationId, medication) {
        try {
            // Check if medication exists
            const existingMedication = await MedicationDAO.findById(medicationId);
            if (!existingMedication) {
                throw new Error(`Medication with ID ${medicationId} not found`);
            }

            // Prepare data for update, only include provided fields
            const medicationData = {};
            if (medication.hasOwnProperty('name')) medicationData.name = medication.name;
            if (medication.hasOwnProperty('description')) medicationData.description = medication.description;
            if (medication.hasOwnProperty('dosage')) medicationData.dosage = medication.dosage;
            if (medication.hasOwnProperty('price')) {
                 medicationData.price = parseFloat(medication.price);
                  if (isNaN(medicationData.price) || medicationData.price < 0) {
                      throw new Error('Invalid price provided. Price must be a non-negative number.');
                  }
            }
            if (medication.hasOwnProperty('category')) medicationData.category = medication.category;
            if (medication.hasOwnProperty('manufacturer')) medicationData.manufacturer = medication.manufacturer;
            if (medication.hasOwnProperty('sideEffects')) medicationData.sideEffects = medication.sideEffects;

            if (Object.keys(medicationData).length === 0) {
                return true; // Nothing to update
            }

            // If name is changing, check uniqueness
            if (medicationData.name && medicationData.name !== existingMedication.name) {
                const isUnique = await this.isNameUnique(medicationData.name, medicationId);
                if (!isUnique) {
                    throw new Error(`Medication name "${medicationData.name}" already exists.`);
                }
            }

            // Use DAO to update the medication
            return await MedicationDAO.update(medicationId, medicationData);
        } catch (error) {
            console.error(`Error updating medication with ID ${medicationId}:`, error);
            throw new Error(error.message || 'Unable to update medication');
        }
    },

     /**
     * Checks if a medication is part of any prescription detail.
     * @param {number} medicationId - The ID of the medication to check.
     * @returns {boolean} - True if dependencies exist, false otherwise.
     */
    async checkDependencies(medicationId) {
        try {
            return await MedicationDAO.hasPrescriptions(medicationId);
        } catch (error) {
            console.error(`Error checking dependencies for medication ID ${medicationId}:`, error);
            return true; // Assume dependencies exist on error to be safe
        }
    },

    async delete(medicationId) {
        try {
            // Check for dependencies first
            const hasDependencies = await this.checkDependencies(medicationId);
            if (hasDependencies) {
                throw new Error('Cannot delete medication because it is referenced in prescriptions.');
            }
            
            // Use DAO to delete the medication
            return await MedicationDAO.delete(medicationId);
        } catch (error) {
            console.error(`Error deleting medication with ID ${medicationId}:`, error);
            throw new Error(error.message || 'Unable to delete medication');
        }
    },

    async search(query) {
        try {
            return await MedicationDAO.search(query);
        } catch (error) {
            console.error(`Error searching medications with query "${query}":`, error);
            throw new Error('Unable to search medications: ' + error.message);
        }
    },

    async searchByName(searchTerm) {
        try {
            return await MedicationDAO.searchByName(searchTerm);
        } catch (error) {
            console.error(`Error in medicationService.searchByName(${searchTerm}):`, error);
            throw new Error('Unable to search medications by name: ' + error.message);
        }
    },

    async findByCategory(category) {
        try {
            return await MedicationDAO.findByCategory(category);
        } catch (error) {
            console.error(`Error in medicationService.findByCategory(${category}):`, error);
            throw new Error('Unable to find medications by category: ' + error.message);
        }
    }
};