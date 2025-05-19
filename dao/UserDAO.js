import db from '../ultis/db.js';

/**
 * Data Access Object for User-related database operations
 */
class UserDAO {
    /**
     * Retrieve all users with their role names
     * @returns {Promise<Array>} Array of user objects
     */
    static async findAll() {
        try {
            return await db('User')
                .join('Role', 'User.roleId', '=', 'Role.roleId')
                .select('User.*', 'Role.roleName');
        } catch (error) {
            console.error('Error fetching users:', error);
            throw new Error('Unable to load users');
        }
    }

    /**
     * Find a user by their ID
     * @param {number} userId - The user ID to search for
     * @returns {Promise<Object|null>} The user object or null
     */
    static async findById(userId) {
        try {
            const user = await db('User')
                .join('Role', 'User.roleId', '=', 'Role.roleId')
                .select('User.*', 'Role.roleName')
                .where('User.userId', userId)
                .first();
            return user || null;
        } catch (error) {
            console.error(`Error fetching user with ID ${userId}:`, error);
            throw new Error('Unable to find user');
        }
    }

    /**
     * Find a user by their email
     * @param {string} email - The email to search for
     * @returns {Promise<Object|null>} The user object or null
     */
    static async findByEmail(email) {
        try {
            const user = await db('User')
                .where('email', email)
                .first();
            return user || null;
        } catch (error) {
            console.error(`Error fetching user with email ${email}:`, error);
            throw new Error('Unable to find user');
        }
    }

    /**
     * Find a user by their phone number
     * @param {string} phoneNumber - The phone number to search for
     * @returns {Promise<Object|null>} The user object or null
     */
    static async findByPhone(phoneNumber) {
        try {
            const user = await db('User')
                .where('phoneNumber', phoneNumber)
                .first();
            return user || null;
        } catch (error) {
            console.error(`Error fetching user with phone ${phoneNumber}:`, error);
            throw new Error('Unable to find user');
        }
    }

    /**
     * Find users with a specific role
     * @param {number} roleId - The role ID to search for
     * @returns {Promise<Array>} Array of user objects
     */
    static async findByRole(roleId) {
        try {
            return await db('User')
                .where('roleId', roleId);
        } catch (error) {
            console.error(`Error fetching users with role ID ${roleId}:`, error);
            throw new Error('Unable to find users by role');
        }
    }

    /**
     * Add a new user to the database
     * @param {Object} user - User data to add
     * @returns {Promise<number>} The ID of the newly created user
     */
    static async add(user) {
        try {
            const [userId] = await db('User').insert({
                email: user.email,
                password: user.password,
                fullName: user.fullName,
                phoneNumber: user.phoneNumber,
                address: user.address || null,
                profileImage: user.profileImage || null,
                gender: user.gender || 'other',
                dob: user.dob || null,
                accountStatus: user.accountStatus || 'pending',
                roleId: user.roleId || 3
            });

            return userId;
        } catch (error) {
            console.error('Error adding user:', error);
            throw new Error('Unable to add user: ' + error.message);
        }
    }

    /**
     * Update a user in the database
     * @param {number} userId - The ID of the user to update
     * @param {Object} userData - The user data to update
     * @returns {Promise<boolean>} True if update was successful
     */
    static async update(userId, userData) {
        try {
            const result = await db('User')
                .where('userId', userId)
                .update(userData);
            return result > 0;
        } catch (error) {
            console.error(`Error updating user with ID ${userId}:`, error);
            throw new Error('Unable to update user');
        }
    }

    /**
     * Update a user's account status
     * @param {number} userId - The ID of the user
     * @param {string} accountStatus - The new account status
     * @returns {Promise<boolean>} True if update was successful
     */
    static async updateStatus(userId, accountStatus) {
        try {
            const result = await db('User')
                .where('userId', userId)
                .update({ accountStatus });
            return result > 0;
        } catch (error) {
            console.error(`Error updating status for user with ID ${userId}:`, error);
            throw new Error('Unable to update user status');
        }
    }

    /**
     * Delete a user from the database
     * @param {number} userId - The ID of the user to delete
     * @returns {Promise<boolean>} True if deletion was successful
     */
    static async delete(userId) {
        try {
            const result = await db('User')
                .where('userId', userId)
                .delete();
            return result > 0;
        } catch (error) {
            console.error(`Error deleting user with ID ${userId}:`, error);
            throw new Error('Unable to delete user');
        }
    }

    /**
     * Count users by role
     * @returns {Promise<Array>} Count of users by role
     */
    static async countByRole() {
        try {
            const counts = await db('User')
                .join('Role', 'User.roleId', '=', 'Role.roleId')
                .select('Role.roleName')
                .count('User.userId as count')
                .groupBy('User.roleId');
            return counts;
        } catch (error) {
            console.error('Error counting users by role:', error);
            throw new Error('Unable to count users by role');
        }
    }

    /**
     * Count active users
     * @returns {Promise<number>} Count of active users
     */
    static async countActive() {
        try {
            const [result] = await db('User')
                .where('accountStatus', 'active')
                .count('userId as count');
            return result.count;
        } catch (error) {
            console.error('Error counting active users:', error);
            throw new Error('Unable to count active users');
        }
    }
}

export default UserDAO; 