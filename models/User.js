import bcrypt from 'bcryptjs';
import UserDAO from '../dao/UserDAO.js';

/**
 * User Model Class
 * Represents a user in the system
 */
class User {
    /**
     * Create a new User instance
     * @param {Object} userData - User data from database or form
     */
    constructor(userData = {}) {
        this.userId = userData.userId || null;
        this.email = userData.email || '';
        this.password = userData.password || '';
        this.fullName = userData.fullName || '';
        this.phoneNumber = userData.phoneNumber || '';
        this.address = userData.address || null;
        this.profileImage = userData.profileImage || null;
        this.gender = userData.gender || 'other';
        this.dob = userData.dob || null;
        this.accountStatus = userData.accountStatus || 'pending';
        this.roleId = userData.roleId || 3;
        this.roleName = userData.roleName || '';
    }

    /**
     * Hash the user's password
     * @param {string} rawPassword - The raw password to hash
     * @returns {Promise<string>} The hashed password
     */
    async hashPassword(rawPassword) {
        try {
            const salt = await bcrypt.genSalt(10);
            return await bcrypt.hash(rawPassword || this.password, salt);
        } catch (error) {
            console.error('Error hashing password:', error);
            throw new Error('Unable to hash password');
        }
    }

    /**
     * Compare a raw password with the user's hashed password
     * @param {string} rawPassword - The raw password to compare
     * @returns {Promise<boolean>} True if passwords match
     */
    async comparePassword(rawPassword) {
        try {
            return await bcrypt.compare(rawPassword, this.password);
        } catch (error) {
            console.error('Error comparing passwords:', error);
            throw new Error('Unable to compare passwords');
        }
    }

    /**
     * Save the user to the database (create or update)
     * @returns {Promise<User>} The saved user
     */
    async save() {
        if (this.userId) {
            // Update existing user
            const userDataToUpdate = {
                email: this.email,
                fullName: this.fullName,
                phoneNumber: this.phoneNumber,
                address: this.address,
                profileImage: this.profileImage,
                gender: this.gender,
                dob: this.dob,
                accountStatus: this.accountStatus,
                roleId: this.roleId
            };
            
            // Only update password if it's been changed (not the hashed version from DB)
            if (this.password && !this.password.startsWith('$2')) {
                userDataToUpdate.password = await this.hashPassword(this.password);
            }
            
            await UserDAO.update(this.userId, userDataToUpdate);
            return this;
        } else {
            // Create new user
            if (this.password && !this.password.startsWith('$2')) {
                this.password = await this.hashPassword(this.password);
            }
            
            const userData = {
                email: this.email,
                password: this.password,
                fullName: this.fullName,
                phoneNumber: this.phoneNumber,
                address: this.address,
                profileImage: this.profileImage,
                gender: this.gender,
                dob: this.dob,
                accountStatus: this.accountStatus,
                roleId: this.roleId
            };
            
            const userId = await UserDAO.add(userData);
            this.userId = userId;
            return this;
        }
    }

    /**
     * Update the user's account status
     * @param {string} newStatus - The new account status
     * @returns {Promise<boolean>} True if update was successful
     */
    async updateStatus(newStatus) {
        if (!this.userId) {
            throw new Error('Cannot update status of unsaved user');
        }
        
        const success = await UserDAO.updateStatus(this.userId, newStatus);
        if (success) {
            this.accountStatus = newStatus;
        }
        return success;
    }

    /**
     * Delete the user from the database
     * @returns {Promise<boolean>} True if deletion was successful
     */
    async delete() {
        if (!this.userId) {
            throw new Error('Cannot delete unsaved user');
        }
        
        return await UserDAO.delete(this.userId);
    }

    /**
     * Find a user by their ID
     * @param {number} userId - The user ID to search for
     * @returns {Promise<User|null>} The found user or null
     */
    static async findById(userId) {
        const userData = await UserDAO.findById(userId);
        return userData ? new User(userData) : null;
    }

    /**
     * Find a user by their email
     * @param {string} email - The email to search for
     * @returns {Promise<User|null>} The found user or null
     */
    static async findByEmail(email) {
        const userData = await UserDAO.findByEmail(email);
        return userData ? new User(userData) : null;
    }

    /**
     * Find a user by their phone number
     * @param {string} phoneNumber - The phone number to search for
     * @returns {Promise<User|null>} The found user or null
     */
    static async findByPhone(phoneNumber) {
        const userData = await UserDAO.findByPhone(phoneNumber);
        return userData ? new User(userData) : null;
    }

    /**
     * Find all users with a specific role
     * @param {number} roleId - The role ID to search for
     * @returns {Promise<User[]>} Array of users with the specified role
     */
    static async findByRole(roleId) {
        const usersData = await UserDAO.findByRole(roleId);
        return usersData.map(userData => new User(userData));
    }

    /**
     * Get all users in the system
     * @returns {Promise<User[]>} Array of all users
     */
    static async findAll() {
        const usersData = await UserDAO.findAll();
        return usersData.map(userData => new User(userData));
    }

    /**
     * Count users by role
     * @returns {Promise<Array>} Count of users by role
     */
    static async countByRole() {
        return await UserDAO.countByRole();
    }

    /**
     * Count active users
     * @returns {Promise<number>} Count of active users
     */
    static async countActive() {
        return await UserDAO.countActive();
    }
}

export default User; 