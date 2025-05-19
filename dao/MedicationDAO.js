import db from '../ultis/db.js';

/**
 * Data Access Object for Medication-related database operations
 */
class MedicationDAO {
    /**
     * Find all medications
     * @returns {Promise<Array>} List of all medications
     */
    static async findAll() {
        try {
            return await db('Medication')
                .select('*')
                .orderBy('name');
        } catch (error) {
            console.error('Error fetching medications:', error);
            throw new Error('Unable to load medications');
        }
    }

    /**
     * Find a medication by ID
     * @param {number} medicationId - The medication ID to find
     * @returns {Promise<Object|null>} The medication or null if not found
     */
    static async findById(medicationId) {
        try {
            const medication = await db('Medication')
                .select('*')
                .where('medicationId', medicationId)
                .first();
            return medication || null;
        } catch (error) {
            console.error(`Error fetching medication with ID ${medicationId}:`, error);
            throw new Error('Unable to find medication');
        }
    }

    /**
     * Search medications by name, description, category, or manufacturer
     * @param {string} query - The search query
     * @returns {Promise<Array>} List of matching medications
     */
    static async search(query) {
        try {
            return await db('Medication')
                .select('*')
                .where('name', 'like', `%${query}%`)
                .orWhere('description', 'like', `%${query}%`)
                .orWhere('category', 'like', `%${query}%`)
                .orWhere('manufacturer', 'like', `%${query}%`)
                .orderBy('name');
        } catch (error) {
            console.error(`Error searching medications with query "${query}":`, error);
            throw new Error('Unable to search medications');
        }
    }

    /**
     * Add a new medication
     * @param {Object} medication - The medication data to add
     * @returns {Promise<number>} The new medication ID
     */
    static async add(medication) {
        try {
            const [medicationId] = await db('Medication').insert(medication);
            return medicationId;
        } catch (error) {
            console.error('Error adding medication:', error);
            throw new Error('Unable to add medication');
        }
    }

    /**
     * Update a medication
     * @param {number} medicationId - The medication ID to update
     * @param {Object} medicationData - The updated medication data
     * @returns {Promise<boolean>} True if update was successful
     */
    static async update(medicationId, medicationData) {
        try {
            const result = await db('Medication')
                .where('medicationId', medicationId)
                .update(medicationData);
            return result > 0;
        } catch (error) {
            console.error(`Error updating medication with ID ${medicationId}:`, error);
            throw new Error('Unable to update medication');
        }
    }

    /**
     * Delete a medication
     * @param {number} medicationId - The medication ID to delete
     * @returns {Promise<boolean>} True if deletion was successful
     */
    static async delete(medicationId) {
        try {
            const result = await db('Medication')
                .where('medicationId', medicationId)
                .delete();
            return result > 0;
        } catch (error) {
            console.error(`Error deleting medication with ID ${medicationId}:`, error);
            throw new Error('Unable to delete medication');
        }
    }

    /**
     * Check if a medication name is unique
     * @param {string} name - The medication name to check
     * @param {number|null} excludeMedicationId - Optional medication ID to exclude from the check
     * @returns {Promise<boolean>} True if the name is unique
     */
    static async isNameUnique(name, excludeMedicationId = null) {
        try {
            const query = db('Medication')
                .where('name', name);
            
            if (excludeMedicationId) {
                query.whereNot('medicationId', excludeMedicationId);
            }
            
            const result = await query.first();
            return !result; // Return true if no result (name is unique)
        } catch (error) {
            console.error(`Error checking if medication name "${name}" is unique:`, error);
            throw new Error('Unable to check medication name uniqueness');
        }
    }

    /**
     * Check if a medication has dependencies in other tables
     * @param {number} medicationId - The medication ID to check
     * @returns {Promise<boolean>} True if dependencies exist
     */
    static async checkDependencies(medicationId) {
        try {
            // Check if medication is used in prescriptions
            const prescriptionCount = await db('PrescriptionDetail')
                .where('medicationId', medicationId)
                .count('detailId as count')
                .first();
            
            return prescriptionCount && prescriptionCount.count > 0;
        } catch (error) {
            console.error(`Error checking dependencies for medication ID ${medicationId}:`, error);
            throw new Error('Unable to check medication dependencies');
        }
    }
    
    /**
     * Update medication stock quantity
     * @param {number} medicationId - The medication ID to update
     * @param {number} quantity - Quantity to add (positive) or subtract (negative)
     * @returns {Promise<boolean>} True if update was successful
     */
    static async updateStock(medicationId, quantity) {
        try {
            // Begin transaction
            const trx = await db.transaction();
            
            try {
                // Get current stock
                const medication = await trx('Medication')
                    .select('stockQuantity')
                    .where('medicationId', medicationId)
                    .first();
                
                if (!medication) {
                    await trx.rollback();
                    throw new Error(`Medication with ID ${medicationId} not found`);
                }
                
                // Calculate new stock quantity (ensure it doesn't go below 0)
                let newQuantity = medication.stockQuantity + quantity;
                if (newQuantity < 0) {
                    newQuantity = 0;
                }
                
                // Update the stock
                const result = await trx('Medication')
                    .where('medicationId', medicationId)
                    .update({ stockQuantity: newQuantity });
                
                // Commit transaction
                await trx.commit();
                
                return result > 0;
            } catch (error) {
                // Rollback transaction on error
                await trx.rollback();
                throw error;
            }
        } catch (error) {
            console.error(`Error updating stock for medication ID ${medicationId}:`, error);
            throw new Error('Unable to update medication stock');
        }
    }
    
    /**
     * Find medications with low stock
     * @param {number} threshold - Stock quantity threshold
     * @returns {Promise<Array>} List of medications with stock below or equal to the threshold
     */
    static async findLowStock(threshold = 10) {
        try {
            return await db('Medication')
                .select('*')
                .where('stockQuantity', '<=', threshold)
                .orderBy('stockQuantity');
        } catch (error) {
            console.error('Error fetching medications with low stock:', error);
            throw new Error('Unable to find medications with low stock');
        }
    }
}

export default MedicationDAO; 