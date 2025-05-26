import EmailVerificationDAO from '../dao/EmailVerificationDAO.js';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

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

        // Khởi tạo nodemailer transporter
        this.transporter = nodemailer.createTransport({
            service: 'Gmail',
            auth: {
                user: process.env.EMAIL_USER || 'your-email@gmail.com',
                pass: process.env.EMAIL_PASS || 'your-app-password'
            }
        });
    }

    /**
     * Tạo mã xác thực ngẫu nhiên 6 số
     * @returns {string} Generated verification code
     */
    static generateVerificationCode() {
        return Math.floor(100000 + Math.random() * 900000).toString();
    }

    /**
     * Tạo một bản ghi xác thực mới
     * @param {string} email - The email address
     * @param {number} appointmentId - The appointment ID
     * @returns {Promise<EmailVerification>} The created verification record
     */
    static async create(email, appointmentId = null) {
        const verificationCode = this.generateVerificationCode();
        const expiresAt = new Date(Date.now() + 5 * 60000); // Hết hạn sau 5 phút

        const verification = new EmailVerification({
            email,
            verificationCode,
            appointmentId,
            expiresAt
        });

        await verification.save();
        await verification.sendVerificationEmail();
        return verification;
    }

    /**
     * Check if verification code is expired
     * @returns {boolean} True if expired
     */
    isExpired() {
        return new Date() > new Date(this.expiresAt);
    }

    /**
     * Send verification email
     * @returns {Promise<boolean>} True if email sent successfully
     */
    async sendVerificationEmail() {
        const mailOptions = {
            from: process.env.EMAIL_USER || 'your-email@gmail.com',
            to: this.email,
            subject: 'Xác thực email đặt lịch khám',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #0066cc;">Xác thực email đặt lịch khám</h2>
                    <p>Xin chào,</p>
                    <p>Đây là mã xác thực email của bạn:</p>
                    <div style="background-color: #f4f4f4; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; margin: 20px 0;">
                        ${this.verificationCode}
                    </div>
                    <p>Mã xác thực này sẽ hết hạn sau 5 phút.</p>
                    <p>Nếu bạn không yêu cầu mã này, vui lòng bỏ qua email này.</p>
                    <p>Trân trọng,<br>Phòng khám XYZ</p>
                </div>
            `
        };

        try {
            await this.transporter.sendMail(mailOptions);
            return true;
        } catch (error) {
            console.error('Error sending verification email:', error);
            throw new Error('Failed to send verification email: ' + error.message);
        }
    }

    /**
     * Verify the verification code
     * @param {string} code - The verification code
     * @returns {Promise<boolean>} True if verified successfully
     */
    async verify(code) {
        if (this.isExpired()) {
            throw new Error('Mã xác thực đã hết hạn');
        }

        if (this.verificationCode !== code) {
            throw new Error('Mã xác thực không chính xác');
        }

        this.verified = true;
        await this.save();
        return true;
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

    /**
     * Cleanup expired verification records
     * @returns {Promise<boolean>} True if cleanup succeeded
     */
    static async cleanupExpired() {
        try {
            return await EmailVerificationDAO.deleteExpired();
        } catch (error) {
            console.error('Error cleaning up expired verifications:', error);
            throw new Error('Failed to cleanup expired verifications: ' + error.message);
        }
    }
}

export default EmailVerification; 