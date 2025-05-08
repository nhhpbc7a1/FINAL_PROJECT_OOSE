import nodemailer from 'nodemailer';

// Check if we're in development mode
const isDev = process.env.NODE_ENV !== 'production';

// Create a real transporter for production
const createRealTransporter = () => {
    return nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });
};

// Create a mock transporter for development/testing
const createMockTransporter = () => {
    return {
        sendMail: async (mailOptions) => {
            console.log('MOCK EMAIL SENT:');
            console.log('To:', mailOptions.to);
            console.log('Subject:', mailOptions.subject);
            console.log('Verification Code:', mailOptions.html.match(/<h1[^>]*>(\d+)<\/h1>/)?.[1] || 'Not found');
            return { messageId: 'mock-email-id-' + Date.now() };
        }
    };
};

// Use the appropriate transporter
const transporter = isDev ? createMockTransporter() : createRealTransporter();

const emailService = {
    async sendVerificationEmail(toEmail, verificationCode) {
        try {
            // For demo/development, always use 123456 as code
            const codeToUse = isDev ? '123456' : verificationCode;
            
            const mailOptions = {
                from: process.env.EMAIL_USER || 'noreply@healthclinic.com',
                to: toEmail,
                subject: 'Verify Your Email for Appointment Booking',
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #0D6EFD;">Verify Your Email</h2>
                        <p>Thank you for booking an appointment. Please use the following code to verify your email:</p>
                        <div style="background-color: #f8f9fa; padding: 15px; border-radius: 8px; text-align: center; margin: 20px 0;">
                            <h1 style="color: #333; margin: 0; letter-spacing: 5px;">${codeToUse}</h1>
                        </div>
                        <p>This code will expire in 30 minutes.</p>
                        <p>If you didn't request this verification, please ignore this email.</p>
                        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                        <p style="color: #666; font-size: 12px;">This is an automated message, please do not reply.</p>
                    </div>
                `
            };

            // For demo/development purposes, log the verification code
            if (isDev) {
                console.log(`VERIFICATION CODE for ${toEmail}: ${codeToUse}`);
            }

            await transporter.sendMail(mailOptions);
            return true;
        } catch (error) {
            console.error('Error sending verification email:', error);
            // Don't throw in development/testing mode
            if (isDev) {
                console.log('Using mock verification code: 123456');
                return true;
            }
            throw new Error('Failed to send verification email');
        }
    },

    async sendAppointmentConfirmation(toEmail, appointmentDetails) {
        try {
            const mailOptions = {
                from: process.env.EMAIL_USER || 'noreply@healthclinic.com',
                to: toEmail,
                subject: 'Appointment Confirmation',
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #0D6EFD;">Appointment Confirmed</h2>
                        <p>Your appointment has been successfully booked and confirmed.</p>
                        
                        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                            <h3 style="color: #333; margin-top: 0;">Appointment Details</h3>
                            <p><strong>Date:</strong> ${appointmentDetails.date}</p>
                            <p><strong>Time:</strong> ${appointmentDetails.time}</p>
                            <p><strong>Doctor:</strong> ${appointmentDetails.doctorName}</p>
                            <p><strong>Specialty:</strong> ${appointmentDetails.specialtyName}</p>
                            <p><strong>Room:</strong> ${appointmentDetails.roomNumber}</p>
                            <p><strong>Queue Number:</strong> ${appointmentDetails.queueNumber}</p>
                        </div>
                        
                        <p>Please arrive 15 minutes before your scheduled appointment time.</p>
                        <p>If you need to reschedule or cancel your appointment, please contact us at least 24 hours in advance.</p>
                        
                        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                        <p style="color: #666; font-size: 12px;">This is an automated message, please do not reply.</p>
                    </div>
                `
            };

            if (isDev) {
                console.log('MOCK CONFIRMATION EMAIL SENT:', appointmentDetails);
                return true;
            }

            await transporter.sendMail(mailOptions);
            return true;
        } catch (error) {
            console.error('Error sending confirmation email:', error);
            // Don't throw in development/testing mode
            if (isDev) {
                return true;
            }
            throw new Error('Failed to send confirmation email');
        }
    }
};

export default emailService; 