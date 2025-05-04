import db from '../ultis/db.js';

export default {
    async findAll() {
        try {
            return await db('Role');
        } catch (error) {
            console.error('Error fetching roles:', error);
            throw new Error('Unable to load roles');
        }
    },

    async findById(roleId) {
        try {
            const role = await db('Role').where('roleId', roleId).first();
            return role || null;
        } catch (error) {
            console.error(`Error fetching role with ID ${roleId}:`, error);
            throw new Error('Unable to find role');
        }
    },

    async findByName(roleName) {
        try {
            const role = await db('Role').where('roleName', roleName).first();
            return role || null;
        } catch (error) {
            console.error(`Error fetching role with name ${roleName}:`, error);
            throw new Error('Unable to find role');
        }
    },

    async add(role) {
        try {
            const [roleId] = await db('Role').insert(role);
            return roleId;
        } catch (error) {
            console.error('Error adding role:', error);
            throw new Error('Unable to add role');
        }
    },

    async update(roleId, role) {
        try {
            const result = await db('Role').where('roleId', roleId).update(role);
            return result > 0;
        } catch (error) {
            console.error(`Error updating role with ID ${roleId}:`, error);
            throw new Error('Unable to update role');
        }
    },

    async delete(roleId) {
        try {
            const result = await db('Role').where('roleId', roleId).delete();
            return result > 0;
        } catch (error) {
            console.error(`Error deleting role with ID ${roleId}:`, error);
            throw new Error('Unable to delete role');
        }
    }
}; 