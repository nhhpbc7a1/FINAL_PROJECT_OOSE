import EmailVerificationDAO from '../dao/EmailVerificationDAO.js';

/**
 * EmailVerification model representing an email verification record in the system
 */
class EmailVerification {
    /**
     * Create a new EmailVerification instance
     * @param {Object} data - Email verification data
     */
    constructor(data = {}) {
        this.id = data.id || null;
        this.email = data.email;
        this.verificationCode = data.verificationCode;
        this.appointmentId = data.appointmentId || null;
        this.expiresAt = data.expiresAt;
        this.verified = data.verified || false;
        this.createdAt = data.createdAt || new Date();
    }

    /**
     * Check if verification code is expired
     * @returns {boolean} True if expired
     */
    isExpired() {
        return new Date() > new Date(this.expiresAt);
    }

    /**
     * Save the email verification record (create or update)
     * @returns {Promise<EmailVerification>} The saved email verification
     */
    async save() {
        try {
            const data = {
                email: this.email,
                verificationCode: this.verificationCode,
                appointmentId: this.appointmentId,
                expiresAt: this.expiresAt,
                verified: this.verified
            };
            
            if (this.id) {
                // Update existing record
                await EmailVerificationDAO.update(this.id, data);
            } else {
                // Create new record
                this.id = await EmailVerificationDAO.add(data);
            }
            
            return this;
        } catch (error) {
            console.error('Error saving email verification:', error);
            throw new Error('Failed to save email verification: ' + error.message);
        }
    }

    /**
     * Find a verification record by email and code
     * @param {string} email - The email address
     * @param {string} code - The verification code
     * @returns {Promise<EmailVerification|null>} The verification record or null if not found
     */
    static async findByEmailAndCode(email, code) {
        try {
            const verification = await EmailVerificationDAO.findByEmailAndCode(email, code);
            if (!verification) return null;
            return new EmailVerification(verification);
        } catch (error) {
            console.error('Error finding verification by email and code:', error);
            throw new Error('Failed to find verification: ' + error.message);
        }
    }

    /**
     * Find a verification record by appointment ID
     * @param {number} appointmentId - The appointment ID
     * @returns {Promise<EmailVerification|null>} The verification record or null if not found
     */
    static async findByAppointmentId(appointmentId) {
        try {
            const verification = await EmailVerificationDAO.findByAppointmentId(appointmentId);
            if (!verification) return null;
            return new EmailVerification(verification);
        } catch (error) {
            console.error('Error finding verification by appointment ID:', error);
            throw new Error('Failed to find verification: ' + error.message);
        }
    }

    /**
     * Delete a verification record
     * @returns {Promise<boolean>} True if deleted successfully
     */
    async delete() {
        try {
            if (!this.id) {
                throw new Error('Cannot delete unsaved verification record');
            }
            await EmailVerificationDAO.delete(this.id);
            return true;
        } catch (error) {
            console.error('Error deleting verification record:', error);
            throw new Error('Failed to delete verification record: ' + error.message);
        }
    }
}

export default EmailVerification; 