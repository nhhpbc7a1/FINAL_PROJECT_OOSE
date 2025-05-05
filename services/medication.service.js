import db from '../ultis/db.js';

export default {
    async findAll() {
        try {
            return await db('Medication')
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

    async findByName(name) {
        try {
            return await db('Medication')
                .where('name', 'like', `%${name}%`)
                .orderBy('name');
        } catch (error) {
            console.error(`Error fetching medications with name like ${name}:`, error);
            throw new Error('Unable to find medications by name');
        }
    },

    async findByCategory(category) {
        try {
            return await db('Medication')
                .where('category', category)
                .orderBy('name');
        } catch (error) {
            console.error(`Error fetching medications in category ${category}:`, error);
            throw new Error('Unable to find medications by category');
        }
    },

    async findByManufacturer(manufacturer) {
        try {
            return await db('Medication')
                .where('manufacturer', 'like', `%${manufacturer}%`)
                .orderBy('name');
        } catch (error) {
            console.error(`Error fetching medications by manufacturer ${manufacturer}:`, error);
            throw new Error('Unable to find medications by manufacturer');
        }
    },

    async search(query) {
        try {
            return await db('Medication')
                .where('name', 'like', `%${query}%`)
                .orWhere('description', 'like', `%${query}%`)
                .orWhere('category', 'like', `%${query}%`)
                .orWhere('manufacturer', 'like', `%${query}%`)
                .orderBy('name');
        } catch (error) {
            console.error(`Error searching medications with query "${query}":`, error);
            throw new Error('Unable to search medications');
        }
    },

    async add(medication) {
        try {
            const [medicationId] = await db('Medication').insert(medication);
            return medicationId;
        } catch (error) {
            console.error('Error adding medication:', error);
            throw new Error('Unable to add medication');
        }
    },

    async update(medicationId, medication) {
        try {
            const result = await db('Medication')
                .where('medicationId', medicationId)
                .update(medication);
            return result > 0;
        } catch (error) {
            console.error(`Error updating medication with ID ${medicationId}:`, error);
            throw new Error('Unable to update medication');
        }
    },

    async delete(medicationId) {
        try {
            const result = await db('Medication')
                .where('medicationId', medicationId)
                .delete();
            return result > 0;
        } catch (error) {
            console.error(`Error deleting medication with ID ${medicationId}:`, error);
            throw new Error('Unable to delete medication');
        }
    },

    async getCategories() {
        try {
            const categories = await db('Medication')
                .distinct('category')
                .whereNotNull('category')
                .orderBy('category');
            return categories.map(item => item.category);
        } catch (error) {
            console.error('Error fetching medication categories:', error);
            throw new Error('Unable to get medication categories');
        }
    },

    async getManufacturers() {
        try {
            const manufacturers = await db('Medication')
                .distinct('manufacturer')
                .whereNotNull('manufacturer')
                .orderBy('manufacturer');
            return manufacturers.map(item => item.manufacturer);
        } catch (error) {
            console.error('Error fetching medication manufacturers:', error);
            throw new Error('Unable to get medication manufacturers');
        }
    },

    async countByCategory() {
        try {
            return await db('Medication')
                .select('category')
                .count('medicationId as count')
                .whereNotNull('category')
                .groupBy('category');
        } catch (error) {
            console.error('Error counting medications by category:', error);
            throw new Error('Unable to count medications by category');
        }
    },

    async countByManufacturer() {
        try {
            return await db('Medication')
                .select('manufacturer')
                .count('medicationId as count')
                .whereNotNull('manufacturer')
                .groupBy('manufacturer');
        } catch (error) {
            console.error('Error counting medications by manufacturer:', error);
            throw new Error('Unable to count medications by manufacturer');
        }
    },

    async getMostPrescribed(limit = 10) {
        try {
            // Get most frequently prescribed medications
            return await db('PrescriptionDetail')
                .join('Medication', 'PrescriptionDetail.medicationId', '=', 'Medication.medicationId')
                .select(
                    'Medication.*'
                )
                .count('PrescriptionDetail.detailId as prescriptionCount')
                .groupBy('PrescriptionDetail.medicationId')
                .orderBy('prescriptionCount', 'desc')
                .limit(limit);
        } catch (error) {
            console.error('Error fetching most prescribed medications:', error);
            throw new Error('Unable to get most prescribed medications');
        }
    }
}; 