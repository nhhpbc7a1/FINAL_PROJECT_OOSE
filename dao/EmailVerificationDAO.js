import db from '../ultis/db.js';

/**
 * Data Access Object for EmailVerification table
 */
class EmailVerificationDAO {
    /**
     * Add a new email verification record
     * @param {Object} data - The email verification data
     * @returns {Promise<number>} The ID of the newly created record
     */
    static async add(data) {
        try {
            const [id] = await db('EmailVerification').insert({
                email: data.email,
                verificationCode: data.verificationCode,
                appointmentId: data.appointmentId,
                userId: data.userId,
                expiresAt: data.expiresAt,
                verified: data.verified || false
            });
            
            return id;
        } catch (error) {
            console.error('Error adding email verification record:', error);
            throw new Error('Failed to add email verification record: ' + error.message);
        }
    }

    /**
     * Update an existing email verification record
     * @param {number} id - The ID of the record to update
     * @param {Object} data - The updated data
     * @returns {Promise<boolean>} True if update was successful
     */
    static async update(id, data) {
        try {
            await db('EmailVerification')
                .where('id', id)
                .update({
                    email: data.email,
                    verificationCode: data.verificationCode,
                    appointmentId: data.appointmentId,
                    userId: data.userId,
                    expiresAt: data.expiresAt,
                    verified: data.verified
                });
                
            return true;
        } catch (error) {
            console.error('Error updating email verification record:', error);
            throw new Error('Failed to update email verification record: ' + error.message);
        }
    }

    /**
     * Find a verification record by email and code
     * @param {string} email - The email address
     * @param {string} code - The verification code
     * @returns {Promise<Object|null>} The verification record or null if not found
     */
    static async findByEmailAndCode(email, code) {
        try {
            const record = await db('EmailVerification')
                .where({
                    email: email,
                    verificationCode: code
                })
                .where('expiresAt', '>', new Date())
                .first();
                
            return record || null;
        } catch (error) {
            console.error('Error finding verification by email and code:', error);
            throw new Error('Failed to find verification record: ' + error.message);
        }
    }

    /**
     * Find a verification record by appointment ID
     * @param {number} appointmentId - The appointment ID
     * @returns {Promise<Object|null>} The verification record or null if not found
     */
    static async findByAppointmentId(appointmentId) {
        try {
            const record = await db('EmailVerification')
                .where('appointmentId', appointmentId)
                .orderBy('id', 'desc')
                .first();
                
            return record || null;
        } catch (error) {
            console.error('Error finding verification by appointment ID:', error);
            throw new Error('Failed to find verification record: ' + error.message);
        }
    }

    /**
     * Delete a verification record
     * @param {number} id - The ID of the record to delete
     * @returns {Promise<boolean>} True if deletion was successful
     */
    static async delete(id) {
        try {
            await db('EmailVerification')
                .where('id', id)
                .delete();
                
            return true;
        } catch (error) {
            console.error('Error deleting verification record:', error);
            throw new Error('Failed to delete verification record: ' + error.message);
        }
    }

    /**
     * Delete expired verification records
     * @returns {Promise<number>} The number of deleted records
     */
    static async deleteExpired() {
        try {
            const deleted = await db('EmailVerification')
                .where('expiresAt', '<', new Date())
                .delete();
                
            return deleted;
        } catch (error) {
            console.error('Error deleting expired verification records:', error);
            throw new Error('Failed to delete expired records: ' + error.message);
        }
    }
}

export default EmailVerificationDAO; 