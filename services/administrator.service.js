import db from '../ultis/db.js';

export default {
    async findAll() {
        try {
            return await db('Administrator')
                .join('User', 'Administrator.userId', '=', 'User.userId')
                .join('Role', 'User.roleId', '=', 'Role.roleId')
                .select(
                    'Administrator.*',
                    'User.email',
                    'User.fullName',
                    'User.phoneNumber',
                    'User.address',
                    'User.accountStatus',
                    'Role.roleName'
                );
        } catch (error) {
            console.error('Error fetching administrators:', error);
            throw new Error('Unable to load administrators');
        }
    },

    async findById(adminId) {
        try {
            const admin = await db('Administrator')
                .join('User', 'Administrator.userId', '=', 'User.userId')
                .join('Role', 'User.roleId', '=', 'Role.roleId')
                .select(
                    'Administrator.*',
                    'User.email',
                    'User.fullName',
                    'User.phoneNumber',
                    'User.address',
                    'User.accountStatus',
                    'Role.roleName'
                )
                .where('Administrator.adminId', adminId)
                .first();
            return admin || null;
        } catch (error) {
            console.error(`Error fetching administrator with ID ${adminId}:`, error);
            throw new Error('Unable to find administrator');
        }
    },

    async findByUserId(userId) {
        try {
            const admin = await db('Administrator')
                .where('userId', userId)
                .first();
            return admin || null;
        } catch (error) {
            console.error(`Error fetching administrator with user ID ${userId}:`, error);
            throw new Error('Unable to find administrator');
        }
    },

    async add(admin) {
        try {
            const [adminId] = await db('Administrator').insert(admin);
            return adminId;
        } catch (error) {
            console.error('Error adding administrator:', error);
            throw new Error('Unable to add administrator');
        }
    },

    async update(adminId, admin) {
        try {
            const result = await db('Administrator')
                .where('adminId', adminId)
                .update(admin);
            return result > 0;
        } catch (error) {
            console.error(`Error updating administrator with ID ${adminId}:`, error);
            throw new Error('Unable to update administrator');
        }
    },

    async delete(adminId) {
        try {
            const result = await db('Administrator')
                .where('adminId', adminId)
                .delete();
            return result > 0;
        } catch (error) {
            console.error(`Error deleting administrator with ID ${adminId}:`, error);
            throw new Error('Unable to delete administrator');
        }
    }
}; 