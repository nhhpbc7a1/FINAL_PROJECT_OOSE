import db from '../ultis/db.js';

export default {
    async findAll() {
        try {
            // Simple select, order by name
            return await db('Medication')
                .select('*')
                .orderBy('name');
        } catch (error) {
            console.error('Error fetching medications:', error);
            throw new Error('Unable to load medications');
        }
    },

    async findById(medicationId) {
        try {
            const medication = await db('Medication')
                .where('medicationId', medicationId)
                .first();
            return medication || null;
        } catch (error) {
            console.error(`Error fetching medication with ID ${medicationId}:`, error);
            throw new Error('Unable to find medication');
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
            const query = db('Medication').whereRaw('LOWER(name) = LOWER(?)', [name]); // Case-insensitive check
            if (excludeId) {
                query.andWhereNot('medicationId', excludeId);
            }
            const existing = await query.first();
            return !existing; // Return true if no existing record found
        } catch (error) {
            console.error('Error checking medication name uniqueness:', error);
            return false; // Treat errors as non-unique to be safe
        }
    },

    async add(medication) {
        try {
            // Prepare data for insertion, handling optional fields
            const medicationData = {
                name: medication.name,
                description: medication.description || null,
                dosage: medication.dosage || null,
                price: parseFloat(medication.price), // Ensure price is a number
                category: medication.category || null,
                manufacturer: medication.manufacturer || null,
                sideEffects: medication.sideEffects || null
            };

             // Basic validation on price
            if (isNaN(medicationData.price) || medicationData.price < 0) {
                throw new Error('Invalid price provided. Price must be a non-negative number.');
            }

            const [medicationId] = await db('Medication').insert(medicationData);
            return medicationId;
        } catch (error) {
            console.error('Error adding medication:', error);
            if (error.code === 'ER_DUP_ENTRY' || (error.message && error.message.includes('Duplicate entry'))) {
                 throw new Error(`Medication name "${medication.name}" already exists.`);
             }
            // Rethrow other errors, including the price validation error
            throw new Error(error.message || 'Unable to add medication');
        }
    },

    async update(medicationId, medication) {
        try {
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

            const result = await db('Medication')
                .where('medicationId', medicationId)
                .update(medicationData);

            return result > 0;
        } catch (error) {
            console.error(`Error updating medication with ID ${medicationId}:`, error);
            if (error.code === 'ER_DUP_ENTRY' || (error.message && error.message.includes('Duplicate entry'))) {
                 throw new Error(`Medication name "${medication.name}" already exists.`);
            }
            // Rethrow other errors, including the price validation error
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
            const hasPrescriptions = await db('PrescriptionDetail')
                                          .where('medicationId', medicationId)
                                          .first();
            return !!hasPrescriptions; // Returns true if a record is found
        } catch (error) {
            console.error(`Error checking dependencies for medication ID ${medicationId}:`, error);
            return true; // Assume dependencies exist on error to be safe
        }
    },

    async delete(medicationId) {
        try {
            // Dependency check should be done in the route before calling this.
            const result = await db('Medication')
                .where('medicationId', medicationId)
                .delete();
            return result > 0;
        } catch (error) {
            console.error(`Error deleting medication with ID ${medicationId}:`, error);
             if (error.code === 'ER_ROW_IS_REFERENCED_2') {
                 // This might still happen if the check in the route fails or race condition
                 throw new Error('Cannot delete medication because it is referenced in prescriptions.');
             }
            throw new Error('Unable to delete medication');
        }
    },

    async search(query) {
        try {
            return await db('Medication')
                .select('*')
                .where(builder => {
                    builder.where('name', 'like', `%${query}%`)
                           .orWhere('category', 'like', `%${query}%`)
                           .orWhere('manufacturer', 'like', `%${query}%`)
                           .orWhere('description', 'like', `%${query}%`);
                 })
                 .orderBy('name');
        } catch (error) {
            console.error(`Error searching medications with query "${query}":`, error);
            throw new Error('Unable to search medications');
        }
    }
};