import db from '../ultis/db.js';
import bcrypt from 'bcryptjs';

export default {
    async hashPassword(password) {
        try {
            // Generate a salt
            const salt = await bcrypt.genSalt(10);
            // Hash the password with the salt
            const hashedPassword = await bcrypt.hash(password, salt);
            return hashedPassword;
        } catch (error) {
            console.error('Error hashing password:', error);
            throw new Error('Unable to hash password');
        }
    },

    async comparePassword(password, hashedPassword) {
        try {
            return await bcrypt.compare(password, hashedPassword);
        } catch (error) {
            console.error('Error comparing passwords:', error);
            throw new Error('Unable to compare passwords');
        }
    },
    async findAll() {
        try {
            return await db('User')
                .join('Role', 'User.roleId', '=', 'Role.roleId')
                .select('User.*', 'Role.roleName');
        } catch (error) {
            console.error('Error fetching users:', error);
            throw new Error('Unable to load users');
        }
    },

    async findById(userId) {
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
    },

    async findByEmail(email) {
        try {
            const user = await db('User')
                .where('email', email)
                .first();
            return user || null;
        } catch (error) {
            console.error(`Error fetching user with email ${email}:`, error);
            throw new Error('Unable to find user');
        }
    },

    async findByPhone(phoneNumber) {
        try {
            const user = await db('User')
                .where('phoneNumber', phoneNumber)
                .first();
            return user || null;
        } catch (error) {
            console.error(`Error fetching user with phone ${phoneNumber}:`, error);
            throw new Error('Unable to find user');
        }
    },

    async findByRole(roleId) {
        try {
            return await db('User')
                .where('roleId', roleId);
        } catch (error) {
            console.error(`Error fetching users with role ID ${roleId}:`, error);
            throw new Error('Unable to find users by role');
        }
    },

    async add(user) {
        try {
            // Validation
            // Insert user using knex
            const [userId] = await db('User').insert({
                email: user.email,
                password: user.password, // Password should already be hashed by the caller
                fullName: user.fullName,
                phoneNumber: user.phoneNumber,
                address: user.address || null,
                profileImage: user.profileImage || null,
                gender: user.gender || 'other',
                dob: user.dob || null,
                accountStatus: user.accountStatus || 'pending',
                roleId: user.roleId || 3
            });

            // Return the full user object with the new ID
            return {
                userId,
                ...user
            };
        } catch (error) {
            console.error('Error adding user:', error);
            throw new Error('Unable to add user: ' + error.message);
        }
    },

    async update(userId, user) {
        try {
            const result = await db('User')
                .where('userId', userId)
                .update(user);
            return result > 0;
        } catch (error) {
            console.error(`Error updating user with ID ${userId}:`, error);
            throw new Error('Unable to update user');
        }
    },

    async updateStatus(userId, accountStatus) {
        try {
            const result = await db('User')
                .where('userId', userId)
                .update({ accountStatus });
            return result > 0;
        } catch (error) {
            console.error(`Error updating status for user with ID ${userId}:`, error);
            throw new Error('Unable to update user status');
        }
    },

    async delete(userId) {
        try {
            const result = await db('User')
                .where('userId', userId)
                .delete();
            return result > 0;
        } catch (error) {
            console.error(`Error deleting user with ID ${userId}:`, error);
            throw new Error('Unable to delete user');
        }
    },

    async countByRole() {
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
    },

    async countActive() {
        try {
            const [result] = await db('User')
                .where('accountStatus', 'active')
                .count('userId as count');
            return result.count;
        } catch (error) {
            console.error('Error counting active users:', error);
            throw new Error('Unable to count active users');
        }
    },
};