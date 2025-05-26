import BookingProcess from './BookingProcess.js';
import EmailVerification from '../EmailVerification.js';
import Appointment from '../Appointment.js';

export default class EmailVerificationProcess extends BookingProcess {
    async validateRequest() {
        if (!this.req.session.appointmentData) {
            throw new Error('No appointment data found in session');
        }

        const { verificationCode } = this.req.body;
        if (!verificationCode) {
            throw new Error('Verification code is required');
        }
    }

    async processData() {
        const { email } = this.req.session.appointmentData;
        const { verificationCode } = this.req.body;

        // Find and verify the code
        const verification = await EmailVerification.findByEmailAndCode(email, verificationCode);
        
        if (!verification) {
            throw new Error('Invalid verification code');
        }

        if (verification.isExpired()) {
            throw new Error('Verification code has expired');
        }

        return { verification };
    }

    async saveToDatabase(data) {
        // Verify the code
        await data.verification.verify(this.req.body.verificationCode);

        // Update appointment status
        const appointment = await Appointment.findById(data.verification.appointmentId);
        if (appointment) {
            appointment.emailVerified = true;
            appointment.status = 'waiting_payment';
            await appointment.save();
        }

        return { appointment };
    }

    async handleNextStep(data) {
        // Update session with appointment ID from verification
        this.req.session.appointmentData.appointmentId = data.verification.appointmentId;
        
        this.res.json({
            success: true,
            redirectUrl: '/patient/book-appointment/make-payment'
        });
    }
} 